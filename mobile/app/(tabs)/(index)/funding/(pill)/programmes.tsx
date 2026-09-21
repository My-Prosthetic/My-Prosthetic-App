import { View, StyleSheet, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import fundingConfig from "@/config/fundingConfig.json"

export default function ProgrammesScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const router = useRouter()

	const programmes = fundingConfig.programmes

	const translate = (key: string) => t(key as any)

	const sectionKeys = [...new Set(programmes.map((programme) => programme.sectionKey))]

	const renderProgrammeCard = (programme: (typeof programmes)[number]) => {
		const programmeTitle = translate(programme.titleKey)

		return (
			<ThemedView
				key={programme.id}
				style={[
					styles.card,
					{
						backgroundColor: colors.tertiary_base_3,
						borderColor: colors.primary_base_2,
					},
				]}
				onPress={() =>
					router.push({
						pathname: "/funding/[programmeId]",
						params: {
							programmeId: programme.id,
						},
					})
				}
				accessibilityRole="button"
				accessibilityLabel={t("funding.showProgrammeDetails", {
					programme: programmeTitle,
				})}
			>
				<View style={styles.cardContent}>
					<ThemedView
						variant="tag"
						colorName="secondary_base_3"
						style={{
							paddingHorizontal: 12,
							paddingVertical: 3,
						}}
					>
						<ThemedText colorName="primary_base" variant="subTitle2">
							{translate(programme.badgeKey)}
						</ThemedText>
					</ThemedView>

					<ThemedText
						variant="main1Button"
						colorName="primary_base"
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.75}
					>
						{programmeTitle}
					</ThemedText>

					<ThemedText
						variant="subTitle2"
						colorName="secondary_base_0c"
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.75}
					>
						{translate(programme.shortDescriptionKey)}
					</ThemedText>
				</View>
			</ThemedView>
		)
	}

	return (
		<ScrollView
			style={[
				styles.container,
				{
					backgroundColor: colors.tertiary_base_2,
				},
			]}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			{sectionKeys.map((sectionKey) => (
				<View key={sectionKey} style={styles.section}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={{ marginBottom: 8 }}
					>
						{translate(sectionKey)}
					</ThemedText>

					{programmes
						.filter((programme) => programme.sectionKey === sectionKey)
						.map(renderProgrammeCard)}
				</View>
			))}

			<ThemedView
				style={[styles.addButton]}
				borderColor="accent_base"
				variant="wide"
				onPress={() => router.replace("/funding/accumulated_funds")}
				accessibilityRole="button"
				accessibilityLabel={t("funding.addFunds")}
			>
				<Ionicons name="add" size={26} color={colors.accent_base_2} />

				<ThemedText tx="funding.addFunds" variant="main1Button" colorName="accent_base_2" />
			</ThemedView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	content: {
		paddingHorizontal: 28,
		paddingTop: 18,
		paddingBottom: 40,
	},

	section: {
		marginBottom: 10,
	},

	card: {
		borderWidth: 1,
		borderRadius: 20,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		minHeight: 104,
		marginBottom: 14,
	},

	cardContent: {
		flex: 1,
		paddingRight: 12,
		alignItems: "flex-start",
	},

	addButton: {
		height: 60,
		borderRadius: 18,
		borderWidth: 3,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 2,
	},
})
