import { StyleSheet } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"

export default function JournalScreen() {
	return (
		<ThemedView variant="background" colorName="blue0" style={styles.container}>
			<ThemedText tx="screens.journalTitle" />
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
