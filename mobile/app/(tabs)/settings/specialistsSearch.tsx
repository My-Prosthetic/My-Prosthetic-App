import { useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { useSpecialistSearch } from "@/src/hooks/useSpecialistSearch"
import type { Specialist } from "@/src/services/specialistsApi"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconSearch from "@/assets/icons/search.svg"

export default function SpecialistsSearchScreen() {
	const { t } = useTranslation()
	const [query, setQuery] = useState("")
	const { colors } = useTheme()
	const { specialists, isLoading, error, canSearch, hasSearched } = useSpecialistSearch(query)
	const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null)

	return (
		<ThemedView variant="background" colorName="bg_1" style={styles.screen}>
			<ThemedHeader tx="specialistsSearch.headerTitle" />

			<ThemedView colorName="bg_1" style={[styles.searchContainer, { borderColor: colors.blue1, backgroundColor: colors.bg_0 }]}>
				<IconSearch width={20} height={20} color={colors.blue1} />

				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder={t("specialistsSearch.searchPlaceholder")}
					accessibilityLabel={t("specialistsSearch.searchPlaceholder")}
					autoCorrect={false}
					placeholderTextColor={colors.blue1}
					underlineColorAndroid="transparent"
					style={[styles.searchInput, { color: colors.blue1 }]}
				/>
			</ThemedView>

			<ScrollView
				style={styles.results}
				contentContainerStyle={styles.resultsContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				{isLoading && <ActivityIndicator color={colors.blue2} />}

				{error && <ThemedText accessibilityRole="alert">{t(error)}</ThemedText>}

				{hasSearched && !isLoading && !error && specialists.length === 0 && (
					<ThemedText>{t("specialistsSearch.errorNoSpecialistsFound")}</ThemedText>
				)}

				{specialists.map((specialist) => (
					<ThemedView
						key={specialist.id}
						style={[styles.specialistTile, { borderColor: colors.blue1, backgroundColor: colors.bg_0 }]}
						//onPress={() => setSelectedSpecialist(specialist)}
						accessibilityRole="button"
						accessibilityLabel={specialist.name}
					>
						<ThemedText colorName="blue2">{specialist.name}</ThemedText>
                        <ThemedText colorName="blue2">{specialist.id}</ThemedText>
					</ThemedView>
				))}
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		minHeight: 44,
		marginHorizontal: 16,
		marginVertical: 16,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderRadius: 16,
		marginBottom: 30,
	},
	searchInput: {
		flex: 1,
		minHeight: 44,
		paddingVertical: 8,
	},
	results: {
		flex: 1,
		width: "100%",
	},
	resultsContent: {
		paddingHorizontal: 16,
		paddingBottom: 24,
	},
	specialistTile: {
		width: "100%",
		minHeight: 88,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderRadius: 16,
	},
	scrollView: {
		flex: 1,
		width: "100%",
	},
	specialistRow: {
		paddingVertical: 16,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	specialistDetails: {
		flex: 1,
	},
	selectBadge: {
		paddingHorizontal: 12,
		paddingVertical: 3,
		borderRadius: 12,
	},
	selectLabel: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: "700",
	},
})
