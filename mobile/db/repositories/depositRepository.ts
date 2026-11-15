import { eq } from "drizzle-orm"

import { db } from "../client"
import { deposits } from "../schema/funding/deposits"

export type Deposit = typeof deposits.$inferSelect
export type DepositValues = Pick<Deposit, "source" | "amount" | "assignedAt" | "note">
export type CreateDepositInput = DepositValues & Pick<Deposit, "goalId">

export async function getDeposits(goal_id: number): Promise<Deposit[]> {
	const depositsList = await db
		.select()
		.from(deposits)
		.where(eq(deposits.goalId, goal_id))
		.orderBy(deposits.assignedAt)

	return depositsList
}

export async function getDepositById(id: number) {
	const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id))

	return deposit ?? null
}

export async function createDeposit(input: CreateDepositInput) {
	const [deposit] = await db.insert(deposits).values(input).returning()

	if (!deposit) {
		throw new Error("Failed to create deposit")
	}

	return deposit
}

export async function updateDeposit(id: number, values: DepositValues) {
	const [deposit] = await db.update(deposits).set(values).where(eq(deposits.id, id)).returning()

	return deposit ?? null
}

export async function deleteDeposit(id: number) {
	const [deposit] = await db.delete(deposits).where(eq(deposits.id, id)).returning()

	return deposit ?? null
}
