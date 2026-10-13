import { View, StyleSheet, ScrollView, Linking } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { ProgrammeSummary } from "@/src/components/programmes/ProgrammeSummary"

import IconChevronRigh from "@/assets/icons/chevron-right.svg"

import fundingConfig from "@/config/fundingConfig.json"

type Programme = (typeof fundingConfig.programmes)[number]

export default function ProgrammeDetailsScreen() {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { programmeId } = useLocalSearchParams<{ programmeId: string }>()
	const programmes = fundingConfig.programmes as Programme[]
	const programme = programmes.find((item) => item.id === programmeId)

	const translate = (key?: string) => (key ? t(key as any) : "")

	const openExternalUrl = async (url?: string) => {
		if (!url) return

		const supported = await Linking.canOpenURL(url)
		if (supported) {
			await Linking.openURL(url)
		}
	}

	if (!programme) {
		return (
			<ThemedView variant="old_wide" colorName="secondary_base" style={styles.notFoundContainer}>
				<ThemedText tx="funding.notFound" variant="subTitle1" colorName="primary_base" />
			</ThemedView>
		)
	}

	const details = programme.details

	const renderSummaryRows = () => {
		if (!details.summaryRows || details.summaryRows.length === 0) {
			return null
		}

		return (
			<ThemedView variant="wide" colorName="bg_0" shadow style={styles.summaryBox}>
				{details.summaryRows.map((row, index) => (
					<View key={`${row.labelKey}-${index}`}>
						<ThemedView variant="wide" style={styles.summaryRow}>
							<ThemedText variant="H2" colorName="blue2" style={{ paddingVertical: 6 }}>
								{translate(row.labelKey)}
							</ThemedText>

							<ThemedText
								variant="H2"
								colorName="magenta0"
								numberOfLines={2}
								adjustsFontSizeToFit
								style={{
									textAlign: "right",
									maxWidth: "58%",
									paddingVertical: 6,
								}}
							>
								{translate(row.valueKey)}
							</ThemedText>
						</ThemedView>

						{index < details.summaryRows!.length - 1 && (
							<ThemedView variant="divider" colorName="blue0" />
						)}
					</View>
				))}
			</ThemedView>
		)
	}

	const renderSteps = () => {
		if (details.type !== "steps" || !details.steps) {
			return null
		}

		return (
			<>
				<ThemedText
					variant="H1"
					colorName="blue2"
					style={{
						marginBottom: 20,
					}}
				>
					{translate(details.sectionTitleKey)}
				</ThemedText>
				<View style={styles.stepsContainer}>
					{details.steps.map((step, index) => (
						<View key={step.number} style={styles.stepRow}>
							<View style={styles.stepIndicator}>
								<View style={[styles.stepNumber, { backgroundColor: colors.blue2 }]}>
									<ThemedText variant="H3" colorName="bg_0">
										{step.number}
									</ThemedText>
								</View>

								{index < details.steps!.length - 1 && (
									<View style={styles.stepDots}>
										<View style={[styles.stepLine, { backgroundColor: colors.blue2 }]} />
									</View>
								)}
							</View>

							<View style={styles.stepContent}>
								<ThemedText variant="H3" colorName="blue2" style={styles.stepTitle}>
									{translate(step.titleKey)}
								</ThemedText>
								<ThemedText variant="H4" colorName="blue2" style={styles.stepDescription}>
									{translate(step.descriptionKey)}
								</ThemedText>
							</View>
						</View>
					))}
				</View>

				{details.externalUrl && details.externalButtonLabelKey && (
					<ThemedView
						onPress={() => openExternalUrl(details.externalUrl)}
						variant="wide"
						colorName="blue2"

						centerChild={
							<ThemedText variant="H1" colorName="bg_0">
								{translate(details.externalButtonLabelKey)}
							</ThemedText>
						}
					/>
				)}
			</>
		)
	}

	const renderEligibility = () => {
		if (details.type !== "eligibility") {
			return null
		}

		return (
			<>
				<ThemedText variant="H1" colorName="blue2" style={{ marginBottom: 16 }}>
					{translate(details.sectionTitleKey)}
				</ThemedText>

				<ThemedView variant="wide" colorName="bg_0" shadow style={styles.eligibilityBox}>
					{details.eligibilityKeys?.map((key) => (
						<View key={key} style={styles.eligibilityRow}>
							<ThemedText variant="H2" colorName="blue2" style={styles.eligibilityText}>
								• {translate(key)}
							</ThemedText>
						</View>
					))}
				</ThemedView>

				{details.actionSectionTitleKey && (
					<ThemedText variant="H1" colorName="blue2" style={styles.actionSectionTitle}>
						{translate(details.actionSectionTitleKey)}
					</ThemedText>
				)}

				{details.externalButtonLabelKey && (
					<ThemedText variant="H4" colorName="blue2" style={{ paddingLeft: 20, marginBottom: 30 }}>
						{translate(details.externalButtonDescriptionKey)}
					</ThemedText>
				)}

				{details.externalUrl && (
					<ThemedView
						onPress={() => openExternalUrl(details.externalUrl)}
						variant="wide"
						colorName="blue2"
						centerChild={
							details.externalButtonDescriptionKey && (
								<ThemedText variant="H1" colorName="bg_0">
									{translate(details.externalButtonLabelKey)}
								</ThemedText>
							)
						}
					/>
				)}
			</>
		)
	}

	const renderFoundations = () => {
		if (details.type !== "foundations") {
			return null
		}

		return (
			<>
				<ThemedText
					variant="H1"
					colorName="blue2"
					style={{
						marginTop: 5,
						marginBottom: 20,
					}}
				>
					{translate(details.sectionTitleKey)}
				</ThemedText>

				<View>
					{details.foundations?.map((foundation) => {
						const foundationName = translate(foundation.nameKey)

						return (
							<View key={foundation.id}>
								<ThemedView
									onPress={() => openExternalUrl(foundation.externalUrl)}
									style={{
										flexDirection: "row",
										alignItems: "center",
									}}
								>
									<View style={{ flex: 1, gap: 5 }}>
										<ThemedText variant="H2" colorName="blue2">
											{foundationName}
										</ThemedText>

										<ThemedText variant="H4" colorName="blue2">
											{translate(foundation.descriptionKey)}
										</ThemedText>
									</View>
									<IconChevronRigh color={colors.blue1} />
								</ThemedView>
								<ThemedView
									variant="divider"
									colorName="blue1"
									style={{ marginTop: 8, marginBottom: 12 }}
								/>
							</View>
						)
					})}
				</View>
			</>
		)
	}

	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ flexDirection: "column", paddingVertical: 20 }}
			style={{ overflow: "visible" }}
		>
			<ProgrammeSummary programme={programme} />
			{renderSummaryRows()}
			{renderSteps()}
			{renderEligibility()}
			{renderFoundations()}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	summaryBox: {
		minHeight: 40,
		marginTop: 20,
		marginBottom: 28,
		paddingHorizontal: 10,
	},
	summaryRow: {
		minHeight: 40,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
	},
	stepsContainer: {
		gap: 0,
		marginBottom: 26,
	},
	stepRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		width: "100%",
	},
	stepIndicator: {
		width: 30,
		alignItems: "center",
		marginRight: 12,
		flexShrink: 0,
	},
	stepNumber: {
		width: 30,
		height: 30,
		borderRadius: 15,
		borderWidth: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	stepDots: {
		alignItems: "center",
		justifyContent: "space-evenly",
		height: 38,
		paddingVertical: 5,
	},
	stepDot: {
		width: 3,
		height: 3,
		borderRadius: 1.5,
		backgroundColor: "#E0E0E0",
	},
	stepLine: {
		borderRadius: 1000,
		width: 2,
		height: 25,
		// marginLeft: 23,
		// overflow: "visible",
		// marginVertical: -10,
	},
	stepContent: {
		flex: 1,
		paddingTop: 2,
		paddingBottom: 14,
	},
	stepTitle: {
		marginBottom: 3,
		flexShrink: 1,
	},
	stepDescription: {
		flexShrink: 1,
	},
	eligibilityBox: {
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 10,
		marginBottom: 28,
		flexDirection: "column",
		justifyContent: "center",
		width: "100%",
	},
	eligibilityRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	bullet: {
		marginRight: 4,
	},
	eligibilityText: {
		flex: 1,
	},
	actionSectionTitle: {
		marginBottom: 20,
	},
	notFoundContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
})
