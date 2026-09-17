import { View, Text, StyleSheet } from "react-native"

export default function SettingsScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>Ustawienia Aplikacji ⚙️</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F2F2F7",
	},
	text: { fontSize: 20, fontWeight: "bold" },
})
