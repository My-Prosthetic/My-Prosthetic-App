import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { components } from "./prostheses/components"
import { prostheses } from "./prostheses/prostheses"

export const incidents = sqliteTable(
	"incidents",
	{
		id: text("id").primaryKey(),
		prosthesisId: text("prosthesis_id")
			.notNull()
			.references(() => prostheses.id),
		componentId: text("component_id").references(() => components.id),
		type: text("type").notNull(),
		coordinatesJson: text("coordinates_json"),
		intensity: integer("intensity"),
		activity: text("activity"),
		description: text("description"),
		occurredAt: text("occurred_at").notNull(),
		photoUrisJson: text("photo_uris_json").notNull().default("[]"),
		audioUri: text("audio_uri"),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
		deletedAt: text("deleted_at"),
		isDirty: integer("is_dirty", { mode: "boolean" }).notNull().default(true),
	},
	(table) => [
		index("incidents_prosthesis_id_idx").on(table.prosthesisId),
		index("incidents_component_id_idx").on(table.componentId),
		index("incidents_occurred_at_idx").on(table.occurredAt),
	]
)
