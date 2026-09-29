import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import * as SecureStore from "expo-secure-store"

export type AuthStatus = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "GUEST"

interface AuthContextValue {
	status: AuthStatus
	loginAsGuest: () => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>("INITIALIZING")

	useEffect(() => {
		let isMounted = true

		const initializeAuth = async () => {
			try {
				const token = await SecureStore.getItemAsync("auth_token")
				if (token) {
					if (isMounted) setStatus("AUTHENTICATED")
					return
				}

				const isGuest = await SecureStore.getItemAsync("is_guest")
				if (isMounted) setStatus(isGuest === "true" ? "GUEST" : "UNAUTHENTICATED")
			} catch (error) {
				console.error("Failed to initialize authentication state:", error)
				if (isMounted) setStatus("UNAUTHENTICATED")
			}
		}

		void initializeAuth()

		return () => {
			isMounted = false
		}
	}, [])

	const loginAsGuest = async () => {
		await SecureStore.setItemAsync("is_guest", "true")
		setStatus("GUEST")
	}

	const logout = async () => {
		await Promise.all([
			SecureStore.deleteItemAsync("auth_token"),
			SecureStore.deleteItemAsync("is_guest"),
		])
		setStatus("UNAUTHENTICATED")
	}

	return (
		<AuthContext.Provider value={{ status, loginAsGuest, logout }}>{children}</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
