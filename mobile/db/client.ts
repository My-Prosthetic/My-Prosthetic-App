import { openDatabaseSync } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"

export const expoDb = openDatabaseSync("users.db")
expoDb.execSync("PRAGMA journal_mode = WAL;")
expoDb.execSync("PRAGMA foreign_keys = ON;")
export const db = drizzle(expoDb)
