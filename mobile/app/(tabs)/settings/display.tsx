import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ScrollView, StyleSheet } from "react-native"
import { ThemedToggleSwitch } from "@/src/components/ThemedToggleSwitch"
import { useState } from "react"

export default function DisplayScreen() {
	const { t } = useTranslation()
	const { colors } = useTheme()

	const [darkMode, setDarkMode] = useState(false)
	const [contrast, setContrast] = useState(false)
	const [tts, setTts] = useState(false)

	return (
		<ThemedView variant="background" colorName="bg_1">
			<ThemedHeader tx="display.name" />

			{/* INTERFACE SETTINGS */}
			<ThemedText
				variant="H1"
				tx="display.interface.title"
				style={styles.sectionTitle}
				colorName="blue2"
			/>
			<ThemedView style={styles.subsectionRow}>
				<ThemedText variant="H3" tx="display.interface.darkMode" colorName="blue2" />
				<ThemedToggleSwitch value={darkMode} onValueChange={setDarkMode} />
			</ThemedView>

			<ThemedView variant="divider" colorName="blue1" />

			<ThemedView style={styles.subsectionRow}>
				<ThemedText variant="H3" tx="display.interface.contrast" colorName="blue2" />
				<ThemedToggleSwitch value={contrast} onValueChange={setContrast} />
			</ThemedView>

			<ThemedView variant="divider" colorName="blue1" />

			{/* ACCESSIBILITY SETTINGS */}
			<ThemedText
				variant="H1"
				tx="display.accessibility.title"
				style={styles.sectionTitle}
				colorName="blue2"
			/>
			<ThemedView style={styles.subsectionRow}>
				<ThemedText variant="H3" tx="display.accessibility.tts" colorName="blue2" />
				<ThemedToggleSwitch value={tts} onValueChange={setTts} />
			</ThemedView>

			<ThemedView variant="divider" colorName="blue1" />

			{/* LANGUAGE & REGION SETTINGS */}
			<ThemedText
				variant="H1"
				tx="display.region.title"
				style={styles.sectionTitle}
				colorName="blue2"
			/>
			<ThemedView style={styles.subsectionRow}>
				<ThemedText variant="H3" tx="display.region.language" colorName="blue2" />
			</ThemedView>

			<ThemedView variant="divider" colorName="blue1" />

			<ThemedView style={styles.subsectionRow}>
				<ThemedText variant="H3" tx="display.region.date" colorName="blue2" />
			</ThemedView>

			<ThemedView variant="divider" colorName="blue1" />
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	sectionTitle: {
		marginTop: 40,
		marginBottom: 16,
	},
	subsectionRow: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 6,
		paddingBottom: 6,
		marginTop: 6,
	},
})
