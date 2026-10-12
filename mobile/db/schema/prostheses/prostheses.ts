import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const prostheses = sqliteTable("prostheses", {
	id: text("id").primaryKey(),

	name: text("name").notNull(),

	side: text("side", {
		enum: ["left", "right"],
	}).notNull(),

	limbType: text("limb_type", {
		enum: ["upper", "lower"],
	}).notNull(),

	amputationLevel: text("amputation_level").notNull(),

	description: text("description"),

	startedAt: text("started_at"),

	replacementDate: text("replacement_date"),

	createdAt: text("created_at").notNull(),

	updatedAt: text("updated_at").notNull(),

	deletedAt: text("deleted_at"),

	isDirty: integer("is_dirty", {
		mode: "boolean",
	})
		.notNull()
		.default(true),
})
