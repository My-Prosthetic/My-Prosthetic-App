import * as Crypto from "expo-crypto"
import { and, eq, isNull } from "drizzle-orm"

import { db } from "../client"
import { prostheses } from "@/db/schema/prostheses/prostheses"
import { components } from "@/db/schema/prostheses/components"

export type Component = typeof components.$inferSelect

export type CreateComponentInput = {
	prosthesisId: string
	type: "socket" | "knee" | "foot" | "liner" | "adapter" | "other"
	name?: string
	manufacturer?: string
	model?: string
	serialNumber?: string
	isTestSocket?: boolean
	installedAt?: string
	warrantyUntil?: string
}

export type UpdateComponentInput = Partial<Omit<CreateComponentInput, "prosthesisId">>

export async function createComponent(input: CreateComponentInput) {
	const now = new Date().toISOString()

	const [prosthesis] = await db
		.select({ id: prostheses.id })
		.from(prostheses)
		.where(and(eq(prostheses.id, input.prosthesisId), isNull(prostheses.deletedAt)))

	if (!prosthesis) {
		throw new Error("Active prosthesis not found")
	}
	const [component] = await db

		.insert(components)
		.values({
			id: Crypto.randomUUID(),
			...input,
			createdAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.returning()

	if (!component) {
		throw new Error("Failed to create component")
	}

	return component
}

export async function getComponentById(id: string) {
	const [component] = await db
		.select()
		.from(components)
		.where(and(eq(components.id, id), isNull(components.deletedAt)))

	return component ?? null
}

export async function getComponentsByProsthesisId(prosthesisId: string) {
	return db
		.select()
		.from(components)
		.where(and(eq(components.prosthesisId, prosthesisId), isNull(components.deletedAt)))
}

export async function updateComponent(id: string, input: UpdateComponentInput) {
	const [component] = await db
		.update(components)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
			isDirty: true,
		})
		.where(and(eq(components.id, id), isNull(components.deletedAt)))
		.returning()

	return component ?? null
}

export async function deleteComponent(id: string) {
	const now = new Date().toISOString()

	const [component] = await db
		.update(components)
		.set({
			deletedAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.where(and(eq(components.id, id), isNull(components.deletedAt)))
		.returning()

	return component ?? null
}
