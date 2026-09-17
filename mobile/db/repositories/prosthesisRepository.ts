import * as Crypto from "expo-crypto"
import { and, eq, isNull, desc } from "drizzle-orm"

import { db } from "../client"
import { prostheses } from "@/db/schema/prostheses/prostheses"
import { components } from "@/db/schema/prostheses/components"

export type Prosthesis = typeof prostheses.$inferSelect

export type CreateProsthesisInput = {
	name: string
	side: "left" | "right"
	limbType: "upper" | "lower"
	amputationLevel: string
}

export type UpdateProsthesisInput = Partial<CreateProsthesisInput>

export async function createProsthesis(input: CreateProsthesisInput) {
	const now = new Date().toISOString()

	const [prosthesis] = await db
		.insert(prostheses)
		.values({
			id: Crypto.randomUUID(),
			...input,
			createdAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.returning()

	if (!prosthesis) {
		throw new Error("Failed to create prosthesis")
	}

	return prosthesis
}

export async function getProsthesisById(id: string) {
	const [prosthesis] = await db
		.select()
		.from(prostheses)
		.where(and(eq(prostheses.id, id), isNull(prostheses.deletedAt)))

	return prosthesis ?? null
}

export async function getAllProstheses() {
	return db
		.select()
		.from(prostheses)
		.where(isNull(prostheses.deletedAt))
		.orderBy(desc(prostheses.createdAt))
}

export async function updateProsthesis(id: string, input: UpdateProsthesisInput) {
	const [prosthesis] = await db
		.update(prostheses)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
			isDirty: true,
		})
		.where(and(eq(prostheses.id, id), isNull(prostheses.deletedAt)))
		.returning()

	return prosthesis ?? null
}

export async function deleteProsthesis(id: string) {
	const now = new Date().toISOString()

	return db.transaction(async (tx) => {
		const [prosthesis] = await tx
			.update(prostheses)
			.set({
				deletedAt: now,
				updatedAt: now,
				isDirty: true,
			})
			.where(and(eq(prostheses.id, id), isNull(prostheses.deletedAt)))
			.returning()

		if (!prosthesis) {
			return null
		}

		await tx
			.update(components)
			.set({
				deletedAt: now,
				updatedAt: now,
				isDirty: true,
			})
			.where(and(eq(components.prosthesisId, id), isNull(components.deletedAt)))

		return prosthesis
	})
}
