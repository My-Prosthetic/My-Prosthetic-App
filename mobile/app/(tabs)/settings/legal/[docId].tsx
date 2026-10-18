import { useLocalSearchParams } from "expo-router"
import { ThemedText } from "@/src/components/ThemedText"
import legalDocs from "@/src/constants/legalDocsConfig.json"

export default function LegalDocScreen() {
	const { docId } = useLocalSearchParams<{ docId: string }>()

	return <ThemedText>Document: {docId}</ThemedText>
}
