import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const goals = sqliteTable('goals', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    amount: integer('amount').notNull(),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    note: text('note'),
});