import { useCallback, useState } from "react"
import { useFocusEffect } from "expo-router"
import { getShares, type Share } from "../services/sharesApi"

// reload the list whenever returns to the specialist screen
export function useShares() {
	const [shares, setShares] = useState<Share[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<"specialists.loadError" | null>(null)

	useFocusEffect(
		useCallback(() => {
			let active = true

			async function load() {
				setIsLoading(true)
				setError(null)

				try {
					const result = await getShares()

					if (active) {
						setShares(result)
					}
				} catch {
					if (active) {
						setError("specialists.loadError")
					}
				} finally {
					if (active) {
						setIsLoading(false)
					}
				}
			}

			void load()

			return () => {
				active = false
			}
		}, [])
	)

	return { shares, isLoading, error }
}
