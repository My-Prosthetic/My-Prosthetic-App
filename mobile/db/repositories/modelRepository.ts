import * as Crypto from "expo-crypto"
import { and, asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../client"
import { brands } from "../schema/prostheses/brands"
import { models } from "../schema/prostheses/models"
import type { ComponentType } from "@/src/constants/componentTypes"

export type Model = typeof models.$inferSelect
export type ModelWithRelations = NonNullable<Awaited<ReturnType<typeof getModelById>>>

export type CreateModelInput = {
	brandId: string
	type: ComponentType
	name: string
}

export type ModelNameMatch = Pick<Model, "id" | "brandId" | "name" | "type"> & {
	brandName: string
}

export async function getModelById(id: string) {
	try {
		const model = await db.query.models.findFirst({
			where: (fields, { eq }) => eq(fields.id, id),
			with: {
				brand: true,
			},
		})

		return model ?? null
	} catch (error) {
		console.error("Failed to get model by ID", error)
		throw error
	}
}

export async function getModelsByBrandAndType(
	brandId: string,
	type: ComponentType
): Promise<Model[]> {
	try {
		return await db
			.select()
			.from(models)
			.where(and(eq(models.brandId, brandId), eq(models.type, type)))
			.orderBy(asc(models.name))
	} catch (error) {
		console.error("Failed to get models by brand and type", error)
		throw error
	}
}

export async function findModelsByName(
	name: string,
	type: ComponentType
): Promise<ModelNameMatch[]> {
	try {
		return await db
			.select({
				id: models.id,
				brandId: models.brandId,
				name: models.name,
				type: models.type,
				brandName: brands.name,
			})
			.from(models)
			.innerJoin(brands, eq(models.brandId, brands.id))
			.where(and(eq(models.type, type), sql`lower(${models.name}) = lower(${name.trim()})`))
	} catch (error) {
		console.error("Failed to find models by name", error)
		throw error
	}
}

export async function searchModels(
	brandId: string,
	type: ComponentType[],
	query: string
): Promise<Model[]> {
	try {
		if (type.length === 0) {
			return []
		}

		return await db
			.select()
			.from(models)
			.where(
				and(
					sql`${models.brandId} = ${brandId}`,
					inArray(models.type, type),
					sql`lower(${models.name}) LIKE ${`%${query.toLowerCase()}%`}`
				)
			)
			.orderBy(models.name)
	} catch (error) {
		console.error("Failed to search models", error)
		throw error
	}
}

export async function createModel(input: CreateModelInput): Promise<Model | null> {
	try {
		const [existingModel] = await db
			.select({ id: models.id })
			.from(models)
			.where(
				and(
					sql`${models.brandId} = ${input.brandId}`,
					sql`${models.type} = ${input.type}`,
					sql`lower(${models.name}) = lower(${input.name})`
				)
			)
			.limit(1)

		if (existingModel) {
			return null
		}

		const [model] = await db
			.insert(models)
			.values({
				id: Crypto.randomUUID(),
				...input,
				isCustom: true,
			})
			.returning()

		if (!model) {
			throw new Error("Failed to create model")
		}

		return model
	} catch (error) {
		console.error("Failed to create model", error)
		throw error
	}
}
