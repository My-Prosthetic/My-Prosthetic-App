import { ParseKeys } from "i18next"
import { ScrollView, StyleSheet } from "react-native"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import aboutConfig from "@/src/constants/aboutConfig.json"
import legalDocs from "@/src/constants/legalDocsConfig.json"
import { Fragment } from "react"
import Logo from "@/assets/MP_text_logo_recolored.svg"
import { useTheme } from "@/context/ThemeContext"
import IconChevronRight from "@/assets/icons/chevron-right.svg"

export default function AboutScreen() {
	const { t } = useTranslation()
	const { colors } = useTheme()

	return (
		<>
			<ThemedHeader tx="about.header"/>
			<ThemedView variant="background" colorName="bg_1">
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<ThemedView style={styles.appCard} colorName="bg_0">
						<ThemedView style={styles.appRow}>
							<Logo width={80} height={44.26} color={colors.blue2} />
							<ThemedView style={styles.appInfo}>
								<ThemedText variant="H0" colorName="blue2">
									{aboutConfig.appName}
								</ThemedText>
								<ThemedText
									variant="H4"
									colorName="blue2"
									tx="about.versionLabel"
									txOptions={{ version: aboutConfig.version, release: aboutConfig.releaseLabel }}
								/>
							</ThemedView>
						</ThemedView>

						<ThemedText variant="subTitle2" tx="about.partnerIntro" />
						<ThemedText variant="H5">{aboutConfig.partner}</ThemedText>
					</ThemedView>

					{/* Team */}
					<ThemedText variant="H1" tx="about.team" style={styles.sectionTitle} />
					{aboutConfig.team.map((member) => (
						<ThemedView key={member.name} style={styles.teamRow}>
							<ThemedText variant="H4">{member.name}</ThemedText>
							<ThemedText variant="H5">{member.role}</ThemedText>
							<ThemedView variant="divider" colorName="primary_base" style={{ opacity: 0.2 }} />
						</ThemedView>
					))}
					{/* Documents */}
					<ThemedText variant="H1" tx="about.documents" style={styles.sectionTitle} />
					{legalDocs.documents.map((doc) => (
						<Fragment key={doc.id}>
							<ThemedView
								variant="wide"
								onPress={() =>
									router.push({
										pathname: "/settings/legal/[docId]",
										params: { docId: doc.id },
									})
								}
								accessibilityLabel={t("about.openDocument", {
									title: t(doc.titleKey as ParseKeys),
								})}
								centerChild={<ThemedText variant="H2" tx={doc.titleKey as ParseKeys} />}
								rightChild={
									<ThemedText variant="main1Button" colorName="primary_base">
										{<IconChevronRight color={colors.secondary_base} />}
									</ThemedText>
								}
								childrenContainerStyle={styles.docRow}
							/>
							<ThemedView variant="divider" colorName="primary_base" style={{ opacity: 0.2 }} />
						</Fragment>
					))}
				</ScrollView>
			</ThemedView>
		</>
	)
}

const styles = StyleSheet.create({
	content: {
		paddingVertical: 24,
	},
	appCard: {
		gap: 4,
		paddingVertical: 16,
		borderRadius: 0,
	},
	appRow: {
		flexDirection: "row",
		justifyContent: "flex-start",
		gap: 16,
		marginBottom: 16,
		borderRadius: 0,
	},
	appInfo: {
		gap: 2,
		borderRadius: 0,
	},
	sectionTitle: {
		marginTop: 24,
		marginBottom: 8,
	},
	teamRow: {
		paddingVertical: 6,
		borderRadius: 0,
	},
	docRow: {
		paddingHorizontal: 0,
		gap: 0,
	},
})
