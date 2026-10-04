import { text, sqliteTable, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { brands } from "./brands"
import { COMPONENT_TYPES } from "@/src/constants/componentTypes"

export const models = sqliteTable("models", {
	id: text("id").primaryKey(),

	brandId: text("brand_id")
		.notNull()
		.references(() => brands.id, { onDelete: "cascade" }),

	name: text("name").notNull(),

	type: text("type", {
		enum: COMPONENT_TYPES,
	}).notNull(),

	isCustom: integer("is_custom", {
		mode: "boolean",
	})
		.notNull()
		.default(false),
	},
	(table) => [
		index("models_brand_type_idx").on(table.brandId, table.type),
		uniqueIndex("models_brand_type_name_unique_idx").on(table.brandId, table.type, table.name),
	]
)

export const modelsRelations = relations(models, ({ one }) => ({
	brand: one(brands, {
		fields: [models.brandId],
		references: [brands.id],
	}),
}))
