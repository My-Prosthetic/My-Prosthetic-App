import { migrate } from "drizzle-orm/expo-sqlite/migrator"
import migrations from "@/drizzle/migrations"
import { seedCatalogIfNotInitialized } from "./bootstrap"
import { legacyDatabase, type LocalDatabase } from "./client"

const initialization = new WeakMap<LocalDatabase, Promise<void>>()

export function initializeDatabase(database: LocalDatabase = legacyDatabase): Promise<void> {
	const existing = initialization.get(database)
	if (existing) return existing
	const result = (async () => {
		await migrate(database.db, migrations)
		await seedCatalogIfNotInitialized(database.db)
	})()
	initialization.set(database, result)
	void result.catch(() => initialization.delete(database))
	return result
}
