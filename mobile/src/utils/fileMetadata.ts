import type { FileEntry } from "@/db/schema/fileEntries"

export const FILE_CATEGORIES = ["image", "video", "pdf", "model", "audio", "document"] as const
export type FileCategory = (typeof FILE_CATEGORIES)[number]
export type FileContextType = "general" | "prosthesis" | "component" | "incident"
export type FileContext = {
	type: FileContextType
	prosthesisId: string | null
	resourceId: string | null
}
export const GENERAL_FILES: FileContext = { type: "general", prosthesisId: null, resourceId: null }

export function filterFileEntries(
	entries: FileEntry[],
	filter: FileContext,
	folderId: string | null,
	query: string,
	language: string
): FileEntry[] {
	const search = query.trim().toLocaleLowerCase(language)
	return entries
		.filter((entry) => {
			if (folderId) return entry.parentId === folderId
			if (entry.parentId !== null || entry.contextType !== filter.type) return false
			if (filter.prosthesisId && entry.prosthesisId !== filter.prosthesisId) return false
			return !filter.resourceId || entry.resourceId === filter.resourceId
		})
		.filter((entry) => entry.name.toLocaleLowerCase(language).includes(search))
		.sort((a, b) =>
			a.kind !== b.kind ? (a.kind === "folder" ? -1 : 1) : b.createdAt.localeCompare(a.createdAt)
		)
}

export type PickedFile = {
	uri: string
	name: string
	extension: string
	mimeType: string | null
	size: number | null
	category: FileCategory
	createdAt: string
}

export class ManagedFileError extends Error {
	constructor(
		public readonly code: "invalidName" | "duplicate" | "context" | "missing" | "unavailable"
	) {
		super(code)
	}
}

export function validFileName(value: string): boolean {
	const name = value.trim()
	return (
		name.length > 0 &&
		name.length <= 120 &&
		!/[\x00-\x1f\x7f/\\:*?"<>|]/.test(name) &&
		!/[. ]$/.test(name) &&
		name !== "." &&
		name !== ".." &&
		!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
	)
}

export function safeId(value: string): string {
	if (!/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new ManagedFileError("context")
	return value
}

export function contextKey(context: FileContext): string {
	if (context.type === "general") {
		if (context.prosthesisId || context.resourceId) throw new ManagedFileError("context")
		return "general"
	}
	if (!context.prosthesisId) throw new ManagedFileError("context")
	const base = `prostheses/${safeId(context.prosthesisId)}`
	if (context.type === "prosthesis") {
		if (context.resourceId) throw new ManagedFileError("context")
		return `${base}/general`
	}
	if (!context.resourceId) throw new ManagedFileError("context")
	return `${base}/${context.type}s/${safeId(context.resourceId)}`
}

export function fileCategory(extension: string, mime: string | null): FileCategory {
	if (
		[".obj", ".stl", ".ply", ".gltf", ".glb", ".3mf", ".fbx", ".step", ".stp"].includes(
			extension.toLowerCase()
		)
	)
		return "model"
	if (mime?.startsWith("image/") || /\.(jpe?g|png|heic|heif|gif|webp|bmp|tiff?)$/i.test(extension))
		return "image"
	if (mime?.startsWith("video/") || /\.(mp4|mov|m4v|avi|webm|mkv)$/i.test(extension)) return "video"
	if (mime?.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(extension))
		return "audio"
	if (extension.toLowerCase() === ".pdf" || mime === "application/pdf") return "pdf"
	return "document"
}

export function pickedFile(input: {
	uri: string
	name?: string | null
	mimeType?: string | null
	size?: number | null
}): PickedFile {
	const original =
		input.name || decodeURIComponent(input.uri.split(/[?#]/)[0].split("/").pop() || "file")
	const match = original.match(/^(.*)(\.[a-zA-Z0-9]{1,12})$/)
	const extension = match?.[2] ?? ""
	const name =
		(match?.[1] || original)
			.normalize("NFC")
			.replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g, "_")
			.replace(/[. ]+$/, "")
			.slice(0, 120) || "file"
	return {
		uri: input.uri,
		name,
		extension,
		mimeType: input.mimeType ?? null,
		size: input.size != null && Number.isFinite(input.size) && input.size >= 0 ? input.size : null,
		category: fileCategory(extension, input.mimeType ?? null),
		createdAt: new Date().toISOString(),
	}
}

export function formatFileSize(size: number | null, language: string): string | null {
	if (size === null || !Number.isFinite(size) || size < 0) return null
	const units = ["B", "KB", "MB", "GB", "TB"]
	const index =
		size > 0
			? Math.max(0, Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1))
			: 0
	return `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(size / 1024 ** index)} ${units[index]}`
}
