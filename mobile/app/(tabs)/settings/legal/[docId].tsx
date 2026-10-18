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
		<>
			<ThemedHeader tx={doc ? (doc.titleKey as ParseKeys) : "about.header"} />
			<ThemedView variant="background" colorName="tertiary_base_2">
				{doc ? (
					<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
						<ThemedText variant="body1Regular">{doc.content}</ThemedText>
					</ScrollView>
				) : (
					<ThemedView style={styles.notFound}>
						<ThemedText variant="body1Regular" tx="about.documentNotFound" />
					</ThemedView>
				)}
			</ThemedView>
		</>
	)
}

const styles = StyleSheet.create({
	content: {
		paddingVertical: 24,
		gap: 16,
	},
	notFound: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
})
