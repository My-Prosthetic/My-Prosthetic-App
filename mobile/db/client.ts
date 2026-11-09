import { openDatabaseSync } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import * as schema from "./schema"

function openLocalDatabase(name: string) {
	const connection = openDatabaseSync(name)
	connection.execSync("PRAGMA journal_mode = WAL;")
	connection.execSync("PRAGMA foreign_keys = ON;")
	return { name, expoDb: connection, db: drizzle(connection, { schema }) }
}

export type LocalDatabase = ReturnType<typeof openLocalDatabase>
export const legacyDatabase = openLocalDatabase("prosthetic-app.db")
const databases = new Map<string, LocalDatabase>([[legacyDatabase.name, legacyDatabase]])
export let expoDb = legacyDatabase.expoDb
export let db = legacyDatabase.db

export type DatabaseSession = { key: string; storagePrefix: string; database: LocalDatabase }
let session: DatabaseSession | null = null

export function getDatabaseSession(): DatabaseSession | null {
	return session
}
export function invalidateDatabaseSession(): void {
	session = null
}

export function isAccountKey(value: unknown): value is string {
	if (typeof value !== "string") return false
	if (value === "guest") return true
	if (!value.startsWith("user_")) return false
	const id = value.slice(5)
	return (
		/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id) ||
		/^[1-9][0-9]{0,18}$/.test(id)
	)
}

export function getAccountDatabase(key: string, legacy: boolean): LocalDatabase {
	if (!isAccountKey(key)) throw new Error("Invalid local account key")
	const name = legacy ? legacyDatabase.name : `account-${key}.db`
	let database = databases.get(name)
	if (!database) {
		database = openLocalDatabase(name)
		databases.set(name, database)
	}
	return database
}

export function activateDatabaseSession(key: string, database: LocalDatabase): void {
	db = database.db
	expoDb = database.expoDb
	session = {
		key,
		database,
		storagePrefix: database.name === legacyDatabase.name ? "" : `accounts/${key}/`,
	}
}
