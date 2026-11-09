import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"
import { desc, eq } from "drizzle-orm"
import {
	activateDatabaseSession,
	getAccountDatabase,
	isAccountKey,
	legacyDatabase,
} from "@/db/client"
import { initializeDatabase } from "@/db/initialize"
import { users } from "@/db/schema/users"
import { withFileSessionTransition } from "./fileStorageService"
import { authService, type AuthenticatedUser } from "./authService"

const ACTIVE_ACCOUNT = "local_active_account_v1"
const LEGACY_OWNER = "local_legacy_owner_v1"
const ACCOUNT_LAYOUT = "local_account_layout_v1"
type AccountBinding = { key: string; tokenHash: string | null }

function userKey(user: AuthenticatedUser): string {
	const id =
		typeof user.id === "number"
			? Number.isSafeInteger(user.id) && user.id > 0
				? String(user.id)
				: ""
			: user.id.trim().toLowerCase()
	const key = `user_${id}`
	if (!isAccountKey(key) || key === "guest") throw new Error("Invalid authenticated user ID")
	return key
}

async function tokenHash(token: string): Promise<string> {
	return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token)
}

async function readBinding(): Promise<AccountBinding | null> {
	const value = await SecureStore.getItemAsync(ACTIVE_ACCOUNT)
	if (!value) return null
	try {
		const parsed: unknown = JSON.parse(value)
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			"key" in parsed &&
			isAccountKey(parsed.key) &&
			"tokenHash" in parsed &&
			(parsed.tokenHash === null || typeof parsed.tokenHash === "string")
		) {
			return { key: parsed.key, tokenHash: parsed.tokenHash }
		}
	} catch (error) {
		console.warn("Could not parse local account binding:", error)
	}
	return null
}

async function openAccount(key: string, name?: string) {
	const legacyOwner = await SecureStore.getItemAsync(LEGACY_OWNER)
	const database = getAccountDatabase(key, legacyOwner === key)
	await initializeDatabase(database)
	const existing = database.db.select().from(users).orderBy(desc(users.id)).get()
	if (!existing)
		database.db
			.insert(users)
			.values({ name: name ?? "" })
			.run()
	else if (name !== undefined && name !== existing.name)
		database.db.update(users).set({ name }).where(eq(users.id, existing.id)).run()
	activateDatabaseSession(key, database)
	return key
}

export async function restoreLocalAccount(): Promise<{
	status: "AUTHENTICATED" | "GUEST" | "UNAUTHENTICATED"
	key: string | null
}> {
	await initializeDatabase(legacyDatabase)
	return withFileSessionTransition(async () => {
		const token = await SecureStore.getItemAsync("auth_token")
		const guest = (await SecureStore.getItemAsync("is_guest")) === "true"
		const canClaimLegacy =
			!(await SecureStore.getItemAsync(ACCOUNT_LAYOUT)) &&
			!(await SecureStore.getItemAsync(ACTIVE_ACCOUNT))
		const binding = await readBinding()
		if (token) {
			const hash = await tokenHash(token)
			if (binding && binding.key !== "guest" && binding.tokenHash === hash) {
				return { status: "AUTHENTICATED" as const, key: await openAccount(binding.key) }
			}
			const profile = await authService.profile(token)
			const key = userKey(profile)
			if (!(await SecureStore.getItemAsync(LEGACY_OWNER)) && canClaimLegacy)
				await SecureStore.setItemAsync(LEGACY_OWNER, key)
			await SecureStore.setItemAsync(ACCOUNT_LAYOUT, "1")
			await SecureStore.setItemAsync(ACTIVE_ACCOUNT, JSON.stringify({ key, tokenHash: hash }))
			return {
				status: "AUTHENTICATED" as const,
				key: await openAccount(key, profile.name.trim().split(/\s+/)[0]),
			}
		}
		if (guest) {
			if (!(await SecureStore.getItemAsync(LEGACY_OWNER)) && canClaimLegacy)
				await SecureStore.setItemAsync(LEGACY_OWNER, "guest")
			await SecureStore.setItemAsync(ACCOUNT_LAYOUT, "1")
			await SecureStore.setItemAsync(
				ACTIVE_ACCOUNT,
				JSON.stringify({ key: "guest", tokenHash: null })
			)
			return { status: "GUEST" as const, key: await openAccount("guest") }
		}
		await SecureStore.setItemAsync(ACCOUNT_LAYOUT, "1")
		return { status: "UNAUTHENTICATED" as const, key: null }
	})
}

export function loginLocalAccount(token: string, user: AuthenticatedUser): Promise<string> {
	return withFileSessionTransition(async () => {
		const key = userKey(user)
		const hash = await tokenHash(token)
		const legacyOwner = await SecureStore.getItemAsync(LEGACY_OWNER)
		await initializeDatabase(getAccountDatabase(key, legacyOwner === key))
		await SecureStore.setItemAsync(ACCOUNT_LAYOUT, "1")
		await SecureStore.setItemAsync("auth_token", token)
		await SecureStore.setItemAsync(ACTIVE_ACCOUNT, JSON.stringify({ key, tokenHash: hash }))
		await SecureStore.deleteItemAsync("is_guest")
		return openAccount(key, user.name.trim().split(/\s+/)[0])
	})
}

export function loginLocalGuest(): Promise<string> {
	return withFileSessionTransition(async () => {
		const legacyOwner = await SecureStore.getItemAsync(LEGACY_OWNER)
		await initializeDatabase(getAccountDatabase("guest", legacyOwner === "guest"))
		await SecureStore.setItemAsync(ACCOUNT_LAYOUT, "1")
		await SecureStore.deleteItemAsync("auth_token")
		await SecureStore.setItemAsync(
			ACTIVE_ACCOUNT,
			JSON.stringify({ key: "guest", tokenHash: null })
		)
		await SecureStore.setItemAsync("is_guest", "true")
		return openAccount("guest")
	})
}

export async function clearLocalCredentials(): Promise<void> {
	await SecureStore.deleteItemAsync("auth_token")
	await SecureStore.deleteItemAsync("is_guest")
	await SecureStore.deleteItemAsync(ACTIVE_ACCOUNT)
}
