import { expoDb } from "@/db/client"

const PRESERVED_TABLES = new Set(["__drizzle_migrations", "android_metadata"])

const PARTIAL_PURGE: Record<string, string> = {
	models: `"is_custom" = 1`,
	brands: `"is_custom" = 1`,
}

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`

async function getUserTables(): Promise<string[]> {
	const rows = await expoDb.getAllAsync<{ name: string }>(
		`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`
	)
	return rows.map((row) => row.name).filter((name) => !PRESERVED_TABLES.has(name))
}

export async function purgeDatabase(): Promise<void> {
	const tables = await getUserTables()

	await expoDb.execAsync("PRAGMA foreign_keys = OFF;")

	try {
		await expoDb.withTransactionAsync(async () => {
			for (const table of tables) {
				const where = PARTIAL_PURGE[table]
				const sql = where
					? `DELETE FROM ${quote(table)} WHERE ${where};`
					: `DELETE FROM ${quote(table)};`
				await expoDb.execAsync(sql)
			}
		})
	} finally {
		await expoDb.execAsync("PRAGMA foreign_keys = ON;")
	}
}
