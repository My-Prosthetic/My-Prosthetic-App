import { StyleSheet } from "react-native"
import { router } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useAuth } from "@/context/AuthContext"

export default function SettingsScreen() {
	const { logout } = useAuth()

	return (
		<ThemedView variant="background" colorName="bg_1" style={styles.container}>
			<ThemedText tx="screens.settingsTitle" />

			<ThemedView
				variant="narrow"
				colorName="false"
				shadow
				onPress={() => router.push("/settings/about")}
				style={styles.devLogoutButton}
			>
				<ThemedText tx="about.header" colorName="blue0" variant="H2" />
			</ThemedView>

			<ThemedView
				variant="narrow"
				colorName="false"
				shadow
				onPress={() => router.push("/settings/display")}
				style={styles.devLogoutButton}
			>
				<ThemedText tx="display.title" colorName="blue0" variant="H2" />
			</ThemedView>

			{__DEV__ ? (
				<>
					<ThemedView
						variant="narrow"
						colorName="false"
						shadow
						onPress={logout}
						style={styles.devLogoutButton}
					>
						<ThemedText colorName="blue0" variant="H2">
							DEV: WYLOGUJ
						</ThemedText>
					</ThemedView>

					{/* <ThemedText
						onPress={() => setTheme(themeType === "light" ? "high-contrast" : "light")}
						variant="subTitle1"
						tx={themeType === "light" ? "home.switchToHighContrast" : "home.switchToLightTheme"}
					/> */}
				</>
			) : null}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 16,
	},
	devLogoutButton: {
		minHeight: 44,
	},
})
