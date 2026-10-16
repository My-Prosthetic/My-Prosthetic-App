import { useLocalSearchParams } from "expo-router"
import { ThemedText } from "@/src/components/ThemedText"

export default function LegalDocScreen() {
	const { docId } = useLocalSearchParams<{ docId: string }>()

	return <ThemedText>Document: {docId}</ThemedText>
}
