import { and, desc, eq } from "drizzle-orm"
import { db, getDatabaseSession } from "../client"
import { fileEntries, type FileEntry } from "../schema/fileEntries"
import { users } from "../schema/users"
import { prostheses } from "../schema/prostheses/prostheses"
import { components } from "../schema/prostheses/components"
import { models } from "../schema/prostheses/models"
import { brands } from "../schema/prostheses/brands"
import { incidents } from "../schema/incidents"
import { contextKey, ManagedFileError, type FileContext } from "@/src/utils/fileMetadata"

export function incidentPhotoUris(value: string, incidentId?: string): string[] {
	try {
		const parsed: unknown = JSON.parse(value)
		if (!Array.isArray(parsed)) {
			console.warn("Incident photo metadata is not an array:", incidentId)
			return []
		}
		return parsed.filter((item): item is string => {
			if (typeof item === "string" && item.length > 0) return true
			console.warn("Skipping an invalid incident photo reference:", incidentId)
			return false
		})
	} catch (error) {
		console.warn("Invalid incident photo JSON:", { incidentId, error })
		return []
	}
}

export function assertFileOwner(userId: number) {
	if (!getDatabaseSession()) throw new ManagedFileError("context")
	const current = db.select().from(users).orderBy(desc(users.id)).get()
	if (!current || current.id !== userId) throw new ManagedFileError("context")
}

export function assertFileContext(userId: number, context: FileContext, writable = true) {
	assertFileOwner(userId)
	contextKey(context)
	if (context.type === "general") return
	const prosthesis = db
		.select()
		.from(prostheses)
		.where(eq(prostheses.id, context.prosthesisId!))
		.get()
	if (!prosthesis || (writable && prosthesis.deletedAt)) throw new ManagedFileError("context")
	if (context.type === "component") {
		const component = db
			.select()
			.from(components)
			.where(eq(components.id, context.resourceId!))
			.get()
		if (!component || (writable && component.deletedAt) || component.prosthesisId !== prosthesis.id)
			throw new ManagedFileError("context")
	}
	if (context.type === "incident") {
		const incident = db.select().from(incidents).where(eq(incidents.id, context.resourceId!)).get()
		if (!incident || (writable && incident.deletedAt) || incident.prosthesisId !== prosthesis.id)
			throw new ManagedFileError("context")
	}
}

export type FileProsthesis = { id: string; name: string | null; deletedAt: string | null }
export function getFileProstheses(userId: number): FileProsthesis[] {
	assertFileOwner(userId)
	const items: FileProsthesis[] = db
		.select({ id: prostheses.id, name: prostheses.name, deletedAt: prostheses.deletedAt })
		.from(prostheses)
		.all()
	for (const entry of getOwnedEntries(userId)) {
		if (
			entry.state === "ready" &&
			entry.prosthesisId &&
			!items.some((item) => item.id === entry.prosthesisId)
		)
			items.push({ id: entry.prosthesisId, name: null, deletedAt: entry.createdAt })
	}
	return items
}

export function getOwnedEntries(userId: number): FileEntry[] {
	assertFileOwner(userId)
	return db.select().from(fileEntries).where(eq(fileEntries.userId, userId)).all()
}

export function getOwnedEntry(userId: number, id: string): FileEntry {
	assertFileOwner(userId)
	const entry = db
		.select()
		.from(fileEntries)
		.where(and(eq(fileEntries.userId, userId), eq(fileEntries.id, id)))
		.get()
	if (!entry) throw new ManagedFileError("missing")
	return entry
}

export type FileResourceFolder = {
	type: "component" | "incident"
	id: string
	prosthesisId: string
	description: string | null
	fallbackName: string | null
	occurredAt: string | null
	createdAt: string
	deletedAt: string | null
}

export function getFileResourceFolders(userId: number): FileResourceFolder[] {
	assertFileOwner(userId)
	const componentRows = db
		.select({
			id: components.id,
			prosthesisId: components.prosthesisId,
			description: components.description,
			createdAt: components.createdAt,
			deletedAt: components.deletedAt,
			modelName: models.name,
			brandName: brands.name,
		})
		.from(components)
		.leftJoin(models, eq(components.modelId, models.id))
		.leftJoin(brands, eq(models.brandId, brands.id))
		.all()
	const incidentRows = db
		.select({
			id: incidents.id,
			prosthesisId: incidents.prosthesisId,
			description: incidents.description,
			occurredAt: incidents.occurredAt,
			createdAt: incidents.createdAt,
			deletedAt: incidents.deletedAt,
		})
		.from(incidents)
		.all()
	return [
		...componentRows.map((item) => ({
			type: "component" as const,
			id: item.id,
			prosthesisId: item.prosthesisId,
			description: item.description,
			fallbackName: [item.brandName, item.modelName].filter(Boolean).join(" ") || null,
			occurredAt: null,
			createdAt: item.createdAt,
			deletedAt: item.deletedAt,
		})),
		...incidentRows.map((item) => ({
			type: "incident" as const,
			id: item.id,
			prosthesisId: item.prosthesisId,
			description: item.description,
			fallbackName: null,
			occurredAt: item.occurredAt,
			createdAt: item.createdAt,
			deletedAt: item.deletedAt,
		})),
	]
}

export function getFileIncidents(prosthesisId: string) {
	if (!getDatabaseSession()) throw new ManagedFileError("context")
	return db
		.select()
		.from(incidents)
		.where(eq(incidents.prosthesisId, prosthesisId))
		.all()
		.filter((item) => !item.deletedAt)
}

export function insertPendingEntry(entry: FileEntry, archivedImport = false) {
	assertFileContext(
		entry.userId,
		{
			type: entry.contextType,
			prosthesisId: entry.prosthesisId,
			resourceId: entry.resourceId,
		},
		!archivedImport
	)
	const siblings = getOwnedEntries(entry.userId).filter(
		(item) => item.contextKey === entry.contextKey && item.parentKey === entry.parentKey
	)
	if (siblings.some((item) => item.nameKey === entry.nameKey))
		throw new ManagedFileError("duplicate")
	db.insert(fileEntries).values(entry).run()
}

export function markEntryReady(id: string, size: number | null) {
	db.update(fileEntries).set({ state: "ready", size }).where(eq(fileEntries.id, id)).run()
}

export function markEntriesDeleting(entries: FileEntry[]) {
	db.transaction((tx) => {
		for (const entry of entries)
			tx.update(fileEntries)
				.set({ state: "deleting" })
				.where(and(eq(fileEntries.id, entry.id), eq(fileEntries.userId, entry.userId)))
				.run()
	})
}

export function forgetEntries(entries: FileEntry[]) {
	db.transaction((tx) => {
		for (const entry of [...entries].sort((a, b) => b.storagePath.length - a.storagePath.length)) {
			if (entry.state === "deleting" && entry.legacyUri) {
				tx.update(fileEntries)
					.set({ state: "ignored", nameKey: `ignored:${entry.id}` })
					.where(and(eq(fileEntries.id, entry.id), eq(fileEntries.userId, entry.userId)))
					.run()
				continue
			}

			tx.delete(fileEntries)
				.where(and(eq(fileEntries.id, entry.id), eq(fileEntries.userId, entry.userId)))
				.run()
		}
	})
}
