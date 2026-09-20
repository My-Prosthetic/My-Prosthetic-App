import { StyleSheet } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"

export default function SettingsScreen() {
	return (
		<ThemedView variant="background" colorName="tertiary_base_2" style={styles.container}>
			<ThemedText tx="screens.settingsTitle" />
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
})
