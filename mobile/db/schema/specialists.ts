import { relations } from "drizzle-orm"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { specialistMessages } from "./specialistMessages"

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
