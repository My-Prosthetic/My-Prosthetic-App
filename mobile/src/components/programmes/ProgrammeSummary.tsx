import { View, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"

import { ThemedText } from "../ThemedText"
import { useTheme } from "@/context/ThemeContext"

import fundingConfig from "@/config/fundingConfig.json"
import IconMedical from "@/assets/icons/medical-report-clipboard.svg"
import IconSocial from "@/assets/icons/people-outline.svg"
import IconFundraising from "@/assets/icons/hand-support.svg"

const ICONS = {
	medical: IconMedical,
	social: IconSocial,
	fundraising: IconFundraising,
}

export const ProgrammeSummary = ({
	programme,
}: {
	programme: (typeof fundingConfig.programmes)[number]
}) => {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const translate = (key: string) => t(key as any)

	const Icon = ICONS[programme.icon as "medical" | "social" | "fundraising"]

	return (
		<View style={{ flexDirection: "row", gap: 10 }}>
			<View style={[styles.circle, { backgroundColor: colors.blue1 }]}>
				<Icon color={colors.bg_0} height={28} />
			</View>
			<View style={styles.descriptionSection}>
				<ThemedText variant="H3" colorName="blue2" style={styles.descriptionText}>
					{translate(programme.titleKey)}
				</ThemedText>

				<ThemedText variant="H4" colorName="blue2" style={styles.descriptionText}>
					{translate(programme.shortDescriptionKey)}
				</ThemedText>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	circle: {
		width: 54,
		height: 54,
		borderRadius: 1000,
		justifyContent: "center",
		alignItems: "center",
	},
	descriptionSection: {
		flex: 1,
		flexDirection: "column",
		justifyContent: "space-around",
		alignItems: "flex-start",
	},
	descriptionText: {
		textAlign: "left",
	},
})
