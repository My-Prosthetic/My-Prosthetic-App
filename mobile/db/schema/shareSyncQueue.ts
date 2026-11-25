import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { SharePermissions } from "./shares"

export const shareSyncQueue = sqliteTable("share_sync_queue", {
	id: text("id").primaryKey(),

	patientId: text("patient_id").notNull(),
	specialistId: text("specialist_id").notNull(),

	operation: text("operation", {
		enum: ["create", "update", "delete"],
	}).notNull(),

	permissions: text("permissions", { mode: "json" }).$type<SharePermissions>(),

	status: text("status", {
		enum: ["pending", "failed"],
	})
		.notNull()
		.default("pending"),

	attempts: integer("attempts").notNull().default(0),

	lastError: text("last_error"),

	createdAt: text("created_at").notNull(),
})
