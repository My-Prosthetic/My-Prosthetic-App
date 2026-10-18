import { ScrollView, StyleSheet } from "react-native"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import aboutConfig from "@/src/constants/aboutConfig.json"
import legalDocs from "@/src/constants/legalDocsConfig.json"

export default function AboutScreen() {
	const { t } = useTranslation()
	return (
		<ThemedView variant="background" colorName="tertiary_base_2">
			<ThemedHeader tx="about.header" variant="prominent" />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<ThemedView style={styles.appCard}>

					<ThemedText variant="H0">{aboutConfig.appName}</ThemedText>
					<ThemedText
						variant="subTitle2"
						tx="about.versionLabel"
						txOptions={{ version: aboutConfig.version, release: aboutConfig.releaseLabel }}
					/>
					<ThemedText variant="subTitle2" tx="about.partnerIntro" />
					<ThemedText variant="H2">{aboutConfig.partner}</ThemedText>
				</ThemedView>

				{/* Team */}
				<ThemedText variant="tab1Category" tx="about.team" style={styles.sectionTitle}/>
					{aboutConfig.team.map((member) => (
						<ThemedView key={member.name} style={styles.teamRow}>
							<ThemedText variant="subTitle1">{member.name}</ThemedText>
							<ThemedText variant="subTitle2">{member.role}</ThemedText>
						</ThemedView>
					))}

				{/* Documents */}
				<ThemedText variant="tab1Category" tx="about.documents" style={styles.sectionTitle}/>
				{legalDocs.documents.map((doc) => (
					<ThemedView
						key={doc.id}
						variant="wide"
						onPress={() =>
							router.push({
								pathname: "/seettings/legal/[docId]",
								params: {docId: doc.id},
						})
					}
					accessibilityLabel={t("about.openDocument", { title: doc.title })}
					centerChild={<ThemedText variant="H2">{doc.title}</ThemedText>}
					rightChild={<ThemedText variant="H2">›</ThemedText>}
					childrenContainerStyle={styles.docRow}
					/>
				))}
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	content: {
		paddingVertical: 24,
		gap: 8,
	},
	appCard: {
		gap: 4,
		paddingVertical: 16,
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
	},
})