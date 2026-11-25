import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export type SharePermissions = {
	medical_history: boolean
	prostheses: string[]
	incidents: string[]
}

export const shares = sqliteTable(
	"shares",
	{
		id: text("id").primaryKey(),

		patientId: text("patient_id").notNull(),
		specialistId: text("specialist_id").notNull(),
		specialistName: text("specialist_name").notNull(),

		permissions: text("permissions", { mode: "json" }).$type<SharePermissions>().notNull(),

		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),

		deletedAt: text("deleted_at"),
	},
	(table) => [
		uniqueIndex("shares_patient_specialist_unique").on(table.patientId, table.specialistId),
	]
)
