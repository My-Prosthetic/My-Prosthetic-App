import { ParseKeys } from "i18next"
import { ScrollView, StyleSheet, View } from "react-native"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import aboutConfig from "@/src/constants/aboutConfig.json"
import legalDocs from "@/src/constants/legalDocsConfig.json"
import Logo from "@/assets/MP_text_logo_recolored.svg"
import { useTheme } from "@/context/ThemeContext"
import IconChevronRight from "@/assets/icons/chevron-right.svg"

export default function specialistsScreen() {
    const { t } = useTranslation()        
    const { colors } = useTheme()
	return (
		<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
			<ThemedView
				variant="background"
				colorName="bg_0"
				shadow
				style={styles.introSection}
			>
			<ThemedHeader tx="specialists.header-title" style={{ marginBottom: 20 }} />

            </ThemedView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		width: "100%",
	},
	introSection: {
		alignSelf: "center",
		width: "119%",
		paddingBottom: 16,
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
	},
})
