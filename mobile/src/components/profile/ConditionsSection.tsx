import { Alert, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import type { Condition } from "./types"

type ConditionsSectionProps = {
	conditions: Condition[]
	selectedConditionId: string | null
	onSelectCondition: (id: string | null) => void
	isExpanded: boolean
	onExpandedChange: (expanded: boolean) => void
	onAddPress: () => void
	onDelete: (id: string) => Promise<void>
}

export function ConditionsSection({
	conditions,
	selectedConditionId,
	onSelectCondition,
	isExpanded,
	onExpandedChange,
	onAddPress,
	onDelete,
}: ConditionsSectionProps) {
	const { t } = useTranslation()

	const visibleConditions = isExpanded ? conditions : conditions.slice(0, 3)
	const hiddenConditionsCount = Math.max(conditions.length - 3, 0)

	const confirmDelete = (condition: Condition) => {
		Alert.alert(
			t("profile.deleteConditionTitle"),
			t("profile.deleteConditionMessage", { condition: condition.name }),
			[
				{
					text: t("profile.cancel"),
					style: "cancel",
					onPress: () => onSelectCondition(null),
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
						colorName={selectedConditionId === condition.id ? "false" : "blue2"}
						style={styles.conditionTag}
						onTouchStart={(event) => event.stopPropagation()}
						onPress={() => {
							if (selectedConditionId === condition.id) {
								confirmDelete(condition)
							} else {
								onSelectCondition(condition.id)
							}
						}}
						accessibilityLabel={
							selectedConditionId === condition.id
								? t("profile.delete")
								: t("profile.conditionName", { condition: condition.name })
						}
					>
						<ThemedText
							variant="H5"
							colorName="bg_0"
							numberOfLines={1}
							style={styles.conditionTagText}
						>
							{selectedConditionId === condition.id ? t("profile.delete") : condition.name}
						</ThemedText>
					</ThemedView>
				))}

				{!isExpanded && hiddenConditionsCount > 0 && (
					<ThemedView
						onPress={() => {
							onExpandedChange(true)
						}}
						accessibilityLabel={t("profile.showMoreConditions", {
							count: hiddenConditionsCount,
						})}
						hitSlop={{ top: 7, bottom: 7 }}
						variant="tag"
						colorName="blue2"
						style={styles.conditionTag}
					>
						<ThemedText variant="H5" colorName="bg_0">
							+{hiddenConditionsCount}
						</ThemedText>
					</ThemedView>
				)}

				<ThemedView style={styles.conditionTag} onPress={onAddPress} accessibilityRole="button">
					<ThemedText
						tx="profile.addCondition"
						variant="H5"
						colorName="blue1"
						style={styles.addConditionText}
					/>
				</ThemedView>
			</View>
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
		height: 30,
		marginRight: 6,
		marginVertical: 7,
		paddingHorizontal: 10,
		flexDirection: "row",
		alignItems: "center",
	},
	conditionTagText: {
		maxWidth: 150,
	},
	addConditionText: {
		marginRight: 3,
	},
})
