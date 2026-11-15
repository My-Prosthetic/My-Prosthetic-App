import { Platform } from "react-native"
import { Directory, File, Paths } from "expo-file-system"
import * as Crypto from "expo-crypto"
import { eq } from "drizzle-orm"
import {
	db,
	getDatabaseSession,
	invalidateDatabaseSession,
	type DatabaseSession,
} from "@/db/client"
import { incidents } from "@/db/schema/incidents"
import { prostheses } from "@/db/schema/prostheses/prostheses"
import type { FileEntry } from "@/db/schema/fileEntries"
import {
	assertFileContext,
	assertFileOwner,
	forgetEntries,
	getOwnedEntries,
	getOwnedEntry,
	insertPendingEntry,
	markEntriesDeleting,
	markEntryReady,
	incidentPhotoUris,
} from "@/db/repositories/fileRepository"
import {
	contextKey,
	ManagedFileError,
	pickedFile,
	safeId,
	validFileName,
	type FileContext,
	type PickedFile,
} from "@/src/utils/fileMetadata"

export type FileAccess = { userId: number; session: DatabaseSession }
export function captureFileAccess(userId: number): FileAccess {
	assertFileOwner(userId)
	return { userId, session: getDatabaseSession()! }
}

let work: Promise<unknown> = Promise.resolve()
function exclusive<T>(access: FileAccess, operation: () => Promise<T> | T): Promise<T> {
	const expected = access.session
	const result = work.then(() => {
		if (!expected || getDatabaseSession() !== expected) throw new ManagedFileError("context")
		return operation()
	})
	work = result.catch((error: unknown) => console.warn("Managed file operation failed:", error))
	return result
}

function managedDirectory(entry: FileEntry, scope = getDatabaseSession()): Directory {
	if (!Number.isSafeInteger(entry.userId) || entry.userId <= 0)
		throw new ManagedFileError("context")
	const context = contextKey({
		type: entry.contextType,
		prosthesisId: entry.prosthesisId,
		resourceId: entry.resourceId,
	})
	if (!scope) throw new ManagedFileError("context")
	const prefix = `${scope.storagePrefix}users/${entry.userId}/${context}/`
	if (!entry.storagePath.startsWith(prefix)) throw new ManagedFileError("context")
	const segments = entry.storagePath.slice(prefix.length).split("/")
	segments.forEach(safeId)
	if (segments[segments.length - 1] !== entry.id) throw new ManagedFileError("context")
	return new Directory(Paths.document, "files", entry.storagePath)
}

function managedFile(entry: FileEntry): File {
	if (
		entry.kind !== "file" ||
		!validFileName(entry.name) ||
		!/^(\.[a-zA-Z0-9]{1,12})?$/.test(entry.extension)
	)
		throw new ManagedFileError("context")
	if (entry.fileName !== `${entry.name}${entry.extension}`) throw new ManagedFileError("context")
	return new File(managedDirectory(entry), entry.fileName)
}

function removePhysical(entry: FileEntry, scope = getDatabaseSession()) {
	const directory = managedDirectory(entry, scope)
	if (directory.exists) directory.delete()
}

export function filePreviewUri(entry: FileEntry): string | null {
	if (entry.kind !== "file" || entry.category !== "image") return null
	try {
		const owned = getOwnedEntry(entry.userId, entry.id)
		if (owned.state !== "ready") return null
		return managedFile(owned).uri
	} catch (error) {
		console.warn("Invalid file preview path:", error)
		return null
	}
}

function legacyIncidentFile(incidentId: string | null, uri: string): File {
	if (!incidentId) throw new ManagedFileError("context")
	const scope = getDatabaseSession()
	if (!scope) throw new ManagedFileError("context")
	const directory = new Directory(
		Paths.document,
		scope.storagePrefix,
		"incidents",
		safeId(incidentId)
	)
	const file = new File(uri)
	if (
		!file.parentDirectory.uri.replace(/\/?$/, "/").endsWith(`/incidents/${incidentId}/`) ||
		!validFileName(file.name) ||
		/[/\\]/.test(file.name)
	)
		throw new ManagedFileError("context")
	return new File(directory, file.name)
}

async function importIncidentMedia(userId: number) {
	const known = getOwnedEntries(userId)
	for (const incident of db.select().from(incidents).all()) {
		try {
			const prosthesis = db
				.select()
				.from(prostheses)
				.where(eq(prostheses.id, incident.prosthesisId))
				.get()
			if (!prosthesis) continue
			const context: FileContext = {
				type: "incident",
				prosthesisId: incident.prosthesisId,
				resourceId: incident.id,
			}
			for (const uri of [
				...incidentPhotoUris(incident.photoUrisJson, incident.id),
				...(incident.audioUri ? [incident.audioUri] : []),
			]) {
				try {
					if (known.some((entry) => entry.legacyUri === uri)) continue
					const source = legacyIncidentFile(incident.id, uri)
					if (!source.exists) {
						console.warn("Incident media is missing:", incident.id)
						continue
					}
					const picked = pickedFile({
						uri: source.uri,
						name: source.name,
						size: source.size,
						mimeType: source.type || null,
					})
					picked.createdAt = incident.createdAt
					let name = picked.name
					let suffix = 1
					while (
						known.some(
							(entry) =>
								entry.contextKey === contextKey(context) &&
								entry.parentId === null &&
								entry.nameKey === `${name}${picked.extension}`.toLowerCase()
						)
					)
						name = `${picked.name.slice(0, 100)} (${suffix++})`
					await saveEntry(userId, context, null, name, picked, uri)
					known.splice(0, known.length, ...getOwnedEntries(userId))
				} catch (error) {
					console.warn("Skipping incident attachment:", { incidentId: incident.id, error })
				}
			}
		} catch (error) {
			console.warn("Could not inspect incident media:", { incidentId: incident.id, error })
		}
	}
}

function recover(userId: number) {
	const unfinished = getOwnedEntries(userId).filter(
		(entry) => entry.state === "pending" || entry.state === "deleting"
	)
	for (const entry of unfinished) removePhysical(entry)
	forgetEntries(unfinished)
}

export function listManagedFiles(access: FileAccess): Promise<FileEntry[]> {
	return exclusive(access, async () => {
		const { userId } = access
		recover(userId)
		await importIncidentMedia(userId)
		return getOwnedEntries(userId).filter((entry) => entry.state === "ready")
	})
}

export function saveManagedEntry(
	access: FileAccess,
	context: FileContext,
	parentId: string | null,
	value: string,
	picked?: PickedFile
): Promise<void> {
	return exclusive(access, async () => {
		const { userId } = access
		recover(userId)
		await saveEntry(userId, context, parentId, value, picked)
	})
}

async function saveEntry(
	userId: number,
	context: FileContext,
	parentId: string | null,
	value: string,
	picked?: PickedFile,
	legacyUri: string | null = null
): Promise<void> {
	const scope = getDatabaseSession()
	assertFileContext(userId, context, legacyUri === null)
	const name = value.trim().normalize("NFC")
	if (!validFileName(name)) throw new ManagedFileError("invalidName")
	const key = contextKey(context)
	const id = Crypto.randomUUID()
	const parent = parentId ? getOwnedEntry(userId, parentId) : null
	if (parent && (parent.kind !== "folder" || parent.state !== "ready" || parent.contextKey !== key))
		throw new ManagedFileError("context")
	const extension = picked?.extension ?? ""
	if (!/^(\.[a-zA-Z0-9]{1,12})?$/.test(extension)) throw new ManagedFileError("invalidName")
	const entry: FileEntry = {
		id,
		userId,
		contextType: context.type,
		contextKey: key,
		prosthesisId: context.prosthesisId,
		resourceId: context.resourceId,
		parentId,
		parentKey: parentId ?? "",
		kind: picked ? "file" : "folder",
		name,
		nameKey: `${name}${extension}`.toLowerCase(),
		fileName: `${name}${extension}`,
		extension,
		mimeType: picked?.mimeType ?? null,
		category: picked?.category ?? null,
		storagePath: parent
			? `${parent.storagePath}/${id}`
			: `${scope!.storagePrefix}users/${userId}/${key}/${id}`,
		legacyUri,
		size: picked?.size ?? null,
		createdAt: picked?.createdAt ?? new Date().toISOString(),
		state: "pending",
	}
	insertPendingEntry(entry, legacyUri !== null)
	try {
		const directory = managedDirectory(entry)
		directory.create({ intermediates: true, idempotent: true })
		let size: number | null = null
		if (picked) {
			const source = new File(picked.uri)
			if (!source.exists) throw new ManagedFileError("missing")
			const target = managedFile(entry)
			await source.copy(target)
			if (!target.exists) throw new ManagedFileError("missing")
			size = target.size
		}
		assertFileOwner(userId)
		markEntryReady(id, size)
	} catch (error) {
		try {
			removePhysical(entry, scope)
			forgetEntries([entry])
		} catch (cleanupError) {
			console.error("Managed file cleanup will be retried:", cleanupError)
		}
		throw error
	}
}

export function deleteManagedEntry(access: FileAccess, id: string): Promise<void> {
	return exclusive(access, () => {
		const { userId } = access
		recover(userId)
		const owned = getOwnedEntries(userId)
		const root = owned.find((entry) => entry.id === id)
		if (!root || root.state !== "ready") return
		const entries = owned.filter(
			(entry) =>
				entry.state !== "ignored" &&
				(entry.id === root.id || entry.storagePath.startsWith(`${root.storagePath}/`))
		)
		markEntriesDeleting(entries)
		for (const entry of entries) removePhysical({ ...entry, state: "deleting" })
		forgetEntries(entries.map((entry) => ({ ...entry, state: "deleting" })))
	})
}

export function getManagedFile(
	access: FileAccess,
	id: string
): Promise<{ uri: string; contentUri: string | null; mimeType: string | null }> {
	return exclusive(access, () => {
		const { userId } = access
		const entry = getOwnedEntry(userId, id)
		if (entry.state !== "ready") throw new ManagedFileError("missing")
		const file = managedFile(entry)
		if (!file.exists) throw new ManagedFileError("missing")
		return {
			uri: file.uri,
			contentUri: Platform.OS === "android" ? file.contentUri : null,
			mimeType: entry.mimeType,
		}
	})
}

export function withFileSessionTransition<T>(changeSession: () => Promise<T>): Promise<T> {
	invalidateDatabaseSession()
	const result = work.then(changeSession)
	work = result.catch((error: unknown) => console.warn("Local session transition failed:", error))
	return result
}
