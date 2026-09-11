import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
})

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

	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	deletedAt: text("deleted_at"),

	isDirty: integer("is_dirty", {
		mode: "boolean",
	})
		.notNull()
		.default(true),
})

export const components = sqliteTable("components", {
	id: text("id").primaryKey(),

	prosthesisId: text("prosthesis_id")
		.notNull()
		.references(() => prostheses.id, {
			onDelete: "cascade",
		}),

	type: text("type", {
		enum: ["socket", "knee", "foot", "liner", "adapter", "other"],
	}).notNull(),

	name: text("name"),
	manufacturer: text("manufacturer"),
	model: text("model"),
	serialNumber: text("serial_number"),

	isTestSocket: integer("is_test_socket", {
		mode: "boolean",
	}),

	installedAt: text("installed_at"),
	warrantyUntil: text("warranty_until"),

	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	deletedAt: text("deleted_at"),

	isDirty: integer("is_dirty", {
		mode: "boolean",
	})
		.notNull()
		.default(true),
})
