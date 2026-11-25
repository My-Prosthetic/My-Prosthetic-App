import * as Crypto from "expo-crypto"
import { and, eq, isNull } from "drizzle-orm"
import { getDatabaseSession } from "@/db/client"
import { shares, type SharePermissions } from "@/db/schema/shares"
import { shareSyncQueue } from "@/db/schema/shareSyncQueue"

type CreateLocalShareInput = {
	specialist: {
		id: string
		name: string
	}
	permissions: SharePermissions
}

export class ShareError extends Error {
	constructor(public readonly code: "SESSION_CHANGED" | "ALREADY_EXISTS" | "NOT_FOUND") {
		super(code)
		this.name = "ShareError"
	}
}

export function createLocalShare(expectedAccountKey: string, input: CreateLocalShareInput) {
	const session = getDatabaseSession()

	if (!session || session.key === "guest" || session.key !== expectedAccountKey) {
		throw new ShareError("SESSION_CHANGED")
	}

	const database = session.database.db
	const patientId = session.key.slice("user_".length)
	const specialistId = input.specialist.id.toLowerCase()
	const now = new Date().toISOString()

	return database.transaction((tx) => {
		const existing = tx
			.select()
			.from(shares)
			.where(and(eq(shares.patientId, patientId), eq(shares.specialistId, specialistId)))
			.get()

		// Reject an active grant, but allow restoring a deleted one.
		if (existing && !existing.deletedAt) {
			throw new ShareError("ALREADY_EXISTS")
		}

		const permissions: SharePermissions = {
			medical_history: input.permissions.medical_history,
			prostheses: [...input.permissions.prostheses],
			incidents: [...input.permissions.incidents],
		}

		const shareId = existing?.id ?? Crypto.randomUUID()

		if (existing) {
			tx.update(shares)
				.set({
					specialistName: input.specialist.name,
					permissions,
					deletedAt: null,
					updatedAt: now,
				})
				.where(eq(shares.id, existing.id))
				.run()
		} else {
			tx.insert(shares)
				.values({
					id: shareId,
					patientId,
					specialistId,
					specialistName: input.specialist.name,
					permissions,
					createdAt: now,
					updatedAt: now,
				})
				.run()
		}

		tx.insert(shareSyncQueue)
			.values({
				id: Crypto.randomUUID(),
				patientId,
				specialistId,
				operation: "create",
				permissions,
				status: "pending",
				attempts: 0,
				createdAt: now,
			})
			.run()

		return shareId
	})
}
export function getLocalShares(expectedAccountKey: string) {
	const session = getDatabaseSession()

	if (!session || session.key === "guest" || session.key !== expectedAccountKey) {
		throw new Error("The active account has changed or is unavailable.")
	}

	const patientId = session.key.slice("user_".length)

	return session.database.db
		.select()
		.from(shares)
		.where(and(eq(shares.patientId, patientId), isNull(shares.deletedAt)))
		.orderBy(shares.specialistName)
		.all()
}

export function updateLocalShare(
	expectedAccountKey: string,
	specialistId: string,
	input: SharePermissions
) {
	const session = getDatabaseSession()

	if (!session || session.key === "guest" || session.key !== expectedAccountKey) {
		throw new ShareError("SESSION_CHANGED")
	}

	const database = session.database.db
	const patientId = session.key.slice("user_".length)
	const normalizedId = specialistId.toLowerCase()
	const now = new Date().toISOString()

	const permissions: SharePermissions = {
		medical_history: input.medical_history,
		prostheses: [...input.prostheses],
		incidents: [...input.incidents],
	}

	return database.transaction((tx) => {
		const existing = tx
			.select()
			.from(shares)
			.where(
				and(
					eq(shares.patientId, patientId),
					eq(shares.specialistId, normalizedId),
					isNull(shares.deletedAt)
				)
			)
			.get()

		if (!existing) {
			throw new ShareError("NOT_FOUND")
		}

		const queueFilter = and(
			eq(shareSyncQueue.patientId, patientId),
			eq(shareSyncQueue.specialistId, normalizedId)
		)

		const queued = tx.select().from(shareSyncQueue).where(queueFilter).all()

		// Keep POST if the grant hasn't been created on the server yet.
		const operation = queued.some((item) => item.operation === "create") ? "create" : "update"

		tx.update(shares).set({ permissions, updatedAt: now }).where(eq(shares.id, existing.id)).run()

		// Replace older queued selections with the latest complete selection.
		tx.delete(shareSyncQueue).where(queueFilter).run()

		tx.insert(shareSyncQueue)
			.values({
				id: Crypto.randomUUID(),
				patientId,
				specialistId: normalizedId,
				operation,
				permissions,
				status: "pending",
				attempts: 0,
				createdAt: now,
			})
			.run()
	})
}

export function deleteLocalShare(expectedAccountKey: string, specialistId: string) {
	const session = getDatabaseSession()

	if (!session || session.key === "guest" || session.key !== expectedAccountKey) {
		throw new ShareError("SESSION_CHANGED")
	}

	const database = session.database.db
	const patientId = session.key.slice("user_".length)
	const normalizedId = specialistId.toLowerCase()
	const now = new Date().toISOString()

	return database.transaction((tx) => {
		const existing = tx
			.select()
			.from(shares)
			.where(
				and(
					eq(shares.patientId, patientId),
					eq(shares.specialistId, normalizedId),
					isNull(shares.deletedAt)
				)
			)
			.get()

		if (!existing) {
			throw new ShareError("NOT_FOUND")
		}

		tx.update(shares)
			.set({ deletedAt: now, updatedAt: now })
			.where(eq(shares.id, existing.id))
			.run()

		// Remove older queued selections.
		tx.delete(shareSyncQueue)
			.where(
				and(eq(shareSyncQueue.patientId, patientId), eq(shareSyncQueue.specialistId, normalizedId))
			)
			.run()

		tx.insert(shareSyncQueue)
			.values({
				id: Crypto.randomUUID(),
				patientId,
				specialistId: normalizedId,
				operation: "delete",
				status: "pending",
				attempts: 0,
				createdAt: now,
			})
			.run()
	})
}
