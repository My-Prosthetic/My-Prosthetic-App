import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { medicalProfiles } from "./medicalProfiles"

export const medications = sqliteTable(
	"medications",
	{
		id: text("id").primaryKey(),

		medicalProfileId: text("medical_profile_id")
			.notNull()
			.references(() => medicalProfiles.id),

		name: text("name").notNull(),

		usage: text("usage").notNull(),

		createdAt: text("created_at").notNull(),

		updatedAt: text("updated_at").notNull(),

		deletedAt: text("deleted_at"),

		isDirty: integer("is_dirty", {
			mode: "boolean",
		})
			.notNull()
			.default(true),
	},
	(table) => [index("medications_medical_profile_id_idx").on(table.medicalProfileId)]
)

export type Medication = typeof medications.$inferSelect
