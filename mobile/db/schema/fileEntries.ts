import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
	type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core"
import { users } from "./users"
import type { FileCategory, FileContextType } from "@/src/utils/fileMetadata"

export const fileEntries = sqliteTable(
	"file_entries",
	{
		id: text("id").primaryKey(),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		contextType: text("context_type").$type<FileContextType>().notNull(),
		contextKey: text("context_key").notNull(),
		prosthesisId: text("prosthesis_id"),
		resourceId: text("resource_id"),
		parentId: text("parent_id").references((): AnySQLiteColumn => fileEntries.id, {
			onDelete: "restrict",
		}),
		parentKey: text("parent_key").notNull(),
		kind: text("kind", { enum: ["file", "folder"] }).notNull(),
		name: text("name").notNull(),
		nameKey: text("name_key").notNull(),
		fileName: text("file_name").notNull(),
		extension: text("extension").notNull().default(""),
		mimeType: text("mime_type"),
		category: text("category").$type<FileCategory>(),
		storagePath: text("storage_path").notNull(),
		legacyUri: text("legacy_uri"),
		size: integer("size"),
		createdAt: text("created_at").notNull(),
		state: text("state", { enum: ["pending", "ready", "deleting", "ignored"] }).notNull(),
	},
	(table) => [
		index("file_entries_owner_idx").on(table.userId, table.contextKey, table.parentKey),
		uniqueIndex("file_entries_sibling_name_idx").on(
			table.userId,
			table.contextKey,
			table.parentKey,
			table.nameKey
		),
	]
)

export type FileEntry = typeof fileEntries.$inferSelect
