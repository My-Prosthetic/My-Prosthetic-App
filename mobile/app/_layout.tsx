import { useEffect } from "react"
import { Stack } from "expo-router"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"

import "@/translations/i18n"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { logFullDatabase } from "@/db/debug"

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

	const isReady = (fontsLoaded || !!fontsError) && status !== "INITIALIZING"

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

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
		</Stack>
	)
}

export default function RootLayout() {
	useEffect(() => {
		if (__DEV__) {
			try {
				logFullDatabase()
			} catch (error) {
				console.error("Failed to log database contents:", error)
			}
		}
	}, [])

	const [loaded, error] = useFonts({
		"Afacad-Regular": require("@/assets/fonts/Afacad/Afacad-Regular.ttf"),
		"Afacad-Medium": require("@/assets/fonts/Afacad/Afacad-Medium.ttf"),
		"Afacad-SemiBold": require("@/assets/fonts/Afacad/Afacad-SemiBold.ttf"),

		"Inter-Regular": require("@/assets/fonts/Inter/Inter_18pt-Regular.ttf"),
		"Inter-SemiBold": require("@/assets/fonts/Inter/Inter_18pt-SemiBold.ttf"),
	})

	return (
		<ThemeProvider>
			<AuthProvider>
				<RootNavigationLayout fontsLoaded={loaded} fontsError={error} />
			</AuthProvider>
		</ThemeProvider>
	)
}
