import { useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import { Stack } from "expo-router"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { Roboto_500Medium } from "@expo-google-fonts/roboto"

import "@/translations/i18n"
import { ThemeProvider, useTheme } from "@/context/ThemeContext"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { logFullDatabase } from "@/db/debug"
import { initializeDatabase } from "@/db/initialize"
import { getDatabaseSession } from "@/db/client"
import { SelectedProsthesisProvider } from "@/context/SelectedProsthesisContext"
import { SettingsProvider, useSettings } from "@/context/SettingsContext"
import { JournalFilterProvider } from "@/context/JournalFilterContext"
import { StartupScreen } from "@/src/components/startup/StartupScreen"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

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
	const { colors, isLoaded: themeLoaded } = useTheme()
	const { isLoaded: settingsLoaded } = useSettings()
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
				console.error("Failed to initialize application database:", error)
				if (isMounted) {
					setMigrationError(
						error instanceof Error ? error : new Error("Database initialization failed")
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
		themeLoaded &&
		settingsLoaded &&
		(!!migrationError || (migrationsLoaded && status !== "INITIALIZING"))

	return (
		<StartupScreen ready={isReady}>
			{migrationError ? (
				<ThemedView colorName="bg_0" style={styles.error}>
					<ThemedText tx="startup.databaseErrorTitle" variant="H0" accessibilityRole="header" />
					<ThemedText tx="startup.databaseErrorMessage" variant="H3" />
				</ThemedView>
			) : (
				<Stack
					screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg_0 } }}
				>
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
			)}
		</StartupScreen>
	)
}

const styles = StyleSheet.create({
	error: { flex: 1, borderRadius: 0, justifyContent: "center", padding: 24, gap: 16 },
})

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
			<JournalFilterProvider>
				<RootNavigationLayout {...props} />
			</JournalFilterProvider>
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
