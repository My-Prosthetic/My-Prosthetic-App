import { and, asc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm"

import { db } from "../client"
import { incidents } from "../schema/incidents"
import { components } from "../schema/prostheses/components"
import { prostheses } from "../schema/prostheses/prostheses"
import { models } from "../schema/prostheses/models"
import { brands } from "../schema/prostheses/brands"

export type JournalEvent = {
	id: string
	kind: "incident" | "component"
	dateKey: string
	time: string | null
	title: string
	intensity: number | null
	activity: string | null
	prosthesis: string
	component: string | null
	description: string | null
}

export type JournalFilters = {
	search: string
	incidents: boolean
	components: boolean
	prosthesisId?: string
	incidentTypeMatches?: string[]
	activityMatches?: string[]
}

function localDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export async function getJournalEvents(
	start: Date,
	end: Date,
	filters: JournalFilters
): Promise<JournalEvent[]> {
	const search = filters.search.trim().toLocaleLowerCase()
	const startIso = start.toISOString()
	const endIso = end.toISOString()
	const startDay = localDateKey(start)
	const endDay = localDateKey(end)
	const matches = (...columns: (typeof incidents.type | typeof prostheses.name)[]) =>
		or(...columns.map((column) => sql<boolean>`instr(lower(${column}), ${search}) > 0`))
	const result: JournalEvent[] = []

	if (filters.incidents) {
		const rows = await db
			.select({
				id: incidents.id,
				occurredAt: incidents.occurredAt,
				type: incidents.type,
				intensity: incidents.intensity,
				activity: incidents.activity,
				description: incidents.description,
				prosthesis: prostheses.name,
				componentDescription: components.description,
				modelName: models.name,
				brandName: brands.name,
			})
			.from(incidents)
			.innerJoin(prostheses, eq(incidents.prosthesisId, prostheses.id))
			.leftJoin(components, eq(incidents.componentId, components.id))
			.leftJoin(models, eq(components.modelId, models.id))
			.leftJoin(brands, eq(models.brandId, brands.id))
			.where(
				and(
					isNull(incidents.deletedAt),
					isNull(prostheses.deletedAt),
					filters.prosthesisId ? eq(prostheses.id, filters.prosthesisId) : undefined,
					gte(incidents.occurredAt, startIso),
					lt(incidents.occurredAt, endIso),
					search
						? or(
								matches(incidents.type, prostheses.name),
								filters.incidentTypeMatches?.length
									? inArray(incidents.type, filters.incidentTypeMatches)
									: undefined,
								filters.activityMatches?.length
									? inArray(incidents.activity, filters.activityMatches)
									: undefined,
								sql<boolean>`instr(lower(coalesce(${incidents.activity}, '')), ${search}) > 0`,
								sql<boolean>`instr(lower(coalesce(${incidents.description}, '')), ${search}) > 0`,
								sql<boolean>`instr(lower(coalesce(${components.description}, '')), ${search}) > 0`,
								sql<boolean>`instr(lower(coalesce(${models.name}, '')), ${search}) > 0`,
								sql<boolean>`instr(lower(coalesce(${brands.name}, '')), ${search}) > 0`
							)
						: undefined
				)
			)
			.orderBy(asc(incidents.occurredAt))

		result.push(
			...rows.map((row) => {
				const date = new Date(row.occurredAt)
				return {
					id: row.id,
					kind: "incident" as const,
					dateKey: localDateKey(date),
					time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
					title: row.type,
					intensity: row.intensity,
					activity: row.activity,
					prosthesis: row.prosthesis,
					component:
						row.componentDescription?.trim() ||
						(row.brandName && row.modelName ? `${row.brandName} | ${row.modelName}` : null),
					description: row.description,
				}
			})
		)
	}

	if (filters.components) {
		// Assembly is the only recorded component operation; exchange and warranty dates are deadlines.
		const rows = await db
			.select({
				id: components.id,
				assemblyDate: components.assemblyDate,
				description: components.description,
				prosthesis: prostheses.name,
				modelName: models.name,
				brandName: brands.name,
			})
			.from(components)
			.innerJoin(prostheses, eq(components.prosthesisId, prostheses.id))
			.innerJoin(models, eq(components.modelId, models.id))
			.innerJoin(brands, eq(models.brandId, brands.id))
			.where(
				and(
					isNull(components.deletedAt),
					isNull(prostheses.deletedAt),
					filters.prosthesisId ? eq(prostheses.id, filters.prosthesisId) : undefined,
					or(
						and(
							sql<boolean>`length(${components.assemblyDate}) > 10`,
							gte(components.assemblyDate, startIso),
							lt(components.assemblyDate, endIso)
						),
						and(
							sql<boolean>`length(${components.assemblyDate}) = 10`,
							gte(components.assemblyDate, startDay),
							lt(components.assemblyDate, endDay)
						)
					),
					search
						? or(
								matches(prostheses.name),
								sql<boolean>`instr(lower(coalesce(${components.description}, '')), ${search}) > 0`,
								sql<boolean>`instr(lower(${models.name}), ${search}) > 0`,
								sql<boolean>`instr(lower(${brands.name}), ${search}) > 0`
							)
						: undefined
				)
			)
			.orderBy(asc(components.assemblyDate))

		result.push(
			...rows.map((row) => ({
				id: row.id,
				kind: "component" as const,
				dateKey:
					row.assemblyDate.length === 10
						? row.assemblyDate
						: localDateKey(new Date(row.assemblyDate)),
				time: null,
				title: row.modelName,
				intensity: null,
				activity: null,
				prosthesis: row.prosthesis,
				component: row.description?.trim() || `${row.brandName} | ${row.modelName}`,
				description: row.description,
			}))
		)
	}

	return result.sort((a, b) =>
		a.dateKey === b.dateKey
			? (a.time ?? "").localeCompare(b.time ?? "")
			: a.dateKey.localeCompare(b.dateKey)
	)
}
