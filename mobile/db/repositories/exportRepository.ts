import { and, asc, eq, isNull } from "drizzle-orm"

import { db } from "@/db/client"
import { conditions } from "@/db/schema/medical/conditions"
import { medicalProfiles } from "@/db/schema/medical/medicalProfiles"
import { medications } from "@/db/schema/medical/medications"
import { getAllProstheses, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { getComponentsByProsthesisId, type Component } from "@/db/repositories/componentRepository"

export type RawExportRow = Record<string, unknown>

export interface ProsthesisExportSelection {
	prosthesisId: string
	includeComponents: boolean
	includeIncidents: boolean
}

export interface BuildStructuredExportOptions {
	fromIso: string
	toIso: string
	includeMedicalProfile: boolean
	prostheses: ProsthesisExportSelection[]
}

export interface MedicalProfileExport {
	profile: typeof medicalProfiles.$inferSelect
	conditions: (typeof conditions.$inferSelect)[]
	medications: (typeof medications.$inferSelect)[]
}

export interface ProsthesisExport {
	prosthesis: Prosthesis
	components?: Component[]
	incidents?: RawExportRow[]
}

export interface StructuredDataExport {
	schemaVersion: 1
	source: "my-prosthetic-app"
	exportedAt: string
	dateRange: {
		from: string
		to: string
	}
	selection: {
		medicalProfile: boolean
		prostheses: ProsthesisExportSelection[]
	}
	data: {
		medicalProfile?: MedicalProfileExport
		prostheses: ProsthesisExport[]
	}
}

type RawSqliteClient = {
	getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>
	getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>
}

function getRawClient() {
	return (db as unknown as { $client: RawSqliteClient }).$client
}

async function getMedicalProfileSnapshot(): Promise<MedicalProfileExport | undefined> {
	const [profile] = await db
		.select()
		.from(medicalProfiles)
		.where(isNull(medicalProfiles.deletedAt))
		.orderBy(asc(medicalProfiles.createdAt), asc(medicalProfiles.id))
		.limit(1)

	if (!profile) {
		return undefined
	}

	const [profileConditions, profileMedications] = await Promise.all([
		db
			.select()
			.from(conditions)
			.where(and(eq(conditions.medicalProfileId, profile.id), isNull(conditions.deletedAt)))
			.orderBy(asc(conditions.createdAt), asc(conditions.id)),
		db
			.select()
			.from(medications)
			.where(and(eq(medications.medicalProfileId, profile.id), isNull(medications.deletedAt)))
			.orderBy(asc(medications.createdAt), asc(medications.id)),
	])

	return {
		profile,
		conditions: profileConditions,
		medications: profileMedications,
	}
}

async function tableExists(tableName: string) {
	const client = getRawClient()

	const result = await client.getFirstAsync<{ name: string }>(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
		[tableName]
	)

	return Boolean(result)
}

async function getTableColumns(tableName: string) {
	const client = getRawClient()
	const rows = await client.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`)

	return new Set(rows.map((row) => row.name))
}

function findFirstExistingColumn(columns: Set<string>, candidates: readonly string[]) {
	return candidates.find((candidate) => columns.has(candidate))
}

const INCIDENT_DATE_COLUMNS = [
	"occurred_at",
	"incident_at",
	"created_at",
	"recorded_at",
	"timestamp",
	"date",
] as const

const INCIDENT_PROSTHESIS_COLUMNS = ["prosthesis_id", "prosthesisId"] as const

const INCIDENT_COMPONENT_COLUMNS = ["component_id", "componentId"] as const

async function getIncidentsForDateRange(fromIso: string, toIso: string) {
	if (!(await tableExists("incidents"))) {
		return {
			rows: [] as RawExportRow[],
			prosthesisColumn: undefined as string | undefined,
			componentColumn: undefined as string | undefined,
		}
	}

	const client = getRawClient()
	const columns = await getTableColumns("incidents")
	const dateColumn = findFirstExistingColumn(columns, INCIDENT_DATE_COLUMNS)
	const prosthesisColumn = findFirstExistingColumn(columns, INCIDENT_PROSTHESIS_COLUMNS)
	const componentColumn = findFirstExistingColumn(columns, INCIDENT_COMPONENT_COLUMNS)

	if (!dateColumn) {
		console.warn("[Export] incidents table exists but no supported date column was found.")
		return {
			rows: [] as RawExportRow[],
			prosthesisColumn,
			componentColumn,
		}
	}

	const where = [`${dateColumn} >= ?`, `${dateColumn} <= ?`]

	if (columns.has("deleted_at")) {
		where.push("deleted_at IS NULL")
	}

	const rows = await client.getAllAsync<RawExportRow>(
		`
			SELECT *
			FROM incidents
			WHERE ${where.join(" AND ")}
			ORDER BY ${dateColumn} ASC
		`,
		[fromIso, toIso]
	)

	return {
		rows,
		prosthesisColumn,
		componentColumn,
	}
}

function incidentsForProsthesis(
	incidentRows: RawExportRow[],
	prosthesis: Prosthesis,
	components: Component[],
	prosthesisColumn?: string,
	componentColumn?: string
) {
	const componentIds = new Set(components.map((component) => component.id))

	return incidentRows.filter((incident) => {
		const linkedDirectly =
			prosthesisColumn !== undefined && String(incident[prosthesisColumn] ?? "") === prosthesis.id

		const linkedThroughComponent =
			componentColumn !== undefined && componentIds.has(String(incident[componentColumn] ?? ""))

		return linkedDirectly || linkedThroughComponent
	})
}

export async function buildStructuredExport({
	fromIso,
	toIso,
	includeMedicalProfile,
	prostheses: selectedProstheses,
}: BuildStructuredExportOptions): Promise<StructuredDataExport> {
	const allProstheses = await getAllProstheses()
	const prosthesesById = new Map(allProstheses.map((prosthesis) => [prosthesis.id, prosthesis]))

	const medicalProfile = includeMedicalProfile ? await getMedicalProfileSnapshot() : undefined

	const needsIncidents = selectedProstheses.some((selection) => selection.includeIncidents)

	const incidentSnapshot = needsIncidents
		? await getIncidentsForDateRange(fromIso, toIso)
		: {
				rows: [] as RawExportRow[],
				prosthesisColumn: undefined,
				componentColumn: undefined,
			}

	const exportedProstheses: ProsthesisExport[] = []

	for (const selection of selectedProstheses) {
		const prosthesis = prosthesesById.get(selection.prosthesisId)

		if (!prosthesis) {
			continue
		}

		const components =
			selection.includeComponents || selection.includeIncidents
				? await getComponentsByProsthesisId(prosthesis.id)
				: []

		const entry: ProsthesisExport = {
			prosthesis,
		}

		if (selection.includeComponents) {
			entry.components = components
		}

		if (selection.includeIncidents) {
			entry.incidents = incidentsForProsthesis(
				incidentSnapshot.rows,
				prosthesis,
				components,
				incidentSnapshot.prosthesisColumn,
				incidentSnapshot.componentColumn
			)
		}

		exportedProstheses.push(entry)
	}

	return {
		schemaVersion: 1,
		source: "my-prosthetic-app",
		exportedAt: new Date().toISOString(),
		dateRange: {
			from: fromIso,
			to: toIso,
		},
		selection: {
			medicalProfile: includeMedicalProfile,
			prostheses: selectedProstheses,
		},
		data: {
			...(medicalProfile ? { medicalProfile } : {}),
			prostheses: exportedProstheses,
		},
	}
}

export function hasExportableData(exportData: StructuredDataExport) {
	if (exportData.data.medicalProfile) {
		return true
	}

	return exportData.data.prostheses.some((prosthesisEntry) => {
		const hasComponents = (prosthesisEntry.components?.length ?? 0) > 0
		const hasIncidents = (prosthesisEntry.incidents?.length ?? 0) > 0

		return hasComponents || hasIncidents
	})
}
