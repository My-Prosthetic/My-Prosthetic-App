import { StyleSheet } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useAuth } from "@/context/AuthContext"

export default function SettingsScreen() {
	const { logout } = useAuth()

	return (
		<ThemedView variant="background" colorName="tertiary_base_2" style={styles.container}>
			<ThemedText tx="screens.settingsTitle" />
			{__DEV__ ? (
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
