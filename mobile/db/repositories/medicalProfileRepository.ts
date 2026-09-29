import * as Crypto from "expo-crypto"
import { and, asc, eq, isNull } from "drizzle-orm"

import { db } from "../client"
import { conditions } from "../schema/medical/conditions"
import { medicalProfiles, type MedicalKLevel } from "../schema/medical/medicalProfiles"
import { medications } from "../schema/medical/medications"

export type CreateMedicalConditionInput = {
	name: string
}

export type CreateMedicalMedicationInput = {
	name: string
	usage: string
}

async function getActiveMedicalProfile() {
	const [profile] = await db
		.select()
		.from(medicalProfiles)
		.where(isNull(medicalProfiles.deletedAt))
		.orderBy(asc(medicalProfiles.createdAt), asc(medicalProfiles.id))
		.limit(1)

	return profile ?? null
}

async function requireActiveMedicalProfile() {
	return getOrCreateMedicalProfile()
}

export async function getOrCreateMedicalProfile() {
	const existingProfile = await getActiveMedicalProfile()

	if (existingProfile) {
		return existingProfile
	}

	const now = new Date().toISOString()

	const [profile] = await db
		.insert(medicalProfiles)
		.values({
			id: Crypto.randomUUID(),
			kLevel: null,
			createdAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.returning()

	if (!profile) {
		throw new Error("Failed to create medical profile")
	}

	return profile
}

export async function getMedicalProfileData() {
	const profile = await getOrCreateMedicalProfile()

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

export async function updateMedicalKLevel(kLevel: MedicalKLevel) {
	const profile = await requireActiveMedicalProfile()
	const now = new Date().toISOString()

	const [updatedProfile] = await db
		.update(medicalProfiles)
		.set({
			kLevel,
			updatedAt: now,
			isDirty: true,
		})
		.where(and(eq(medicalProfiles.id, profile.id), isNull(medicalProfiles.deletedAt)))
		.returning()

	if (!updatedProfile) {
		throw new Error("Failed to update K-Level")
	}

	return updatedProfile
}

export async function addMedicalCondition(input: CreateMedicalConditionInput) {
	const profile = await requireActiveMedicalProfile()
	const now = new Date().toISOString()

	const [condition] = await db
		.insert(conditions)
		.values({
			id: Crypto.randomUUID(),
			medicalProfileId: profile.id,
			name: input.name,
			createdAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.returning()

	if (!condition) {
		throw new Error("Failed to create medical condition")
	}

	return condition
}

export async function addMedicalMedication(input: CreateMedicalMedicationInput) {
	const profile = await requireActiveMedicalProfile()
	const now = new Date().toISOString()

	const [medication] = await db
		.insert(medications)
		.values({
			id: Crypto.randomUUID(),
			medicalProfileId: profile.id,
			name: input.name,
			usage: input.usage,
			createdAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.returning()

	if (!medication) {
		throw new Error("Failed to create medication")
	}

	return medication
}

export async function deleteMedicalCondition(id: string) {
	const now = new Date().toISOString()

	const [condition] = await db
		.update(conditions)
		.set({
			deletedAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.where(and(eq(conditions.id, id), isNull(conditions.deletedAt)))
		.returning()

	return condition ?? null
}

export async function deleteMedicalMedication(id: string) {
	const now = new Date().toISOString()

	const [medication] = await db
		.update(medications)
		.set({
			deletedAt: now,
			updatedAt: now,
			isDirty: true,
		})
		.where(and(eq(medications.id, id), isNull(medications.deletedAt)))
		.returning()

	return medication ?? null
}

export async function deleteMedicalProfile() {
	const profile = await getActiveMedicalProfile()

	if (!profile) {
		return null
	}

	const now = new Date().toISOString()

	return db.transaction(async (tx) => {
		const [deletedProfile] = await tx
			.update(medicalProfiles)
			.set({
				deletedAt: now,
				updatedAt: now,
				isDirty: true,
			})
			.where(and(eq(medicalProfiles.id, profile.id), isNull(medicalProfiles.deletedAt)))
			.returning()

		if (!deletedProfile) {
			return null
		}

		await tx
			.update(conditions)
			.set({
				deletedAt: now,
				updatedAt: now,
				isDirty: true,
			})
			.where(and(eq(conditions.medicalProfileId, profile.id), isNull(conditions.deletedAt)))

		await tx
			.update(medications)
			.set({
				deletedAt: now,
				updatedAt: now,
				isDirty: true,
			})
			.where(and(eq(medications.medicalProfileId, profile.id), isNull(medications.deletedAt)))

		return deletedProfile
	})
}
