import * as Crypto from "expo-crypto"
import { and, eq, isNull } from "drizzle-orm"

import { db } from "../client"
import { prostheses } from "@/db/schema/prostheses/prostheses"
import { components } from "@/db/schema/prostheses/components"

export type Component = typeof components.$inferSelect
export type ComponentWithRelations = NonNullable<Awaited<ReturnType<typeof getComponentById>>>

export type CreateComponentInput = {
	prosthesisId: string
	modelId: string
	isFinal?: boolean
	isHistorical: boolean
	assemblyDate: string
	warrantyEndDate?: string
	expectedExchangeDate?: string
	description?: string
	remindExchangeEmail?: boolean
	remindExchangeApp?: boolean
	remindExchangePush?: boolean
	remindWarrantyEmail?: boolean
	remindWarrantyApp?: boolean
	remindWarrantyPush?: boolean
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
	const component = await db.query.components.findFirst({
		where: (fields, { eq, and, isNull }) => and(eq(fields.id, id), isNull(fields.deletedAt)),
		with: {
			model: {
				with: {
					brand: true,
				},
			},
		},
	})

	return component ?? null
}

export async function getComponentsByProsthesisId(prosthesisId: string) {
	const component = await db.query.components.findMany({
		where: (fields, { eq, and, isNull }) =>
			and(eq(fields.prosthesisId, prosthesisId), isNull(fields.deletedAt)),
		with: {
			model: {
				with: {
					brand: true,
				},
			},
		},
	})

	return component ?? null
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
