import React from "react"
import { View, StyleSheet, ScrollView, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"

import fundingConfig from "@/config/fundingConfig.json"

type SummaryRow = {
	labelKey: string
	valueKey: string
}

type Step = {
	number: number
	titleKey: string
	descriptionKey: string
}

type Foundation = {
	id: string
	nameKey: string
	descriptionKey: string
	externalUrl: string
}

type ProgrammeDetails = {
	type: "steps" | "eligibility" | "foundations"

	titleKey: string
	subtitleKey: string

	summaryRows?: SummaryRow[]

	sectionTitleKey?: string

	steps?: Step[]

	eligibilityKeys?: string[]

	actionSectionTitleKey?: string

	externalButtonLabelKey?: string
	externalButtonDescriptionKey?: string
	externalUrl?: string

	foundations?: Foundation[]
}

type Programme = {
	id: string
	sectionKey: string
	badgeKey: string
	titleKey: string
	shortDescriptionKey: string
	details: ProgrammeDetails
}

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
			<ThemedView variant="wide" colorName="secondary_base" style={styles.notFoundContainer}>
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
			<ThemedView
				colorName="tertiary_base_3"
				borderColor="primary_base_2"
				style={styles.summaryBox}
			>
				{details.summaryRows.map((row, index) => (
					<View key={`${row.labelKey}-${index}`}>
						<View style={styles.summaryRow}>
							<ThemedText variant="basic1" colorName="primary_base">
								{translate(row.labelKey)}
							</ThemedText>

							<ThemedText
								variant="subTitle1"
								colorName="primary_base"
								style={{
									textAlign: "right",
									flexShrink: 1,
									maxWidth: "58%",
								}}
							>
								{translate(row.valueKey)}
							</ThemedText>
						</View>

						{index < details.summaryRows!.length - 1 && (
							<ThemedView variant="divider" colorName="primary_base_3" />
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
					variant="tab1Category"
					colorName="secondary_base_0c"
					style={{
						marginBottom: 20,
					}}
				>
					{translate(details.sectionTitleKey)}
				</ThemedText>
				{console.log(details.sectionTitleKey)}
				<View style={styles.stepsContainer}>
					{details.steps.map((step, index) => (
						<View key={step.number} style={styles.stepRow}>
							<View style={styles.stepIndicator}>
								<View style={[styles.stepNumber, { backgroundColor: colors.tertiary_base_3 }]}>
									<ThemedText variant="subTitle1" colorName="primary_base">
										{step.number}
									</ThemedText>
								</View>

								{index < details.steps!.length - 1 && (
									<View style={styles.stepDots}>
										<View style={styles.stepDot} />
										<View style={styles.stepDot} />
										<View style={styles.stepDot} />
										<View style={styles.stepDot} />
									</View>
								)}
							</View>

							<View style={styles.stepContent}>
								<ThemedText variant="subTitle1" colorName="primary_base" style={styles.stepTitle}>
									{translate(step.titleKey)}
								</ThemedText>
								<ThemedText
									variant="subTitle2"
									colorName="secondary_base_0c"
									style={styles.stepDescription}
								>
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
						colorName="primary_base"
						borderColor="accent_base"
						style={styles.mainButton}
					>
						<ThemedText variant="main1Button" colorName="accent_base_2">
							{translate(details.externalButtonLabelKey)}
						</ThemedText>
					</ThemedView>
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
				<ThemedText
					variant="tab1Category"
					colorName="secondary_base_0c"
					style={{ marginBottom: 16 }}
				>
					{translate(details.sectionTitleKey)}
				</ThemedText>

				<ThemedView
					colorName="tertiary_base_3"
					borderColor="primary_base_2"
					style={styles.eligibilityBox}
				>
					{details.eligibilityKeys?.map((key) => (
						<View key={key} style={styles.eligibilityRow}>
							<ThemedText variant="subTitle1" colorName="primary_base" style={styles.bullet}>
								•
							</ThemedText>

							<ThemedText variant="basic1" colorName="primary_base" style={styles.eligibilityText}>
								{translate(key)}
							</ThemedText>
						</View>
					))}
				</ThemedView>

				{details.actionSectionTitleKey && (
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.actionSectionTitle}
					>
						{translate(details.actionSectionTitleKey)}
					</ThemedText>
				)}

				{details.externalUrl && details.externalButtonLabelKey && (
					<ThemedView
						onPress={() => openExternalUrl(details.externalUrl)}
						variant="wide"
						colorName="primary_base"
						borderColor="accent_base"
						style={styles.actionButton}
					>
						<View style={styles.actionButtonContent}>
							<ThemedText
								variant="subTitle1"
								colorName="accent_base_2"
								style={styles.actionButtonTitle}
								numberOfLines={1}
							>
								{translate(details.externalButtonLabelKey)}
							</ThemedText>

							{details.externalButtonDescriptionKey && (
								<ThemedText
									variant="subTitle2"
									colorName="accent_base_2"
									style={styles.actionButtonDescription}
								>
									{translate(details.externalButtonDescriptionKey)}
								</ThemedText>
							)}
						</View>

						<Ionicons name="chevron-forward" size={20} color="#FAF9EE" />
					</ThemedView>
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
					variant="tab1Category"
					colorName="secondary_base_0c"
					style={{
						marginVertical: 10,
					}}
				>
					{translate(details.sectionTitleKey)}
				</ThemedText>

				<View>
					{details.foundations?.map((foundation) => {
						const foundationName = translate(foundation.nameKey)

						return (
							<ThemedView
								key={foundation.id}
								onPress={() => openExternalUrl(foundation.externalUrl)}
								colorName="tertiary_base_2"
								style={{
									flexDirection: "column",
									alignItems: "flex-start",
								}}
							>
								<ThemedText variant="subTitle1" colorName="primary_base">
									{foundationName}
								</ThemedText>

								<ThemedText
									variant="body1Regular"
									colorName="secondary_base_0c"
									style={{ marginTop: 10 }}
								>
									{translate(foundation.descriptionKey)}
								</ThemedText>
								<ThemedView
									variant="divider"
									colorName="primary_base_3"
									style={{ marginVertical: 16 }}
								/>
							</ThemedView>
						)
					})}
				</View>
			</>
		)
	}

	return (
		<ThemedView colorName="tertiary_base_2" variant="background">
			<ScrollView showsVerticalScrollIndicator={false}>
				<ThemedText
					variant="main1Button"
					colorName="primary_base"
					style={{
						alignSelf: "flex-start",
						marginTop: 20,
					}}
				>
					{translate(details.titleKey)}
				</ThemedText>

				<ThemedText
					variant="subTitle1"
					colorName="primary_base_2"
					style={{
						marginTop: 5,
						marginBottom: 20,
					}}
				>
					{translate(details.subtitleKey)}
				</ThemedText>

				{renderSummaryRows()}
				{renderSteps()}
				{renderEligibility()}
				{renderFoundations()}
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	summaryBox: {
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 14,
		marginBottom: 28,
	},
	summaryRow: {
		minHeight: 50,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	stepsContainer: {
		gap: 0,
		marginBottom: 26,
	},
	stepRow: {
		flexDirection: "row",
		alignItems: "flex-start",
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
	mainButton: {
		height: 60,
		borderRadius: 18,
		borderWidth: 3,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 2,
	},
	eligibilityBox: {
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 10,
		marginBottom: 28,
		justifyContent: "center",
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
		marginBottom: 14,
	},
	actionButton: {
		minHeight: 72,
		borderRadius: 18,
		borderWidth: 3,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	actionButtonContent: {
		flex: 1,
		paddingRight: 6,
		paddingLeft: 6,
	},
	actionButtonTitle: {
		marginBottom: 2,
		flexShrink: 1,
	},
	actionButtonDescription: {
		flexShrink: 1,
	},
	notFoundContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
})
