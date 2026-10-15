import { eq } from "drizzle-orm"

import { db } from "../client"
import { deposits } from "../schema/funding/deposits"

export type Deposit = typeof deposits.$inferSelect

export async function getDeposits(goal_id: number): Promise<Deposit[]> {
	const depositsList = await db
		.select()
		.from(deposits)
		.where(eq(deposits.goalId, goal_id))
		.orderBy(deposits.assignedAt)

	return depositsList
}
