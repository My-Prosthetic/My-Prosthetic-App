import { Pressable, View, StyleSheet } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useTheme } from "@/context/ThemeContext"
import { ThemedInput } from "@/src/components/ThemedInput"

import type { MeasurementLevel } from "@/src/utils/measurementUtils"

import IconTrash from "@/assets/icons/trash-bin.svg"

export function MeasurementCardItem({
	item,
	levelNumber,
	hasInvalidValue,
	onValueChange,
	onDistancePress,
	onDeletePress,
	canDelete,
}: {
	item: MeasurementLevel
	levelNumber: number
	hasInvalidValue: boolean
	onValueChange: (level: number, value: string) => void
	onDistancePress: () => void
	onDeletePress: () => void
	canDelete: boolean
}) {
	const { colors } = useTheme()

	return (
		<View style={styles.levelRow}>
			<ThemedView colorName="bg_0" borderColor="blue1" style={styles.cardItem}>
				<View style={styles.cardRow}>
					<ThemedView style={styles.cardInfoContent} onPress={onDistancePress}>
						<View style={[styles.badge, { backgroundColor: colors.blue1 }]}>
							<ThemedText variant="H2" colorName="bg_0">
								L{levelNumber}
							</ThemedText>
						</View>
						<View style={styles.cardInfo}>
							<ThemedText tx="measurements.measurementHeight" variant="H4" colorName="blue2" />
							<ThemedText
								tx="measurements.distanceFromTip"
								txOptions={{ distance: item.distance }}
								variant="H2"
								colorName="blue2"
							/>
						</View>
					</ThemedView>

					<View style={styles.valueRow}>
						<View style={styles.valueField}>
							<ThemedInput
								variant="float"
								value={item.value}
								onChangeText={(value) => onValueChange(item.level, value)}
								viewStyle={[
									{
										backgroundColor: colors.bg_1,
										borderColor: hasInvalidValue ? colors.false : colors.blue1,
										borderWidth: 1,
									},
								]}
							/>
						</View>
						<ThemedText
							tx="measurements.centimeters"
							variant="H2"
							colorName="blue2"
							style={styles.centimetersLabel}
						/>
					</View>
				</View>
				{hasInvalidValue && (
					<ThemedText
						tx="measurements.invalidMeasurementValue"
						variant="H4"
						colorName="false"
						style={styles.measurementValueError}
					/>
				)}
			</ThemedView>
			<Pressable
				onPress={onDeletePress}
				disabled={!canDelete}
				hitSlop={8}
				style={[styles.deleteLevelButton, !canDelete && styles.disabledAction]}
			>
				<IconTrash color={colors.false} width={22} height={22} />
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	levelRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginRight: -16,
	},
	cardItem: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 12,
		minHeight: 76,
		flexDirection: "column",
	},
	cardRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	cardInfoContent: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 9,
	},
	badge: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	cardInfo: {
		flex: 1,
		justifyContent: "center",
		gap: 2,
	},
	valueRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	valueField: {
		width: 60,
		alignItems: "center",
	},
	centimetersLabel: {
		alignSelf: "flex-end",
		paddingBottom: 4,
	},
	measurementValueError: {
		marginTop: 4,
		textAlign: "center",
	},
	deleteLevelButton: {
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: -8,
	},
	disabledAction: {
		opacity: 0.5,
	},
})
