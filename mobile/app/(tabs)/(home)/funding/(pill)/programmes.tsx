import { View, StyleSheet, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ProgrammeSummary } from "@/src/components/programmes/ProgrammeSummary"

import fundingConfig from "@/config/fundingConfig.json"
import IconChevronRigth from "@/assets/icons/chevron-right.svg"

export default function ProgrammesScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const router = useRouter()

	const programmes = fundingConfig.programmes

	const translate = (key: string) => t(key as any)

	const sectionKeys = [...new Set(programmes.map((programme) => programme.sectionKey))]

	const renderProgrammeCard = (programme: (typeof programmes)[number]) => {
		return (
			<ThemedView
				variant="wide"
				key={programme.id}
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
					programme: translate(programme.titleKey),
				})}

				style={styles.row}
			>
				<View style={{ flex: 1 }}>
					<ProgrammeSummary programme={programme} />
				</View>
				<IconChevronRigth height={20} color={colors.blue1} />
			</ThemedView>
		)
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			{sectionKeys.map((sectionKey) => (
				<View key={sectionKey} style={styles.section}>
					<ThemedText variant="H1" colorName="blue2" style={{ marginBottom: 20 }}>
						{translate(sectionKey)}
					</ThemedText>

					{programmes
						.filter((programme) => programme.sectionKey === sectionKey)
						.map(renderProgrammeCard)}
				</View>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	section: {
		flex: 1,
		marginTop: 10,
	},
	row: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		height: 54,
		marginBottom: 20,
		gap: 20,
	},
})
