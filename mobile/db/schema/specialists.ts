import { relations } from "drizzle-orm"
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"

export const specialists = sqliteTable("specialists", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	surname: text("surname"),
	email: text("email"),
	phone: text("phone"),
})

export const specialistsRelations = relations(specialists, ({ many }) => ({
	messages: many(specialistMessages),
}))

export type Specialist = typeof specialists.$inferSelect

export const specialistMessages = sqliteTable(
	"specialist_messages",
	{
		id: text("id").primaryKey(),
		specialistId: text("specialist_id")
			.notNull()
			.references(() => specialists.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		createdAt: text("created_at").notNull(),
		isUnread: integer("is_unread", { mode: "boolean" }).notNull().default(true),
	},
	(table) => [
		index("specialist_messages_specialist_id_created_at_idx").on(
			table.specialistId,
			table.createdAt
		),
	]
)

export const specialistMessagesRelations = relations(specialistMessages, ({ one }) => ({
	specialist: one(specialists, {
		fields: [specialistMessages.specialistId],
		references: [specialists.id],
	}),
}))

export type SpecialistMessage = typeof specialistMessages.$inferSelect
