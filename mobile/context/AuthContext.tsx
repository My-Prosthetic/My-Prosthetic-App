import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { Alert } from "react-native"
import * as SecureStore from "expo-secure-store"
import { useTranslation } from "react-i18next"
import { authService } from "@/src/services/authService"
import { purgeDatabase } from "@/db/purgeDataBase"

export type AuthStatus = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "GUEST"

interface AuthContextValue {
	status: AuthStatus
	loginWithToken: (token: string) => Promise<boolean>
	loginAsGuest: () => Promise<boolean>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>("INITIALIZING")
	const { t } = useTranslation()

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

	const loginWithToken = async (token: string): Promise<boolean> => {
		try {
			await purgeDatabase()
			await SecureStore.deleteItemAsync("is_guest")
			await SecureStore.setItemAsync("auth_token", token)
			setStatus("AUTHENTICATED")
			return true
		} catch (error) {
			console.error("CRITICAL: Failed to prepare local data during login.", error)
			Alert.alert(t("auth.alerts.loginFailed"), t("auth.errors.sessionSetupFailed"))
			return false
		}
	}

	const loginAsGuest = async (): Promise<boolean> => {
		try {
			await purgeDatabase()
			await SecureStore.deleteItemAsync("auth_token")
			await SecureStore.setItemAsync("is_guest", "true")
			setStatus("GUEST")
			return true
		} catch (error) {
			console.error("CRITICAL: Failed to prepare local data during guest login.", error)
			Alert.alert(t("auth.alerts.guestLoginFailed"), t("auth.errors.guestSessionSetupFailed"))
			return false
		}
	}

	const logout = async () => {
		let token: string | null
		try {
			token = await SecureStore.getItemAsync("auth_token")
		} catch (error) {
			console.error("CRITICAL: Failed to read local credentials during logout.", error)
			Alert.alert(t("auth.alerts.logoutFailed"), t("auth.errors.logoutCredentialsReadFailed"))
			return
		}

		if (token) {
			try {
				await authService.logout(token)
			} catch (error) {
				console.warn("[Auth] Remote logout failed; continuing with local logout.", error)
			}
		}

		try {
			await purgeDatabase()
			await SecureStore.deleteItemAsync("auth_token")
			await SecureStore.deleteItemAsync("is_guest")
		} catch (error) {
			console.error("CRITICAL: Failed to clear local data during logout.", error)
			Alert.alert(t("auth.alerts.logoutFailed"), t("auth.errors.logoutCleanupFailed"))
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
