import { withFileSessionTransition } from "@/src/services/fileStorageService"

export function purgeDatabase(
	clearCredentials: () => Promise<void> = async () => {}
): Promise<void> {
	return withFileSessionTransition(clearCredentials)
}
