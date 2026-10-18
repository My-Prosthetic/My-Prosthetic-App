import { StyleSheet } from "react-native"
import { router } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import aboutConfig from "@/src/constants/aboutConfig.json"
import legalDocs from "@/src/constants/legalDocsConfig.json"

// Temporary list — will be replaced by legalDocsConfig.json
const documents = [
	{ id: "statute", title: "Regulamin" },
	{ id: "rodo", title: "RODO" },
	{ id: "license", title: "Licencje" },
]

export default function AboutScreen() {
	return (
		<ThemedView variant="background" colorName="tertiary_base_2" style={styles.container}>
			<ThemedText>O nas i Regulaminy</ThemedText>

			{documents.map((doc) => (
				<ThemedView
					key={doc.id}
					variant="narrow"
					colorName="false"
					shadow
					onPress={() =>
						router.push({
							pathname: "/settings/legal/[docId]",
							params: { docId: doc.id },
						})
					}
					style={styles.button}
				>
					<ThemedText colorName="accent_base_1" variant="main1Button">
						{doc.title}
					</ThemedText>
				</ThemedView>
			))}
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
	button: {
		minHeight: 44,
	},
})
