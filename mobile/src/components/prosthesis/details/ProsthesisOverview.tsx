import { useState } from "react"
import { StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import type { Prosthesis } from "@/db/repositories/prosthesisRepository"
import { useTheme } from "@/context/ThemeContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { formatDate } from "@/src/utils/dateTimeUtils"

import IconChevronUp from "@/assets/icons/chevron-up.svg.svg"
import IconChevronDown from "@/assets/icons/chevron-down.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconPencil from "@/assets/icons/pencil.svg"
import IconFile from "@/assets/icons/file.svg"
import IconLeg from "@/assets/icons/leg_logo.svg"

const toAmputationLevelKey = (level: string) =>
	level.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())

type ProsthesisOverviewProps = {
	prosthesis: Prosthesis
	onEdit: () => void
	onAddIncident: () => void
}

export function ProsthesisOverview({ prosthesis, onEdit, onAddIncident }: ProsthesisOverviewProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [descriptionExpanded, setDescriptionExpanded] = useState(false)

	const limbLabel = t(
		prosthesis.limbType === "upper" ? "newProsthesis.upper" : "newProsthesis.lower"
	)
	const sideLabel = t(prosthesis.side === "left" ? "newProsthesis.left" : "newProsthesis.right")
	const levelKey = toAmputationLevelKey(prosthesis.amputationLevel)
	const levelLabel = t(`newProsthesis.amputationLevels.${prosthesis.limbType}.${levelKey}` as any, {
		defaultValue: prosthesis.amputationLevel,
	})
	const startedAt = prosthesis.startedAt ?? prosthesis.createdAt

	//TODO
	const onHandleImagesPress = () => {}

	return (
		<>
			<ThemedView shadow colorName="bg_0" variant="background" style={styles.headerContainer}>
				<ThemedHeader tx="prosthesisDetails.title" />

				<View style={styles.headerCard}>
					<ThemedView colorName="blue2" style={styles.prosthesisIconContainer}>
						<IconLeg color={colors.blue0} width={"80%"} height={"80%"} />
					</ThemedView>
					<View style={styles.headerTextContainer}>
						<ThemedText variant="H0" colorName="blue2" numberOfLines={2}>
							{prosthesis.name}
						</ThemedText>
						<ThemedText variant="H4" colorName="blue2">
							{t("prosthesisDetails.limb")} {sideLabel} {limbLabel}
						</ThemedText>
					</View>
					<ThemedView
						onPress={onEdit}
						hitSlop={9}
						accessibilityRole="button"
						accessibilityLabel={t("prosthesisDetails.editProsthesis")}
					>
						<IconPencil width={22} height={22} color={colors.magenta0} />
					</ThemedView>
				</View>
			</ThemedView>

			<View style={styles.detailsContainer}>
				<DetailRow label={t("prosthesisDetails.amputationLevel")} value={levelLabel} />
				<ThemedView variant="divider" colorName="blue1" />
				<DetailRow label={t("newProsthesis.startOfUsageDate")} value={formatDate(startedAt)} />
				<ThemedView variant="divider" colorName="blue1" />
				<DetailRow
					label={t("newProsthesis.replacementDate")}
					value={formatDate(prosthesis.replacementDate)}
				/>
				<ThemedView variant="divider" colorName="blue1" />

				<ThemedView
					onPress={() => setDescriptionExpanded((expanded) => !expanded)}
					style={styles.noteHeaderRow}
				>
					<ThemedText tx="prosthesisDetails.description" variant="H4" colorName="blue2" />
					{descriptionExpanded ? (
						<IconChevronUp color={colors.blue1} width={20} height={20} />
					) : (
						<IconChevronDown color={colors.blue1} width={20} height={20} />
					)}
				</ThemedView>
				{descriptionExpanded && (
					<View style={styles.noteContent}>
						<ThemedText variant="H2" colorName="blue2">
							{prosthesis.description?.trim() || t("prosthesisDetails.noDescription")}
						</ThemedText>
					</View>
				)}
				<ThemedView variant="divider" colorName="blue1" />
				<ThemedView
					onPress={onHandleImagesPress}
					variant="wide"
					colorName="blue0"
					leftChild={<IconFile color={colors.blue2} width={20} height={20} />}
					centerChild={<ThemedText tx="newIncident.addImages" variant="H1" colorName="blue2" />}
					rightChild={<IconChevronRight color={colors.blue2} />}
					style={{ marginTop: 20 }}
				/>
			</View>
		</>
	)
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.detailRow}>
			<ThemedText variant="H4" colorName="blue2">
				{label}:
			</ThemedText>
			<ThemedText variant="H2" colorName="blue2">
				{value}
			</ThemedText>
		</View>
	)
}

const styles = StyleSheet.create({
	headerContainer: {
		flexDirection: "column",
		width: "119%",
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
	},
	headerCard: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
		marginBottom: 20,
		paddingHorizontal: 8,
	},
	prosthesisIconContainer: {
		width: 80,
		height: 80,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTextContainer: {
		flex: 1,
		marginLeft: 15,
	},
	detailsContainer: {
		marginVertical: 25,
		width: "100%",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
	},
	noteHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	noteContent: {
		paddingBottom: 10,
	},
})
