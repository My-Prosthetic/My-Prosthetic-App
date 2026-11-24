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

			<ThemedView
				colorName="bg_1"
				style={[
					styles.searchContainer,
					{ borderColor: colors.blue1, backgroundColor: colors.bg_0 },
				]}
			>
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

				{specialists.map((specialist) => {
					const initials = specialist.name
						.trim()
						.split(/\s+/)
						.slice(0, 2)
						.map((part) => part[0])
						.join("")
						.toUpperCase()

					return (
						<ThemedView
							key={specialist.id}
							style={[styles.specialistTile, { borderColor: colors.blue1 }]}
							onPress={() => setSelectedSpecialist(specialist)}
							accessibilityRole="button"
							accessibilityLabel={specialist.name}
						>
							<ThemedView style={styles.initialColumn}>
								<ThemedView style={[styles.avatar, { backgroundColor: colors.blue1 }]}>
									<ThemedText colorName="bg_0">{initials}</ThemedText>
								</ThemedView>
							</ThemedView>

							<ThemedView style={styles.infoColumn}>
								<ThemedText variant="H3" colorName="blue2">
									{specialist.name}
								</ThemedText>
								<ThemedText variant="H4" colorName="blue2">
									Specjalista Protetyk
								</ThemedText>
								<ThemedText
									variant="H4"
									colorName="blue2"
									style={{ textDecorationLine: "underline" }}
								>
									protetyk@mail.com
								</ThemedText>
								<ThemedText variant="H4" colorName="blue2">
									{t("specialistsSearch.code")}{" "}
									<ThemedText variant="H4" colorName="blue2" style={{ fontWeight: "700" }}>
										KOD_PROTETYKA
									</ThemedText>
								</ThemedText>
							</ThemedView>

							<ThemedView style={styles.selectColumn}>
								<ThemedView style={[styles.selectBadge, { backgroundColor: colors.blue2 }]}>
									<ThemedText variant="H5" colorName="bg_0" style={styles.selectLabel}>
										{t("specialistsSearch.select")}
									</ThemedText>
								</ThemedView>
							</ThemedView>
						</ThemedView>
					)
				})}
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		width: "100%",
	},
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
		minHeight: 44,
		flexDirection: "row",
		alignItems: "flex-start",
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderRadius: 16,
	},
	initialColumn: {
		flex: 1.3,
		alignItems: "flex-start",
	},
	infoColumn: {
		flex: 4,
		minWidth: 0,
		paddingHorizontal: 4,
		gap: 2,
		justifyContent: "flex-start",
	},
	selectColumn: {
		flex: 2,
		alignItems: "flex-end",
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	selectBadge: {
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 12,
	},
	selectLabel: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: "700",
	},
})
