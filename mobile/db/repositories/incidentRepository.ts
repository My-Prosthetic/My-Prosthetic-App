import * as Crypto from "expo-crypto"
import { and, eq, isNull } from "drizzle-orm"

import { db } from "../client"
import { incidents } from "../schema/incidents"
import { components } from "../schema/prostheses/components"
import { prostheses } from "../schema/prostheses/prostheses"

export type Incident = typeof incidents.$inferSelect

export type IncidentCoordinates = {
	x: number
	y: number
	view: "side" | "top_inside" | "front_back"
}

export type CreateIncidentInput = {
	id?: string
	prosthesisId: string
	componentId?: string
	type: string
	coordinates?: IncidentCoordinates
	intensity?: number
	activity?: string
	description?: string
	occurredAt: string
	photoUris?: string[]
	audioUri?: string
}

export async function createIncident(input: CreateIncidentInput) {
	const now = new Date().toISOString()

	const [prosthesis] = await db
		.select({ id: prostheses.id })
		.from(prostheses)
		.where(and(eq(prostheses.id, input.prosthesisId), isNull(prostheses.deletedAt)))

	if (!prosthesis) {
		throw new Error("Active prosthesis not found")
	}

	if (input.componentId) {
		const [component] = await db
			.select({ id: components.id })
			.from(components)
			.where(
				and(
					eq(components.id, input.componentId),
					eq(components.prosthesisId, input.prosthesisId),
					isNull(components.deletedAt)
				)
			)

		if (!component) {
			throw new Error("Component does not belong to the selected prosthesis")
		}
	}

	const [incident] = await db
		.insert(incidents)
		.values({
			id: input.id ?? Crypto.randomUUID(),
			prosthesisId: input.prosthesisId,
			componentId: input.componentId ?? null,
			type: input.type,
			coordinatesJson: input.coordinates ? JSON.stringify(input.coordinates) : null,
			intensity: input.intensity ?? null,
			activity: input.activity || null,
			description: input.description?.trim() || null,
			occurredAt: input.occurredAt,
			photoUrisJson: JSON.stringify(input.photoUris ?? []),
			audioUri: input.audioUri ?? null,
			createdAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.returning()

	if (!incident) {
		throw new Error("Failed to create incident")
	}

	return incident
}

export async function getIncidentCustomValues() {
	const rows = await db
		.select({ type: incidents.type, activity: incidents.activity })
		.from(incidents)
		.where(isNull(incidents.deletedAt))

	return {
		types: [...new Set(rows.map((row) => row.type).filter(Boolean))],
		activities: [
			...new Set(rows.map((row) => row.activity).filter((value): value is string => !!value)),
		],
	}
}
