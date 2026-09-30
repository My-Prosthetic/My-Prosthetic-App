import { desc } from "drizzle-orm"

import { db } from "../client"
import { users } from "../schema/users"

export type User = typeof users.$inferSelect

export type CreateUserInput = {
	name: string
}

export async function createUser(input: CreateUserInput) {
	const [user] = await db.insert(users).values(input).returning()

	if (!user) {
		throw new Error("Failed to create user")
	}

	return user
}

export async function getLatestUser() {
	const [user] = await db.select().from(users).orderBy(desc(users.id)).limit(1)

	return user ?? null
}
