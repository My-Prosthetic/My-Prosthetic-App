import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const medicalProfiles = sqliteTable("medical_profiles", {
	id: text("id").primaryKey(),

	kLevel: text("k_level", {
		enum: ["K0", "K1", "K2", "K3", "K4"],
	}),

	createdAt: text("created_at").notNull(),

	updatedAt: text("updated_at").notNull(),

	deletedAt: text("deleted_at"),

	isDirty: integer("is_dirty", {
		mode: "boolean",
	})
		.notNull()
		.default(true),
})

export type MedicalProfile = typeof medicalProfiles.$inferSelect
export type MedicalKLevel = NonNullable<MedicalProfile["kLevel"]>
