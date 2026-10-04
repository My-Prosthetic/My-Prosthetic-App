import { expoDb } from "@/db/client"

//TODO automatyczne definiowanie listy tabel do wyczyszczenia

export async function purgeDatabase(): Promise<void> {
	await expoDb.execAsync("PRAGMA foreign_keys = OFF;")

	try {
		await expoDb.withTransactionAsync(async () => {
			await expoDb.execAsync(`DELETE FROM "deposits";`)
			await expoDb.execAsync(`DELETE FROM "goals";`)
			await expoDb.execAsync(`DELETE FROM "conditions";`)
			await expoDb.execAsync(`DELETE FROM "medical_profiles";`)
			await expoDb.execAsync(`DELETE FROM "medications";`)
			await expoDb.execAsync(`DELETE FROM "components";`)
			await expoDb.execAsync(`DELETE FROM "prostheses";`)
			await expoDb.execAsync(`DELETE FROM "users";`)
		})
	} finally {
		await expoDb.execAsync("PRAGMA foreign_keys = ON;")
	}
}
