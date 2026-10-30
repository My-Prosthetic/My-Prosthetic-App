import { StyleSheet } from "react-native"
import { router } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { useTranslation } from "react-i18next"

export default function SettingsScreen() {
	const { logout } = useAuth()
	const { themeType, setTheme } = useTheme()
	const { i18n } = useTranslation()

	return (
		<ThemedView variant="background" colorName="tertiary_base_2" style={styles.container}>
			<ThemedText tx="screens.settingsTitle" />

			<ThemedView
				variant="old_narrow"
				colorName="false"
				shadow
				onPress={() => router.push("/settings/about")}
				style={styles.devLogoutButton}
			>
				<ThemedText tx="about.header" colorName="accent_base_1" variant="main1Button" />
			</ThemedView>

			<ThemedView
				variant="old_narrow"
				colorName="false"
				shadow
				onPress={() => router.push("/settings/display")}
				style={styles.devLogoutButton}
			>
				<ThemedText tx="display.title" colorName="accent_base_1" variant="main1Button" />
			</ThemedView>

			{__DEV__ ? (
				<>
					<ThemedView
						variant="old_narrow"
						colorName="false"
						shadow
						onPress={logout}
						style={styles.devLogoutButton}
					>
						<ThemedText colorName="accent_base_1" variant="main1Button">
							DEV: WYLOGUJ
						</ThemedText>
					</ThemedView>

					<ThemedText
						onPress={() => setTheme(themeType === "light" ? "high-contrast" : "light")}
						variant="subTitle1"
						tx={themeType === "light" ? "home.switchToHighContrast" : "home.switchToLightTheme"}
					/>

					{/* ----------------- PROSTY PRZEŁĄCZNIK JĘZYKA (DEWELOPERSKI) ----------------- */}

					<ThemedText
						onPress={() => {
							const nextLang = i18n.language.startsWith("pl") ? "en" : "pl"
							i18n.changeLanguage(nextLang)
						}}
						variant="subTitle1"
					>
						{i18n.language.startsWith("pl")
							? "Zmień język: English (EN)"
							: "Change language: Polski (PL)"}
					</ThemedText>
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
