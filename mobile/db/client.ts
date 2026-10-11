import { openDatabaseSync } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import * as schema from "./schema"

export const expoDb = openDatabaseSync("prosthetic-app.db")
expoDb.execSync("PRAGMA journal_mode = WAL;")
expoDb.execSync("PRAGMA foreign_keys = ON;")

export const db = drizzle(expoDb, { schema })
