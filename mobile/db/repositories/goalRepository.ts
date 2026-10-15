import { asc } from "drizzle-orm"

import { db } from "../client"
import { goals } from "../schema/funding/goals"

export type Goal = typeof goals.$inferSelect

export async function getGoals(): Promise<Goal[]> {
	const goalsList = await db.select().from(goals).orderBy(asc(goals.createdAt))

	return goalsList
}
