import { Pressable, StyleSheet, View } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import IconChevronDown from "@/assets/icons/chevron-down.svg"

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
					colorName="bg_0"
					style={styles.activityDropdown}
					borderColor="blue1"
				>
					<View style={styles.dropdownTextContainer}>
						<ThemedText
							tx={selectedKLevelData ? selectedKLevelData.labelKey : "profile.selectActivityLevel"}
							variant="H0"
							colorName="blue2"
							style={styles.kLevelLabel}
						/>

						{selectedKLevelData && (
							<ThemedText
								tx={selectedKLevelData.descriptionKey}
								variant="H4"
								colorName="blue2"
								style={styles.kLevelDescription}
								numberOfLines={1}
							/>
						)}
					</View>

					<IconChevronDown color={colors.blue2} />
				</ThemedView>
			</Pressable>

			{isOpen && (
				<Pressable onPress={(event) => event.stopPropagation()} style={styles.dropdownMenuWrapper}>
					<ThemedView colorName="bg_0" style={styles.dropdownMenu}>
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
										isSelected && { backgroundColor: colors.blue0 },
									]}
									accessibilityRole="button"
									accessibilityState={{ selected: isSelected }}
								>
									<View style={styles.dropdownOptionText}>
										<ThemedText
											tx={level.labelKey}
											variant="H1"
											colorName="blue2"
											style={styles.dropdownOptionLabel}
										/>

										<ThemedText
											tx={level.descriptionKey}
											variant="H4"
											colorName="blue2"
											style={styles.dropdownOptionDescription}
											numberOfLines={2}
										/>
									</View>
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
		borderRadius: 15,
		minHeight: 72,
		paddingVertical: 8,
		paddingHorizontal: 18,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
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
		borderRadius: 15,
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
})
