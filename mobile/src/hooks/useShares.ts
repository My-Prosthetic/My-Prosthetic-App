import { useCallback, useState } from "react"
import { useFocusEffect } from "expo-router"
import { useAuth } from "@/context/AuthContext"
import { getLocalShares } from "@/db/repositories/shares"
import type { Share } from "../services/sharesApi"

type SharesState = {
	sessionKey: string | null
	shares: Share[]
	isLoading: boolean
	error: "specialists.loadError" | null
}

export function useShares() {
	const { status, sessionKey } = useAuth()

	const [state, setState] = useState<SharesState>({
		sessionKey: null,
		shares: [],
		isLoading: true,
		error: null,
	})

	const [refreshVersion, setRefreshVersion] = useState(0)

	const refresh = useCallback(() => {
		setRefreshVersion((version) => version + 1)
	}, [])

	useFocusEffect(
		useCallback(() => {
			if (status !== "AUTHENTICATED" || !sessionKey) return

			let active = true

			// Run after focus; cancel if the screen loses focus.
			const timer = setTimeout(() => {
				if (!active) return

				try {
					const rows = getLocalShares(sessionKey)

					const shares: Share[] = rows.map((row) => ({
						specialist: {
							id: row.specialistId,
							name: row.specialistName,
						},
						permissions: row.permissions,
						created_at: row.createdAt,
						updated_at: row.updatedAt,
					}))

					setState({
						sessionKey,
						shares,
						isLoading: false,
						error: null,
					})
				} catch {
					setState({
						sessionKey,
						shares: [],
						isLoading: false,
						error: "specialists.loadError",
					})
				}
			}, 0)

			return () => {
				active = false
				clearTimeout(timer)
			}
		}, [status, sessionKey, refreshVersion])
	)

	const isAuthenticated = status === "AUTHENTICATED" && sessionKey !== null
	const isCurrentAccount = isAuthenticated && state.sessionKey === sessionKey

	return {
		shares: isCurrentAccount ? state.shares : [],
		isLoading:
			status === "INITIALIZING" || (isAuthenticated && (!isCurrentAccount || state.isLoading)),
		error: isCurrentAccount ? state.error : null,
		refresh,
	}
}
