import * as Crypto from "expo-crypto"
import { asc, sql } from "drizzle-orm"

import { db } from "../client"
import { brands } from "../schema/prostheses/brands"

import { DuplicateBrandError } from "../errors"

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

export async function findBrandByName(name: string): Promise<Brand | null> {
	try {
		const [brand] = await db
			.select()
			.from(brands)
			.where(sql`lower(${brands.name}) = lower(${name.trim()})`)
			.limit(1)

		return brand ?? null
	} catch (error) {
		console.error("Failed to find brand by name", error)
		throw error
	}
}

export async function createBrand(name: string): Promise<Brand> {
	const existingBrand = await findBrandByName(name)

	if (existingBrand) {
		throw new DuplicateBrandError(name, existingBrand.id)
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
}
