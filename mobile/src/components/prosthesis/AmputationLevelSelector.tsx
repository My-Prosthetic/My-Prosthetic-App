import React from "react"
import { StyleSheet, View } from "react-native"
import type { ParseKeys } from "i18next"
import { ThemedText } from "../ThemedText"
import { ThemedView } from "../ThemedView"
import { LimbDiagram } from "./SelectedPartDiagram"

export type LimbType = "upper" | "lower"

export type AmputationLevel =
	| "hemipelvectomy"
	| "hip_disarticulation"
	| "short_thigh"
	| "medium_thigh"
	| "long_thigh"
	| "knee_disarticulation"
	| "short_lower_leg"
	| "medium_lower_leg"
	| "long_lower_leg"
	| "syme"
	| "partial_foot"
	| "forequarter"
	| "shoulder_disarticulation"
	| "short_upper_arm"
	| "medium_upper_arm"
	| "long_upper_arm"
	| "elbow_disarticulation"
	| "short_forearm"
	| "medium_forearm"
	| "long_forearm"
	| "wrist_disarticulation"
	| "partial_hand"

export interface LevelOption {
	value: AmputationLevel
	labelKey: ParseKeys
}

export const LOWER_LEVELS: LevelOption[] = [
	{
		value: "hemipelvectomy",
		labelKey: "newProsthesis.amputationLevels.lower.hemipelvectomy",
	},
	{
		value: "hip_disarticulation",
		labelKey: "newProsthesis.amputationLevels.lower.hipDisarticulation",
	},
	{
		value: "short_thigh",
		labelKey: "newProsthesis.amputationLevels.lower.shortThigh",
	},
	{
		value: "medium_thigh",
		labelKey: "newProsthesis.amputationLevels.lower.mediumThigh",
	},
	{
		value: "long_thigh",
		labelKey: "newProsthesis.amputationLevels.lower.longThigh",
	},
	{
		value: "knee_disarticulation",
		labelKey: "newProsthesis.amputationLevels.lower.kneeDisarticulation",
	},
	{
		value: "short_lower_leg",
		labelKey: "newProsthesis.amputationLevels.lower.shortLowerLeg",
	},
	{
		value: "medium_lower_leg",
		labelKey: "newProsthesis.amputationLevels.lower.mediumLowerLeg",
	},
	{
		value: "long_lower_leg",
		labelKey: "newProsthesis.amputationLevels.lower.longLowerLeg",
	},
	{
		value: "syme",
		labelKey: "newProsthesis.amputationLevels.lower.syme",
	},
	{
		value: "partial_foot",
		labelKey: "newProsthesis.amputationLevels.lower.partialFoot",
	},
]

export const UPPER_LEVELS: LevelOption[] = [
	{
		value: "forequarter",
		labelKey: "newProsthesis.amputationLevels.upper.forequarter",
	},
	{
		value: "shoulder_disarticulation",
		labelKey: "newProsthesis.amputationLevels.upper.shoulderDisarticulation",
	},
	{
		value: "short_upper_arm",
		labelKey: "newProsthesis.amputationLevels.upper.shortUpperArm",
	},
	{
		value: "medium_upper_arm",
		labelKey: "newProsthesis.amputationLevels.upper.mediumUpperArm",
	},
	{
		value: "long_upper_arm",
		labelKey: "newProsthesis.amputationLevels.upper.longUpperArm",
	},
	{
		value: "elbow_disarticulation",
		labelKey: "newProsthesis.amputationLevels.upper.elbowDisarticulation",
	},
	{
		value: "short_forearm",
		labelKey: "newProsthesis.amputationLevels.upper.shortForearm",
	},
	{
		value: "medium_forearm",
		labelKey: "newProsthesis.amputationLevels.upper.mediumForearm",
	},
	{
		value: "long_forearm",
		labelKey: "newProsthesis.amputationLevels.upper.longForearm",
	},
	{
		value: "wrist_disarticulation",
		labelKey: "newProsthesis.amputationLevels.upper.wristDisarticulation",
	},
	{
		value: "partial_hand",
		labelKey: "newProsthesis.amputationLevels.upper.partialHand",
	},
]

interface Props {
	limb: LimbType
	value: AmputationLevel | null
	onChange: (value: AmputationLevel) => void
}

export function AmputationLevelSelector({ limb, value, onChange }: Props) {
	const levels = limb === "lower" ? LOWER_LEVELS : UPPER_LEVELS

	return (
		<View style={styles.container}>
			<View style={styles.imageColumn}>
				<LimbDiagram type={limb} selectedLevel={value} />
			</View>

			<View style={styles.optionsColumn}>
				{levels.map((level) => {
					const isSelected = value === level.value

					return (
						<ThemedView
							key={level.value}
							colorName={isSelected ? "blue2" : "blue0"}
							onPress={() => onChange(level.value)}
							accessibilityRole="radio"
							accessibilityState={{ checked: isSelected }}
							style={styles.pillButton}
						>
							<ThemedText
								tx={level.labelKey}
								variant={isSelected ? "H5" : "H4"}
								colorName={isSelected ? "bg_0" : "graphite0"}
								numberOfLines={1}
								adjustsFontSizeToFit
								style={styles.pillText}
							/>
						</ThemedView>
					)
				})}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 8,
	},
	imageColumn: {
		width: "40%",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "flex-start",
	},
	optionsColumn: {
		gap: 14,
		width: "60%",
	},
	pillButton: {
		height: 24,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	pillText: {
		textAlign: "center",
	},
})
