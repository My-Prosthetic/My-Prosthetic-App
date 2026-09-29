import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import type { KLevelId } from "./types"

type KLevel = {
	id: KLevelId
	labelKey:
		| "profile.kLevels.K0.label"
		| "profile.kLevels.K1.label"
		| "profile.kLevels.K2.label"
		| "profile.kLevels.K3.label"
		| "profile.kLevels.K4.label"
	descriptionKey:
		| "profile.kLevels.K0.description"
		| "profile.kLevels.K1.description"
		| "profile.kLevels.K2.description"
		| "profile.kLevels.K3.description"
		| "profile.kLevels.K4.description"
}

const K_LEVELS: KLevel[] = [
	{
		id: "K0",
		labelKey: "profile.kLevels.K0.label",
		descriptionKey: "profile.kLevels.K0.description",
	},
	{
		id: "K1",
		labelKey: "profile.kLevels.K1.label",
		descriptionKey: "profile.kLevels.K1.description",
	},
	{
		id: "K2",
		labelKey: "profile.kLevels.K2.label",
		descriptionKey: "profile.kLevels.K2.description",
	},
	{
		id: "K3",
		labelKey: "profile.kLevels.K3.label",
		descriptionKey: "profile.kLevels.K3.description",
	},
	{
		id: "K4",
		labelKey: "profile.kLevels.K4.label",
		descriptionKey: "profile.kLevels.K4.description",
	},
]

type KLevelSelectorProps = {
	selectedKLevel: KLevelId | null
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onSelect: (level: KLevelId) => Promise<void>
}

export function KLevelSelector({
	selectedKLevel,
	isOpen,
	onOpenChange,
	onSelect,
}: KLevelSelectorProps) {
	const { colors } = useTheme()
	const selectedKLevelData = selectedKLevel
		? (K_LEVELS.find((level) => level.id === selectedKLevel) ?? null)
		: null

	return (
		<>
			<Pressable
				onPress={(event) => {
					event.stopPropagation()
					onOpenChange(!isOpen)
				}}
				accessibilityRole="button"
				accessibilityState={{ expanded: isOpen }}
			>
				<ThemedView
					variant="wide"
					colorName="tertiary_base_3"
					style={[styles.activityDropdown, { shadowColor: colors.primary_base }]}
				>
					<View style={styles.dropdownTextContainer}>
						<ThemedText
							tx={selectedKLevelData ? selectedKLevelData.labelKey : "profile.selectActivityLevel"}
							variant="subTitle1"
							colorName="primary_base"
							style={styles.kLevelLabel}
						/>

						{selectedKLevelData && (
							<ThemedText
								tx={selectedKLevelData.descriptionKey}
								variant="subTitle2"
								colorName="secondary_base_0c"
								style={styles.kLevelDescription}
								numberOfLines={1}
							/>
						)}
					</View>

					<Ionicons
						name={isOpen ? "chevron-up" : "chevron-down"}
						size={22}
						color={colors.primary_base}
					/>
				</ThemedView>
			</Pressable>

			{isOpen && (
				<Pressable onPress={(event) => event.stopPropagation()} style={styles.dropdownMenuWrapper}>
					<ThemedView
						colorName="tertiary_base_3"
						style={[styles.dropdownMenu, { shadowColor: colors.primary_base }]}
					>
						{K_LEVELS.map((level, index) => {
							const isSelected = level.id === selectedKLevel

							return (
								<Pressable
									key={level.id}
									onPress={async (event) => {
										event.stopPropagation()

										try {
											await onSelect(level.id)
											onOpenChange(false)
										} catch (error) {
											console.error("Failed to save K-Level:", error)
										}
									}}
									style={[
										styles.dropdownOption,
										index !== K_LEVELS.length - 1 && {
											borderBottomWidth: StyleSheet.hairlineWidth,
											borderBottomColor: colors.primary_base_3,
										},
									]}
									accessibilityRole="button"
									accessibilityState={{ selected: isSelected }}
								>
									<View style={styles.dropdownOptionText}>
										<ThemedText
											tx={level.labelKey}
											variant="subTitle1"
											colorName="primary_base"
											style={[styles.dropdownOptionLabel, isSelected && styles.selectedOptionText]}
										/>

										<ThemedText
											tx={level.descriptionKey}
											variant="subTitle2"
											colorName="secondary_base_0c"
											style={styles.dropdownOptionDescription}
											numberOfLines={2}
										/>
									</View>

									{isSelected && (
										<Ionicons name="checkmark" size={20} color={colors.primary_base} />
									)}
								</Pressable>
							)
						})}
					</ThemedView>
				</Pressable>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	activityDropdown: {
		minHeight: 52,
		paddingVertical: 8,
		paddingHorizontal: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},
	dropdownTextContainer: {
		flex: 1,
		paddingRight: 8,
		alignItems: "flex-start",
	},
	kLevelLabel: {
		width: "100%",
		textAlign: "left",
		alignSelf: "flex-start",
	},
	kLevelDescription: {
		width: "100%",
		marginTop: 2,
		textAlign: "left",
		alignSelf: "flex-start",
	},
	dropdownMenuWrapper: {
		width: "100%",
	},
	dropdownMenu: {
		marginTop: 6,
		borderRadius: 16,
		overflow: "hidden",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},
	dropdownOption: {
		minHeight: 55,
		paddingHorizontal: 14,
		paddingVertical: 9,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	dropdownOptionText: {
		flex: 1,
		paddingRight: 8,
		alignItems: "flex-start",
	},
	dropdownOptionLabel: {
		width: "100%",
		textAlign: "left",
		alignSelf: "flex-start",
	},
	dropdownOptionDescription: {
		width: "100%",
		marginTop: 2,
		textAlign: "left",
		alignSelf: "flex-start",
	},
	selectedOptionText: {
		fontWeight: "700",
	},
})
