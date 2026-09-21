import { useEffect, useRef, useState } from "react"
import { Alert, Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import type { Condition } from "./types"

type ConditionsSectionProps = {
	conditions: Condition[]
	isExpanded: boolean
	onExpandedChange: (expanded: boolean) => void
	onAddPress: () => void
	onDelete: (id: string) => Promise<void>
	onCopy: () => void
}

export function ConditionsSection({
	conditions,
	isExpanded,
	onExpandedChange,
	onAddPress,
	onDelete,
	onCopy,
}: ConditionsSectionProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [copiedConditionId, setCopiedConditionId] = useState<string | null>(null)
	const copyFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		return () => {
			if (copyFeedbackTimer.current) {
				clearTimeout(copyFeedbackTimer.current)
			}
		}
	}, [])

	const visibleConditions = isExpanded ? conditions : conditions.slice(0, 3)
	const hiddenConditionsCount = Math.max(conditions.length - 3, 0)

	const handleConditionCopy = async (condition: Condition) => {
		onCopy()
		await Clipboard.setStringAsync(condition.name)
		setCopiedConditionId(condition.id)

		if (copyFeedbackTimer.current) {
			clearTimeout(copyFeedbackTimer.current)
		}

		copyFeedbackTimer.current = setTimeout(() => {
			setCopiedConditionId(null)
		}, 1500)
	}

	const confirmDelete = (condition: Condition) => {
		Alert.alert(
			t("profile.deleteConditionTitle"),
			t("profile.deleteConditionMessage", { condition: condition.name }),
			[
				{
					text: t("profile.cancel"),
					style: "cancel",
				},
				{
					text: t("profile.delete"),
					style: "destructive",
					onPress: () => void onDelete(condition.id),
				},
			]
		)
	}

	return (
		<View style={styles.conditionsArea}>
			<View style={styles.tagsContainer}>
				{visibleConditions.map((condition) => (
					<ThemedView
						key={condition.id}
						variant="tag"
						colorName="primary_base"
						style={styles.conditionTag}
					>
						<Pressable
							onPress={async (event) => {
								event.stopPropagation()
								await handleConditionCopy(condition)
							}}
							accessibilityRole="button"
							accessibilityLabel={t("profile.copyCondition", {
								condition: condition.name,
							})}
							style={styles.conditionCopyArea}
						>
							<ThemedText
								variant="subTitle2"
								colorName="accent_base"
								numberOfLines={1}
								style={styles.conditionTagText}
							>
								{condition.name}
							</ThemedText>
						</Pressable>

						<Pressable
							onPress={(event) => {
								event.stopPropagation()
								confirmDelete(condition)
							}}
							accessibilityRole="button"
							accessibilityLabel={t("profile.deleteCondition", {
								condition: condition.name,
							})}
							hitSlop={8}
							style={styles.deleteConditionButton}
						>
							<Ionicons name="close" size={14} color={colors.accent_base} />
						</Pressable>
					</ThemedView>
				))}

				{!isExpanded && hiddenConditionsCount > 0 && (
					<Pressable
						onPress={(event) => {
							event.stopPropagation()
							onExpandedChange(true)
						}}
						accessibilityRole="button"
						accessibilityLabel={t("profile.showMoreConditions", {
							count: hiddenConditionsCount,
						})}
					>
						<ThemedView variant="tag" colorName="primary_base" style={styles.moreTag}>
							<ThemedText variant="subTitle2" colorName="accent_base" style={styles.moreTagText}>
								+{hiddenConditionsCount}
							</ThemedText>
						</ThemedView>
					</Pressable>
				)}

				<ThemedView
					variant="tag"
					colorName="tertiary_base_3"
					borderColor="primary_base"
					style={styles.addConditionTag}
					onPress={onAddPress}
					accessibilityRole="button"
				>
					<ThemedText
						tx="profile.addCondition"
						variant="subTitle2"
						colorName="primary_base"
						style={styles.addConditionText}
					/>

					<Ionicons name="add-outline" size={15} color={colors.primary_base} />
				</ThemedView>
			</View>

			{copiedConditionId !== null && (
				<View style={styles.copyFeedback}>
					<Ionicons name="checkmark-circle-outline" size={15} color={colors.primary_base} />
					<ThemedText
						tx="profile.copiedToClipboard"
						variant="subTitle2"
						colorName="primary_base"
						style={styles.copyFeedbackText}
					/>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	conditionsArea: {
		width: "100%",
	},
	tagsContainer: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
	},
	conditionTag: {
		minHeight: 28,
		marginRight: 6,
		marginBottom: 6,
		paddingHorizontal: 10,
		paddingVertical: 4,
		flexDirection: "row",
		alignItems: "center",
	},
	conditionCopyArea: {
		flexShrink: 1,
	},
	conditionTagText: {
		maxWidth: 150,
	},
	deleteConditionButton: {
		marginLeft: 6,
		alignItems: "center",
		justifyContent: "center",
	},
	moreTag: {
		minWidth: 38,
		minHeight: 28,
		marginRight: 6,
		marginBottom: 6,
		paddingHorizontal: 9,
		paddingVertical: 4,
		justifyContent: "center",
	},
	moreTagText: {
		textAlign: "center",
	},
	addConditionTag: {
		minHeight: 28,
		marginBottom: 6,
		paddingHorizontal: 9,
		paddingVertical: 3,
		borderWidth: 1,
	},
	addConditionText: {
		marginRight: 3,
	},
	copyFeedback: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	copyFeedbackText: {
		marginLeft: 5,
	},
})
