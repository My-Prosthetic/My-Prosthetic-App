import { useState } from "react"
import { Image, Modal, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import type { Prosthesis } from "@/db/repositories/prosthesisRepository"
import {
	AmputationLevelSelector,
	type AmputationLevel,
} from "@/src/components/prosthesis/AmputationLevelSelector"
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

const formatStartDate = (value: string | null | undefined) => {
	if (!value) return "-"

	const [year, month, day] = value.slice(0, 10).split("-")

	if (!year || !month || !day) return value

	return `${day}-${month}-${year}`
}

type ProsthesisSummaryProps = {
	prosthesis: Prosthesis
	onEdit: () => void
}

export function ProsthesisSummary({ prosthesis, onEdit }: ProsthesisSummaryProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [descriptionExpanded, setDescriptionExpanded] = useState(false)
	const [levelVisible, setLevelVisible] = useState(false)

	const sideLabel = prosthesis.side === "left" ? t("newProsthesis.left") : t("newProsthesis.right")
	const limbLabel =
		prosthesis.limbType === "upper" ? t("newProsthesis.upper") : t("newProsthesis.lower")
	const locationValue = `${t("prosthesisDetails.limb")} ${limbLabel} ${sideLabel}`
	const hasDescription = !!prosthesis.description?.trim()
	const amputationLevelKey = AMPUTATION_LEVEL_KEYS[prosthesis.amputationLevel]
	const amputationLevelLabel = amputationLevelKey
		? t(amputationLevelKey as any)
		: prosthesis.amputationLevel

	return (
		<>
			<View style={styles.prosthesisSummary}>
				<ThemedView
					colorName="primary_base"
					style={[styles.prosthesisIcon, { shadowColor: colors.primary_base }]}
				>
					<Image
						source={require("../../../../assets/mp_logo_accent.png")}
						resizeMode="contain"
						style={styles.prosthesisImage}
					/>
				</ThemedView>

				<View style={styles.summaryInfo}>
					<ThemedText
						variant="title"
						colorName="primary_base"
						style={styles.nameLabel}
						numberOfLines={2}
					>
						{prosthesis.name}
					</ThemedText>

					<ThemedView
						colorName="tertiary_base_2"
						borderColor="primary_base"
						style={styles.editButton}
						onPress={onEdit}
					>
						<ThemedText
							tx="prosthesisDetails.editProsthesis"
							variant="basic1"
							colorName="primary_base"
						/>
					</ThemedView>

					<SummaryRow label={t("prosthesisDetails.location")} value={locationValue} />
					<SummaryRow
						label={t("prosthesisDetails.startDate")}
						value={formatStartDate(prosthesis.startedAt ?? prosthesis.createdAt)}
					/>

					<ThemedView
						colorName="tertiary_base_1"
						style={styles.descriptionRow}
						onPress={hasDescription ? () => setDescriptionExpanded((value) => !value) : undefined}
					>
						<ThemedText
							variant="body1Regular"
							colorName="secondary_base_0c"
							style={styles.metaLabel}
						>
							{t("prosthesisDetails.description").toUpperCase()}:
						</ThemedText>
						<ThemedText
							variant="body1Regular"
							colorName="primary_base"
							style={styles.metaValue}
							numberOfLines={1}
						>
							{hasDescription
								? descriptionExpanded
									? t("prosthesisDetails.hideDescription")
									: t("prosthesisDetails.showDescription")
								: "-"}
						</ThemedText>
						{hasDescription && (
							<Ionicons
								name={descriptionExpanded ? "chevron-up" : "chevron-down"}
								size={11}
								color={colors.primary_base}
							/>
						)}
					</ThemedView>

					{descriptionExpanded && hasDescription && (
						<ThemedText
							variant="body1Regular"
							colorName="primary_base"
							style={styles.descriptionText}
						>
							{prosthesis.description}
						</ThemedText>
					)}

					<ThemedView
						colorName="tertiary_base_1"
						onPress={() => setLevelVisible(true)}
						style={styles.levelSection}
					>
						<ThemedText
							tx="prosthesisDetails.amputationLevel"
							variant="body1Regular"
							colorName="secondary_base_0c"
							style={styles.levelLabel}
						/>
						<View style={styles.levelValueRow}>
							<ThemedText
								variant="body1Regular"
								colorName="primary_base"
								style={styles.levelText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.75}
							>
								{amputationLevelLabel}
							</ThemedText>
							<Ionicons name="chevron-forward" size={11} color={colors.primary_base} />
						</View>
					</ThemedView>
				</View>
			</View>

			<Modal
				visible={levelVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setLevelVisible(false)}
			>
				<View style={styles.modalBackdrop}>
					<View
						pointerEvents="none"
						style={[styles.modalBackdropOverlay, { backgroundColor: colors.primary_base }]}
					/>
					<ThemedView colorName="tertiary_base_1" style={styles.levelModal}>
						<View style={styles.modalHeader}>
							<ThemedText
								tx="prosthesisDetails.amputationLevel"
								variant="subTitle2"
								colorName="primary_base"
							/>
							<ThemedView colorName="tertiary_base_1" onPress={() => setLevelVisible(false)}>
								<Ionicons name="close" size={26} color={colors.primary_base} />
							</ThemedView>
						</View>
						<AmputationLevelSelector
							limb={prosthesis.limbType}
							value={prosthesis.amputationLevel as AmputationLevel}
							onChange={() => {}}
						/>
					</ThemedView>
				</View>
			</Modal>
		</>
	)
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.metaRow}>
			<ThemedText variant="body1Regular" colorName="secondary_base_0c" style={styles.metaLabel}>
				{label.toUpperCase()}:
			</ThemedText>
			<ThemedText
				variant="body1Regular"
				colorName="primary_base"
				style={styles.metaValue}
				numberOfLines={1}
			>
				{value}
			</ThemedText>
		</View>
	)
}

const styles = StyleSheet.create({
	prosthesisSummary: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 18,
	},
	prosthesisIcon: {
		width: 140,
		height: 140,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	prosthesisImage: {
		width: 100,
		height: 100,
	},
	summaryInfo: {
		flex: 1,
		minWidth: 0,
		paddingTop: 1,
	},
	nameLabel: {
		fontSize: 20,
		lineHeight: 27,
		fontFamily: "Roboto_500Medium",
		letterSpacing: 0.1,
		textTransform: "uppercase",
		marginBottom: 4,
	},
	editButton: {
		height: 27,
		borderWidth: 1,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
		paddingHorizontal: 7,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		minWidth: 0,
		marginTop: 2,
	},
	metaLabel: {
		flexShrink: 0,
		marginRight: 3,
		fontSize: 9,
		lineHeight: 11,
		fontWeight: "600",
	},
	metaValue: {
		flex: 1,
		minWidth: 0,
		fontSize: 10,
		lineHeight: 12,
		fontWeight: "500",
	},
	descriptionRow: {
		flexDirection: "row",
		alignItems: "center",
		minWidth: 0,
		marginTop: 2,
	},
	descriptionText: {
		fontSize: 11,
		lineHeight: 12,
		marginTop: 3,
		marginBottom: 3,
	},
	levelSection: {
		marginTop: 4,
	},
	levelLabel: {
		fontSize: 8,
		lineHeight: 10,
		fontWeight: "600",
	},
	levelValueRow: {
		flexDirection: "row",
		alignItems: "center",
		minWidth: 0,
		marginTop: 1,
	},
	levelText: {
		flex: 1,
		minWidth: 0,
		fontSize: 11,
		lineHeight: 12,
		fontWeight: "500",
		marginRight: 2,
	},
	modalBackdrop: {
		flex: 1,
		justifyContent: "center",
		padding: 20,
	},
	modalBackdropOverlay: {
		...StyleSheet.absoluteFill,
		opacity: 0.45,
	},
	levelModal: {
		borderRadius: 18,
		padding: 16,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
})
