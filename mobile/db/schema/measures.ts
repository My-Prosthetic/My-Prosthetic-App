import { relations, sql } from "drizzle-orm"
import { check, integer, primaryKey, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core"

export const measures = sqliteTable(
	"measures",
	{
		id: text("id").primaryKey(),

		measuredAt: text("measured_at").notNull(),

		side: text("side", { enum: ["left", "right"] }).notNull(),

		limbType: text("limb_type", { enum: ["upper", "lower"] }).notNull(),

		isDirty: integer("is_dirty", { mode: "boolean" }).notNull().default(true),

		deletedAt: text("deleted_at"),

		updatedAt: text("updated_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		check("measures_side_check", sql`${table.side} IN ('left', 'right')`),
		check("measures_limb_type_check", sql`${table.limbType} IN ('upper', 'lower')`),
		check("measures_measured_at_check", sql`${table.measuredAt} GLOB '????-??-??T??:??:??.???Z'`),
		index("measures_latest_lookup_idx").on(table.side, table.limbType, table.measuredAt),
		index("measures_sync_idx").on(table.isDirty, table.deletedAt),
	]
)

export const measureLevels = sqliteTable(
	"measure_levels",
	{
		measureId: text("measure_id")
			.notNull()
			.references(() => measures.id, { onDelete: "cascade" }),

		level: integer("level").notNull(),

		distance: integer("distance").notNull(),

		value: real("value").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.measureId, table.level] }),
		check("measure_levels_level_check", sql`${table.level} BETWEEN 1 AND 5`),
		check("measure_levels_distance_check", sql`${table.distance} > 0`),
	]
)

export const measuresRelations = relations(measures, ({ many }) => ({
	levels: many(measureLevels),
}))

export const measureLevelsRelations = relations(measureLevels, ({ one }) => ({
	measure: one(measures, {
		fields: [measureLevels.measureId],
		references: [measures.id],
	}),
}))
