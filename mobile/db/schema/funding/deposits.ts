import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { goals } from './goals'


export const deposits = sqliteTable('deposits', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    goalId: integer('goal_id').notNull()
        .references(() => goals.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    amount: integer('amout').notNull(),
    assignedAt: text('assigned_at').notNull(),
    note: text('note'),
});