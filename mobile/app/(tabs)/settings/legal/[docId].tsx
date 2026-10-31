import { ParseKeys } from "i18next"
import { ScrollView, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import legalDocs from "@/src/constants/legalDocsConfig.json"

export default function LegalDocScreen() {
	const { docId } = useLocalSearchParams<{ docId: string }>()
	const doc = legalDocs.documents.find((d) => d.id === docId)

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			<ThemedView variant="background" colorName="bg_1">
				<ThemedHeader tx={doc ? (doc.titleKey as ParseKeys) : "about.header"} />

				{doc ? (
					<ThemedView style={styles.content}>
						{doc.content.map((section) => (
							<ThemedView key={section.subtitle} style={styles.section}>
								<ThemedText variant="H2" colorName="blue2" style={styles.centerText}>
									{section.subtitle}
								</ThemedText>

								<ThemedText variant="basic1" colorName="blue2" style={styles.centerText}>
									{section.content}
								</ThemedText>
							</ThemedView>
						))}
					</ThemedView>
				) : (
					<ThemedView style={styles.notFound}>
						<ThemedText variant="basic1" tx="about.documentNotFound" colorName="false_1" />
					</ThemedView>
				)}
			</ThemedView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		width: "100%",
	},

	scrollContent: {
		flexGrow: 1,
	},

	content: {
		paddingVertical: 24,
	},

	notFound: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 24,
	},
	section: {
		width: "100%",
		alignItems: "center",
		gap: 8,
		marginBottom: 20,
	},

	centerText: {
		width: "100%",
		textAlign: "center",
	},
})
