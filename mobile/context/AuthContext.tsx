import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { Alert } from "react-native"
import * as SecureStore from "expo-secure-store"
import Storage from "expo-sqlite/kv-store"
import { useTranslation } from "react-i18next"
import { authService } from "@/src/services/authService"
import { purgeDatabase } from "@/db/purgeDataBase"
import type { AuthenticatedUser } from "@/src/services/authService"
import {
	clearLocalCredentials,
	loginLocalAccount,
	loginLocalGuest,
	restoreLocalAccount,
} from "@/src/services/localAccountService"
import { clearSettingsPreferences } from "@/src/hooks/useSettingsPreferences"

export type AuthStatus = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "GUEST"

interface AuthContextValue {
	status: AuthStatus
	sessionKey: string | null
	loginWithToken: (token: string, user: AuthenticatedUser) => Promise<boolean>
	loginAsGuest: () => Promise<boolean>
	logout: () => Promise<void>
	closeDeletedAccountSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DELETED_ACCOUNT_CLEANUP_KEY = "myprosthetic.settings.deletedAccountCleanupPending.v1"

async function finishDeletedAccountCleanup(): Promise<void> {
	let cleanupError: unknown = null
	const attempt = async (action: () => Promise<unknown>) => {
		try {
			await action()
		} catch (error) {
			cleanupError ??= error
		}
	}

	await attempt(() => SecureStore.deleteItemAsync("auth_token"))
	await attempt(() => SecureStore.deleteItemAsync("is_guest"))
	await attempt(purgeDatabase)
	await attempt(clearSettingsPreferences)

	if (cleanupError) {
		await Storage.setItem(DELETED_ACCOUNT_CLEANUP_KEY, "true")
		throw cleanupError
	}
	await Storage.removeItem(DELETED_ACCOUNT_CLEANUP_KEY)
}

async function resumeDeletedAccountCleanupIfNeeded(): Promise<void> {
	if ((await Storage.getItem(DELETED_ACCOUNT_CLEANUP_KEY)) === "true") {
		await finishDeletedAccountCleanup()
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>("INITIALIZING")
	const [sessionKey, setSessionKey] = useState<string | null>(null)
	const { t } = useTranslation()

	useEffect(() => {
		let isMounted = true

		const initializeAuth = async () => {
			try {
				const restored = await restoreLocalAccount()
				if (isMounted) {
					setSessionKey(restored.key)
					setStatus(restored.status)
				}
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

	const loginWithToken = async (token: string, user: AuthenticatedUser): Promise<boolean> => {
		try {
			setStatus("INITIALIZING")
			setSessionKey(await loginLocalAccount(token, user))
            await resumeDeletedAccountCleanupIfNeeded()
            await purgeDatabase()
            await SecureStore.deleteItemAsync("is_guest")
            await SecureStore.setItemAsync("auth_token", token)
			setStatus("AUTHENTICATED")
			return true
		} catch (error) {
			setSessionKey(null)
			setStatus("UNAUTHENTICATED")
			console.error("CRITICAL: Failed to prepare local data during login.", error)
			Alert.alert(t("auth.alerts.loginFailed"), t("auth.errors.sessionSetupFailed"))
			return false
		}
	}

	const loginAsGuest = async (): Promise<boolean> => {
		try {
			setStatus("INITIALIZING")
			setSessionKey(await loginLocalGuest())
            await resumeDeletedAccountCleanupIfNeeded()
            await purgeDatabase()
            await SecureStore.deleteItemAsync("auth_token")
            await SecureStore.setItemAsync("is_guest", "true")
			setStatus("GUEST")
			return true
		} catch (error) {
			setSessionKey(null)
			setStatus("UNAUTHENTICATED")
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

		try {
			setStatus("INITIALIZING")
			await purgeDatabase(async () => {
				if (token) await authService.logout()
				await clearLocalCredentials()
			})
		} catch (error) {
			setSessionKey(null)
			setStatus("UNAUTHENTICATED")
			console.error("CRITICAL: Failed to clear local data during logout.", error)
			Alert.alert(t("auth.alerts.logoutFailed"), t("auth.errors.logoutCleanupFailed"))
			return
		}

		setSessionKey(null)
		setStatus("UNAUTHENTICATED")
	}

	const closeDeletedAccountSession = async (): Promise<void> => {
		let markerError: unknown = null
		try {
			await Storage.setItem(DELETED_ACCOUNT_CLEANUP_KEY, "true")
		} catch (error) {
			markerError = error
			console.error("Could not persist account deletion cleanup marker:", error)
		}
		let cleanupError: unknown = null
		try {
			await finishDeletedAccountCleanup()
		} catch (error) {
			cleanupError = error
			console.error("Local cleanup after account deletion was incomplete:", error)
		}
		setStatus("UNAUTHENTICATED")
		if (cleanupError) throw cleanupError
		if (markerError) console.warn("Local cleanup succeeded despite marker write failure")
	}

	return (
		<AuthContext.Provider
			value={{ status, sessionKey, loginWithToken, loginAsGuest, logout, closeDeletedAccountSession }}
		>
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
