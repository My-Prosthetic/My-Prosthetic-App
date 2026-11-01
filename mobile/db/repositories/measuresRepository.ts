import { and, count, eq, isNull } from "drizzle-orm"

import { db } from "../client"
import { measures, measureLevels } from "@/db/schema/measures"

export type Measure = typeof measures.$inferSelect
export type MeasureLevel = typeof measureLevels.$inferSelect
export type MeasureWithLevels = NonNullable<Awaited<ReturnType<typeof getMeasureById>>>

export type CreateMeasureLevelInput = {
	level: number
	distance: number
	value: number
}

export type CreateMeasureInput = {
	id: string
	measuredAt: Date
	side: "left" | "right"
	limbType: "upper" | "lower"
	levels: CreateMeasureLevelInput[]
}

export type MeasuresPageQuery = {
	side: Measure["side"]
	limbType: Measure["limbType"]
	page: number
	pageSize: number
}

export type MeasuresPage = {
	items: MeasureWithLevels[]
	total: number
}

export async function createMeasure(input: CreateMeasureInput) {
	const now = new Date().toISOString()

	return await db.transaction(async (tx) => {
		const [measure] = await tx
			.insert(measures)
			.values({
				id: input.id,
				measuredAt: input.measuredAt.toISOString(),
				side: input.side,
				limbType: input.limbType,
				isDirty: true,
				updatedAt: now,
			})
			.returning()

		if (!measure) {
			throw new Error("Failed to create measure")
		}

		if (input.levels.length > 0) {
			await tx.insert(measureLevels).values(
				input.levels.map((lvl) => ({
					measureId: input.id,
					level: lvl.level,
					distance: lvl.distance,
					value: lvl.value,
				}))
			)
		}

		return measure
	})
}

export async function getMeasureById(id: string) {
	const measure = await db.query.measures.findFirst({
		where: (fields, { eq, and, isNull }) => and(eq(fields.id, id), isNull(fields.deletedAt)),
		with: {
			levels: {
				orderBy: (fields, { asc }) => [asc(fields.level)],
			},
		},
	})

	return measure ?? null
}

export async function getLatestMeasure(filter?: {
	side?: "left" | "right"
	limbType?: "upper" | "lower"
}) {
	const latest = await db.query.measures.findFirst({
		where: (fields, { eq, and, isNull }) => {
			const conditions = [isNull(fields.deletedAt)]
			if (filter?.side) conditions.push(eq(fields.side, filter.side))
			if (filter?.limbType) conditions.push(eq(fields.limbType, filter.limbType))
			return and(...conditions)
		},
		orderBy: (fields, { desc }) => [desc(fields.measuredAt), desc(fields.id)],
		with: {
			levels: {
				orderBy: (fields, { asc }) => [asc(fields.level)],
			},
		},
	})

	return latest ?? null
}

export async function getMeasuresPage({
	side,
	limbType,
	page,
	pageSize,
}: MeasuresPageQuery): Promise<MeasuresPage> {
	const where = and(
		eq(measures.side, side),
		eq(measures.limbType, limbType),
		isNull(measures.deletedAt)
	)

	const [items, [totalRow]] = await Promise.all([
		db.query.measures.findMany({
			where,
			orderBy: (fields, { desc }) => [desc(fields.measuredAt), desc(fields.id)],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			with: {
				levels: {
					orderBy: (fields, { asc }) => [asc(fields.level)],
				},
			},
		}),
		db.select({ total: count() }).from(measures).where(where),
	])

	return { items, total: totalRow?.total ?? 0 }
}

export async function deleteMeasure(id: string) {
	const now = new Date().toISOString()

	const [measure] = await db
		.update(measures)
		.set({
			deletedAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.where(and(eq(measures.id, id), isNull(measures.deletedAt)))
		.returning()

	return measure ?? null
}
