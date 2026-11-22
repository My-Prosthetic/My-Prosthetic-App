import { and, eq, sql } from "drizzle-orm"

import { db } from "../client"
import { specialistMessages, type SpecialistMessage } from "../schema/specialistMessages"
import { specialists, type Specialist } from "../schema/specialists"

export type SpecialistWithRelations = NonNullable<Awaited<ReturnType<typeof getSpecialistById>>>
export type SpecialistListItem = Awaited<ReturnType<typeof getSpecialistsWithSummary>>[number]

export type UpsertSpecialistInput = Pick<Specialist, "id" | "name"> &
	Partial<Pick<Specialist, "surname" | "email" | "phone">>

export type UpsertSpecialistMessageInput = Pick<
	SpecialistMessage,
	"id" | "specialistId" | "content" | "createdAt"
>

export async function getSpecialistsWithSummary() {
	const [rows, unreadRows] = await Promise.all([
		db.query.specialists.findMany({
			with: {
				messages: {
					orderBy: (message, { desc }) => [desc(message.createdAt), desc(message.id)],
					limit: 1,
				},
			},
			orderBy: (fields, { asc }) => [asc(fields.name), asc(fields.id)],
		}),
		db
			.select({
				specialistId: specialistMessages.specialistId,
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(specialistMessages)
			.where(eq(specialistMessages.isUnread, true))
			.groupBy(specialistMessages.specialistId),
	])

	const unreadBySpecialist = new Map(unreadRows.map((row) => [row.specialistId, row.count]))

	return rows.map(({ messages, ...specialist }) => ({
		...specialist,
		lastMessage: messages[0] ?? null,
		unreadCount: unreadBySpecialist.get(specialist.id) ?? 0,
	}))
}

export async function getSpecialistById(id: string) {
	const specialist = await db.query.specialists.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	})

	return specialist ?? null
}

export async function getSpecialistWithMessagesById(id: string) {
	const specialist = await db.query.specialists.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
		with: {
			messages: {
				orderBy: (message, { desc }) => [desc(message.createdAt), desc(message.id)],
			},
		},
	})

	return specialist ?? null
}

export async function upsertSpecialist(input: UpsertSpecialistInput) {
	const optionalValues = {
		...(input.surname !== undefined ? { surname: input.surname } : {}),
		...(input.email !== undefined ? { email: input.email } : {}),
		...(input.phone !== undefined ? { phone: input.phone } : {}),
	}

	const [specialist] = await db
		.insert(specialists)
		.values({
			id: input.id,
			name: input.name,
			surname: input.surname ?? null,
			email: input.email ?? null,
			phone: input.phone ?? null,
		})
		.onConflictDoUpdate({
			target: specialists.id,
			set: { name: input.name, ...optionalValues },
		})
		.returning()

	if (!specialist) {
		throw new Error("Failed to save specialist")
	}

	return specialist
}

export async function upsertSpecialistMessage(input: UpsertSpecialistMessageInput) {
	const [message] = await db
		.insert(specialistMessages)
		.values(input)
		.onConflictDoUpdate({
			target: specialistMessages.id,
			set: {
				specialistId: input.specialistId,
				content: input.content,
				createdAt: input.createdAt,
			},
		})
		.returning()

	if (!message) {
		throw new Error("Failed to save specialist message")
	}

	return message
}

export async function markSpecialistMessagesAsRead(specialistId: string) {
	return db
		.update(specialistMessages)
		.set({ isUnread: false })
		.where(
			and(eq(specialistMessages.specialistId, specialistId), eq(specialistMessages.isUnread, true))
		)
		.returning()
}
