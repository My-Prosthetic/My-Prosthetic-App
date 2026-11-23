import { useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useSpecialistSearch } from "@/src/hooks/useSpecialistSearch"
import { router } from "expo-router"

export default function SpecialistsSearchScreen() {
	const { t } = useTranslation()
	const [query, setQuery] = useState("")
	const { specialists, isLoading, error, canSearch, hasSearched } = useSpecialistSearch(query)

	return (
		<ThemedView variant="background" colorName="bg_1">
			<ThemedHeader tx="specialistsSearch.headerTitle" />
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder={t("specialistsSearch.searchPlaceholder")}
					accessibilityLabel={t("specialistsSearch.searchPlaceholder")}
					autoCorrect={false}
					style={styles.searchInput}
				/>

				{isLoading && <ActivityIndicator />}

				{error && <ThemedText accessibilityRole="alert">{t(error)}</ThemedText>}

				{hasSearched && !isLoading && !error && specialists.length === 0 && (
					<ThemedText>{t("specialistsSearch.errorNoSpecialistsFound")}</ThemedText>
				)}

				{specialists.map((specialist) => (
					<ThemedView key={specialist.id} style={styles.specialistRow}>
						<ThemedText>{specialist.name}</ThemedText>
					</ThemedView>
				))}
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		width: "100%",
	},
	searchInput: {
		minHeight: 48,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: "#888",
		borderRadius: 8,
	},
	specialistRow: {
		paddingVertical: 16,
	},
})
