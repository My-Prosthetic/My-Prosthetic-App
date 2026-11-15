import { asc, eq } from "drizzle-orm"

import { db } from "../client"
import { goals } from "../schema/funding/goals"

export type Goal = typeof goals.$inferSelect
export type GoalValues = Pick<Goal, "name" | "amount" | "note">
export type CreateGoalInput = GoalValues

export async function getGoals(): Promise<Goal[]> {
	const goalsList = await db.select().from(goals).orderBy(asc(goals.createdAt))

	return goalsList
}

export async function getGoalById(id: number) {
	const [goal] = await db.select().from(goals).where(eq(goals.id, id))

	return goal ?? null
}

export async function createGoal(input: CreateGoalInput) {
	const [goal] = await db.insert(goals).values(input).returning()

	if (!goal) {
		throw new Error("Failed to create goal")
	}

	return goal
}

export async function updateGoal(id: number, values: GoalValues) {
	const [goal] = await db.update(goals).set(values).where(eq(goals.id, id)).returning()

	return goal ?? null
}

export async function deleteGoal(id: number) {
	const [goal] = await db.delete(goals).where(eq(goals.id, id)).returning()

	return goal ?? null
}
