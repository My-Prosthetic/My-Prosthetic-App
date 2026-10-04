import * as Crypto from "expo-crypto"
import { asc, sql } from "drizzle-orm"

import { db } from "../client"
import { brands } from "../schema/prostheses/brands"

export type Brand = typeof brands.$inferSelect

export async function getBrands(): Promise<Brand[]> {
	try {
		return await db.select().from(brands).orderBy(asc(brands.name))
	} catch (error) {
		console.error("Failed to get brands", error)
		throw error
	}
}

export async function searchBrands(query: string): Promise<Brand[]> {
	try {
		return await db
			.select()
			.from(brands)
			.where(sql`lower(${brands.name}) LIKE ${`%${query.toLowerCase()}%`}`)
			.orderBy(asc(brands.name))
	} catch (error) {
		console.error("Failed to search brands", error)
		throw error
	}
}

export async function createBrand(name: string): Promise<Brand | null> {
	try {
		const [existingBrand] = await db
			.select({ id: brands.id })
			.from(brands)
			.where(sql`lower(${brands.name}) = lower(${name})`)
			.limit(1)

		if (existingBrand) {
			return null
		}

		const [brand] = await db
			.insert(brands)
			.values({
				id: Crypto.randomUUID(),
				name,
				isCustom: true,
			})
			.returning()

		if (!brand) {
			throw new Error("Failed to create brand")
		}

		return brand
	} catch (error) {
		console.error("Failed to create brand", error)
		throw error
	}
}
