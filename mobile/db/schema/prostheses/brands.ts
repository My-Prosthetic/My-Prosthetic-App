import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const brands = sqliteTable(
	"brands",
	{
		id: text("id").primaryKey(),

		name: text("name").notNull(),

		isCustom: integer("is_custom", {
			mode: "boolean",
		})
			.notNull()
			.default(false),
	},
	(table) => [uniqueIndex("brands_name_unique_idx").on(table.name)]
)
