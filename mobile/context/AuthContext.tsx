import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { Alert } from "react-native"
import * as SecureStore from "expo-secure-store"
import { authService } from "@/src/services/authService"
import { purgeDatabase } from "@/db/purgeDataBase"

export type AuthStatus = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "GUEST"

interface AuthContextValue {
	status: AuthStatus
	loginWithToken: (token: string) => Promise<void>
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

	const loginWithToken = async (token: string) => {
		await purgeDatabase()
		await SecureStore.deleteItemAsync("is_guest")
		await SecureStore.setItemAsync("auth_token", token)
		setStatus("AUTHENTICATED")
	}

	const loginAsGuest = async () => {
		await purgeDatabase()
		await SecureStore.setItemAsync("is_guest", "true")
		setStatus("GUEST")
	}

	const logout = async () => {
		let token: string | null
		try {
			token = await SecureStore.getItemAsync("auth_token")
		} catch (error) {
			console.error("CRITICAL: Failed to read local credentials during logout.", error)
			Alert.alert("Wylogowanie nie powiodło się", "Nie udało się odczytać lokalnych danych sesji.")
			return
		}

		if (token) {
			try {
				await authService.logout(token)
			} catch (error) {
				console.error("API logout failed; continuing with local logout.", error)
			}
		}

		try {
			await purgeDatabase()
			await SecureStore.deleteItemAsync("auth_token")
			await SecureStore.deleteItemAsync("is_guest")
		} catch (error) {
			console.error("CRITICAL: Failed to clear local data during logout.", error)
			Alert.alert(
				"Wylogowanie nie powiodło się",
				"Nie udało się wyczyścić lokalnych danych. Pozostajesz w bieżącej sesji."
			)
			return
		}

		setStatus("UNAUTHENTICATED")
	}

	return (
		<AuthContext.Provider value={{ status, loginWithToken, loginAsGuest, logout }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
