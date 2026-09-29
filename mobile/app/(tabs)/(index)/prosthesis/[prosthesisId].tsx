import React, { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { getProsthesisById } from "@/db/repositories/prosthesisRepository"
import type { Prosthesis } from "@/db/repositories/prosthesisRepository"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

const AMPUTATION_LEVEL_KEYS: Record<string, string> = {
	hemipelvectomy: "newProsthesis.amputationLevels.lower.hemipelvectomy",
	hip_disarticulation: "newProsthesis.amputationLevels.lower.hipDisarticulation",
	short_thigh: "newProsthesis.amputationLevels.lower.shortThigh",
	medium_thigh: "newProsthesis.amputationLevels.lower.mediumThigh",
	long_thigh: "newProsthesis.amputationLevels.lower.longThigh",
	knee_disarticulation: "newProsthesis.amputationLevels.lower.kneeDisarticulation",
	short_lower_leg: "newProsthesis.amputationLevels.lower.shortLowerLeg",
	medium_lower_leg: "newProsthesis.amputationLevels.lower.mediumLowerLeg",
	long_lower_leg: "newProsthesis.amputationLevels.lower.longLowerLeg",
	syme: "newProsthesis.amputationLevels.lower.syme",
	partial_foot: "newProsthesis.amputationLevels.lower.partialFoot",
	forequarter: "newProsthesis.amputationLevels.upper.forequarter",
	shoulder_disarticulation: "newProsthesis.amputationLevels.upper.shoulderDisarticulation",
	short_upper_arm: "newProsthesis.amputationLevels.upper.shortUpperArm",
	medium_upper_arm: "newProsthesis.amputationLevels.upper.mediumUpperArm",
	long_upper_arm: "newProsthesis.amputationLevels.upper.longUpperArm",
	elbow_disarticulation: "newProsthesis.amputationLevels.upper.elbowDisarticulation",
	short_forearm: "newProsthesis.amputationLevels.upper.shortForearm",
	medium_forearm: "newProsthesis.amputationLevels.upper.mediumForearm",
	long_forearm: "newProsthesis.amputationLevels.upper.longForearm",
	wrist_disarticulation: "newProsthesis.amputationLevels.upper.wristDisarticulation",
	partial_hand: "newProsthesis.amputationLevels.upper.partialHand",
}

export default function ProsthesisDetailsScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { t } = useTranslation()

	const { prosthesisId } = useLocalSearchParams<{
		prosthesisId: string
	}>()

	const [prosthesis, setProsthesis] = useState<Prosthesis | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let mounted = true

		const loadProsthesis = async () => {
			if (!prosthesisId || typeof prosthesisId !== "string") {
				if (mounted) {
					setIsLoading(false)
				}
				return
			}

			try {
				const result = await getProsthesisById(prosthesisId)

				if (mounted) {
					setProsthesis(result)
				}
			} catch (error) {
				console.error("Failed to load prosthesis:", error)
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		loadProsthesis()

		return () => {
			mounted = false
		}
	}, [prosthesisId])

	const amputationLevelKey = prosthesis
		? AMPUTATION_LEVEL_KEYS[prosthesis.amputationLevel]
		: undefined

	const amputationLevelLabel = prosthesis
		? amputationLevelKey
			? t(amputationLevelKey as any)
			: prosthesis.amputationLevel
		: ""

	return (
		<ThemedView colorName="tertiary_base_1" style={styles.screen}>
			<ThemedView colorName="primary_base" style={styles.header}>
				<ThemedView
					colorName="primary_base"
					style={styles.backButton}
					onPress={() => router.back()}
					accessibilityRole="button"
					accessibilityLabel={t("newProsthesis.back")}
				>
					<Ionicons name="chevron-back" size={28} color={colors.accent_base} />
				</ThemedView>

				<ThemedText tx="prosthesisDetails.title" variant="title" colorName="accent_base" />
			</ThemedView>

			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={colors.primary_base} />
				</View>
			) : !prosthesis ? (
				<View style={styles.centered}>
					<ThemedText
						tx="prosthesisDetails.notFound"
						variant="subTitle2"
						colorName="primary_base"
					/>
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<ThemedView colorName="primary_base" style={styles.iconCard}>
						<Ionicons name="body-outline" size={64} color={colors.accent_base} />
					</ThemedView>

					<ThemedText variant="title" colorName="primary_base" style={styles.name}>
						{prosthesis.name}
					</ThemedText>

					<ThemedView
						colorName="tertiary_base_3"
						borderColor="secondary_base_0c"
						style={styles.infoCard}
					>
						<InfoRow
							label={t("prosthesisDetails.side")}
							value={
								prosthesis.side === "left" ? t("newProsthesis.left") : t("newProsthesis.right")
							}
						/>

						<InfoRow
							label={t("prosthesisDetails.limb")}
							value={
								prosthesis.limbType === "upper"
									? t("newProsthesis.upper")
									: t("newProsthesis.lower")
							}
						/>

						<InfoRow
							label={t("prosthesisDetails.amputationLevel")}
							value={amputationLevelLabel}
							isLast
						/>
					</ThemedView>
				</ScrollView>
			)}
		</ThemedView>
	)
}

interface InfoRowProps {
	label: string
	value: string
	isLast?: boolean
}

function InfoRow({ label, value, isLast = false }: InfoRowProps) {
	return (
		<View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
			<ThemedText variant="subTitle2" colorName="secondary_base_0c" style={styles.infoLabel}>
				{label}
			</ThemedText>

			<ThemedText variant="body1Regular" colorName="primary_base" style={styles.infoValue}>
				{value}
			</ThemedText>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},

	header: {
		width: "100%",
		minHeight: 86,
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 16,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},

	backButton: {
		position: "absolute",
		left: 16,
		top: 18,
		bottom: 16,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 2,
	},

	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},

	content: {
		paddingHorizontal: 24,
		paddingTop: 28,
		paddingBottom: 48,
		alignItems: "center",
	},

	iconCard: {
		width: 120,
		height: 120,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",

		shadowColor: "#052D8F",
		shadowOffset: {
			width: 0,
			height: 3,
		},
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
	},

	name: {
		marginTop: 20,
		marginBottom: 20,
		textAlign: "center",
	},

	infoCard: {
		width: "100%",
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 16,
	},

	infoRow: {
		paddingVertical: 16,
	},

	infoRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: "#CBD5E1",
	},

	infoLabel: {
		marginBottom: 4,
	},

	infoValue: {
		fontSize: 15,
	},
})
