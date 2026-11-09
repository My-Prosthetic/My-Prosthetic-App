import { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { Stack } from "expo-router"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { Roboto_500Medium } from "@expo-google-fonts/roboto"

import "@/translations/i18n"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { logFullDatabase } from "@/db/debug"
import { initializeDatabase } from "@/db/initialize"
import { getDatabaseSession } from "@/db/client"
import { SelectedProsthesisProvider } from "@/context/SelectedProsthesisContext"
import { SettingsProvider } from "@/context/SettingsContext"

//TODO tx

SplashScreen.preventAutoHideAsync().catch((error) => {
	console.warn("SplashScreen error:", error)
})

function RootNavigationLayout({
	fontsLoaded,
	fontsError,
}: {
	fontsLoaded: boolean
	fontsError: Error | null
}) {
	const { status } = useAuth()
	const [migrationsLoaded, setMigrationsLoaded] = useState(false)
	const [migrationError, setMigrationError] = useState<Error | null>(null)

	useEffect(() => {
		let isMounted = true
		initializeDatabase()
			.then(() => {
				if (isMounted) {
					setMigrationsLoaded(true)
				}
			})
			.catch((error: unknown) => {
				if (isMounted) {
					setMigrationError(
						error instanceof Error ? error : new Error("Nieznany b┼é─ůd seedowania katalogu")
					)
				}
			})

		return () => {
			isMounted = false
		}
	}, [])

	const hasActiveSession = status === "AUTHENTICATED" || status === "GUEST"
	const isReady =
		(fontsLoaded || !!fontsError) &&
		status !== "INITIALIZING" &&
		(migrationsLoaded || !!migrationError)

	useEffect(() => {
		if (isReady) {
			SplashScreen.hideAsync().catch((error) => {
				console.error("Failed to hide splash screen:", error)
			})
		}
	}, [isReady])

	if (!isReady) {
		return null
	}

	if (migrationError) {
		return (
			<View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
				<Text>B┼é─ůd migracji bazy danych: {migrationError.message}</Text>
			</View>
		)
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={hasActiveSession}>
				<Stack.Screen name="(tabs)" />
			</Stack.Protected>
			<Stack.Protected guard={!hasActiveSession}>
				<Stack.Screen name="index" />
				<Stack.Screen name="login" />
				<Stack.Screen name="signup" />
				<Stack.Screen name="noAccount" />
			</Stack.Protected>
		</Stack>
	)
}

function SessionNavigation(props: { fontsLoaded: boolean; fontsError: Error | null }) {
	const { sessionKey, status } = useAuth()
	useEffect(() => {
		if (
			!__DEV__ ||
			!sessionKey ||
			status === "INITIALIZING" ||
			getDatabaseSession()?.key !== sessionKey
		)
			return
		try {
			logFullDatabase()
		} catch (error) {
			console.error("Failed to log current account database:", error)
		}
	}, [sessionKey, status])
	return (
		<SelectedProsthesisProvider key={sessionKey ?? "signed-out"}>
			<RootNavigationLayout {...props} />
		</SelectedProsthesisProvider>
	)
}

export default function RootLayout() {
	const [loaded, error] = useFonts({
		"Afacad-Regular": require("@/assets/fonts/Afacad/Afacad-Regular.ttf"),
		"Afacad-Medium": require("@/assets/fonts/Afacad/Afacad-Medium.ttf"),
		"Afacad-SemiBold": require("@/assets/fonts/Afacad/Afacad-SemiBold.ttf"),

		"Inter-Regular": require("@/assets/fonts/Inter/Inter_18pt-Regular.ttf"),
		"Inter-SemiBold": require("@/assets/fonts/Inter/Inter_18pt-SemiBold.ttf"),

		"Cabin-Bold": require("@/assets/fonts/Cabin/Cabin-Bold.ttf"),
		"Cabin-Medium": require("@/assets/fonts/Cabin/Cabin-Medium.ttf"),

		"Montserrat-Bold": require("@/assets/fonts/Montserrat/Montserrat-Bold.ttf"),
		"Montserrat-Regular": require("@/assets/fonts/Montserrat/Montserrat-Regular.ttf"),
		"Montserrat-SemiBold": require("@/assets/fonts/Montserrat/Montserrat-SemiBold.ttf"),
		"Inter-Bold": require("@/assets/fonts/Inter/Inter_18pt-Bold.ttf"),
		Roboto_500Medium,
	})

	return (
		<ThemeProvider>
			<SettingsProvider>
				<AuthProvider>
					<SessionNavigation fontsLoaded={loaded} fontsError={error} />
				</AuthProvider>
			</SettingsProvider>
		</ThemeProvider>
	)
}
