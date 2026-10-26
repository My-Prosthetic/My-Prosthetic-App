import React, { useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"
import { DatePickerModal } from "@/src/components/DatePicker"
import { HourPickerModal } from "@/src/components/HourPicker"
import { formatDate } from "@/src/utils/dateFormatter"
import { formatHour, type FormatHourOptions } from "@/src/utils/hourFormatter"
import { ThemedDialog } from "@/src/components/ThemedDialog"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

import IconPlus from "@/assets/icons/plus.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"
import { ThemedInput } from "@/src/components/ThemedInput"
import { MeasurementDiagram } from "@/src/components/measure/MeasurementDiagram"

export interface MeasurementLevel {
	level: string
	value: string
	distance: number
}

// TODO
const INITIAL_MEASUREMENTS: MeasurementLevel[] = [
	{ level: "1", value: "", distance: 15 },
	{ level: "2", value: "", distance: 10 },
	{ level: "3", value: "", distance: 5 },
]

const MAX_MEASUREMENT_LEVELS = 5

function sortAndRenumberLevels(levels: MeasurementLevel[]): MeasurementLevel[] {
	return [...levels]
		.sort((left, right) => right.distance - left.distance)
		.map((item, index) => ({ ...item, level: String(index + 1) }))
}

function isValidMeasurementValue(value: string): boolean {
	const normalizedValue = value.trim().replace(",", ".")
	return /^\d+(?:\.\d+)?$/.test(normalizedValue) && Number.isFinite(Number(normalizedValue))
}

export default function AddMeasurementScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [measurementLevels, setMeasurementLevels] =
		useState<MeasurementLevel[]>(INITIAL_MEASUREMENTS)
	const [distanceDialogTarget, setDistanceDialogTarget] = useState<
		{ type: "add" } | { type: "edit"; level: string } | null
	>(null)
	const [measurementDate, setMeasurementDate] = useState<Date>(() => new Date())
	const [measurementTime, setMeasurementTime] = useState<FormatHourOptions>(() => {
		const now = new Date()
		return { hour: now.getHours(), minute: now.getMinutes() }
	})
	const [isDateModalVisible, setIsDateModalVisible] = useState(false)
	const [isHourModalVisible, setIsHourModalVisible] = useState(false)

	const isFutureMoment = (date: Date, hour: number, minute: number) => {
		const candidate = new Date(date)
		candidate.setHours(hour, minute, 0, 0)
		return candidate.getTime() > Date.now()
	}

	const validateMoment = (date: Date, hour: number, minute: number) => {
		if (!isFutureMoment(date, hour, minute)) return true

		Alert.alert(
			t("common.error"),
			"Moment pomiaru nie może być z przyszłości" //TODO(ai) use translation key
		)
		return false
	}

	const handleOnSelectSideLeft = () => {
		// TODO (ai)...
	}

	const handleOnSelectSideRight = () => {
		// TODO
	}

	const handleOnSelectLimbUpper = () => {
		// TODO
	}

	const handleOnSelectLimbLower = () => {
		// TODO ...(ai)
	}

	const handleOnAddLevel = () => {
		if (measurementLevels.length >= MAX_MEASUREMENT_LEVELS) return
		setDistanceDialogTarget({ type: "add" })
	}

	const isValidDistance = (distance: string) =>
		/^\d+$/.test(distance.trim()) && Number.isSafeInteger(Number(distance)) && Number(distance) >= 0

	const handleDistanceSave = (distanceValue: string) => {
		const distance = Number(distanceValue)
		const target = distanceDialogTarget
		if (!target) return

		setMeasurementLevels((levels) => {
			if (target.type === "add") {
				if (levels.length >= MAX_MEASUREMENT_LEVELS) return levels
				return sortAndRenumberLevels([...levels, { level: "", value: "", distance }])
			}

			return sortAndRenumberLevels(
				levels.map((item) => (item.level === target.level ? { ...item, distance } : item))
			)
		})
		setDistanceDialogTarget(null)
	}

	const mockSaveMeasurement = () => {
		if (!validateMoment(measurementDate, measurementTime.hour, measurementTime.minute)) return

		const missingLevelIndex = measurementLevels.findIndex((item) => !item.value.trim())
		if (missingLevelIndex !== -1) {
			Alert.alert(t("common.error"), t("measurements.missingMeasurement"))
			return
		}

		const invalidLevelIndex = measurementLevels.findIndex(
			(item) => !isValidMeasurementValue(item.value)
		)
		if (invalidLevelIndex !== -1) {
			Alert.alert(
				t("common.error"),
				t("measurements.invalidMeasurementForLevel", { level: invalidLevelIndex + 1 })
			)
			return
		}

		// TODO: Persist measurementLevels to the database.
	}

	const handleOnDelete = () => {
		// TODO
	}

	const handleRemoveLevel = (level: string) => {
		if (measurementLevels.length <= 1) return
		const levelIndex = measurementLevels.findIndex((item) => item.level === level)
		if (levelIndex === -1) return

		Alert.alert(
			t("measurements.removeLevelTitle"),
			t("measurements.removeLevelConfirmation", { level: levelIndex + 1 }),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: () => {
						setMeasurementLevels((levels) =>
							sortAndRenumberLevels(levels.filter((item) => item.level !== level))
						)
					},
				},
			]
		)
	}

	const handleOpenDistanceDialog = (level: string) => {
		setDistanceDialogTarget({ type: "edit", level })
	}

	const distanceDialogItem =
		distanceDialogTarget?.type === "edit"
			? measurementLevels.find((item) => item.level === distanceDialogTarget.level)
			: undefined
	const distanceDialogInitialValue =
		distanceDialogTarget?.type === "edit" ? String(distanceDialogItem?.distance ?? "") : ""
	const distanceDialogTitle =
		distanceDialogTarget?.type === "edit"
			? t("measurements.editDistanceTitle", {
					level:
						measurementLevels.findIndex((item) => item.level === distanceDialogTarget.level) + 1,
				})
			: t("measurements.addDistanceTitle", { level: measurementLevels.length + 1 })
	const validateDistance = (value: string) =>
		isValidDistance(value) &&
		!measurementLevels.some(
			(item) =>
				item.level !==
					(distanceDialogTarget?.type === "edit" ? distanceDialogTarget.level : undefined) &&
				item.distance === Number(value)
		)

	const handleMeasurementValueChange = (level: string, input: string) => {
		setMeasurementLevels((levels) =>
			levels.map((item) => (item.level === level ? { ...item, value: input } : item))
		)
	}

	const handleDateSave = (date: Date) => {
		if (!validateMoment(date, measurementTime.hour, measurementTime.minute)) return
		setMeasurementDate(date)
	}

	const handleHourSave = (hour: number, minute: number) => {
		if (!validateMoment(measurementDate, hour, minute)) return
		setMeasurementTime({ hour, minute })
	}

	return (
		<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
			<ThemedView variant="background" colorName="bg_1" style={styles.scrollContent}>
				<ThemedHeader tx="measurements.title" />
				<View style={styles.selectorsSection}>
					<View>
						<ThemedText tx="measurements.selectLimb" variant="H1" colorName="blue2" />
					</View>

					<View style={styles.switchesGroup}>
						<ThemedSelectiveSwitch
							leftTx="newProsthesis.left"
							rightTx="newProsthesis.right"
							selectLeft={handleOnSelectSideLeft}
							selectRight={handleOnSelectSideRight}
							initialState="left"
						/>
						<ThemedSelectiveSwitch
							leftTx="newProsthesis.upper"
							rightTx="newProsthesis.lower"
							selectLeft={handleOnSelectLimbUpper}
							selectRight={handleOnSelectLimbLower}
							initialState="right"
						/>
					</View>
				</View>

				<View style={styles.dateTimeSection}>
					<View style={styles.dateTimeField}>
						<ThemedText
							tx="measurements.date"
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
						/>
						<ThemedView
							colorName="bg_0"
							borderColor="blue1"
							style={styles.inputBox}
							onPress={() => setIsDateModalVisible(true)}
						>
							<ThemedText variant="H3" colorName="blue2">
								{formatDate(measurementDate, "numeric")}
							</ThemedText>
						</ThemedView>
					</View>

					<View style={styles.dateTimeField}>
						<ThemedText
							tx="measurements.time"
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
						/>
						<ThemedView
							colorName="bg_0"
							borderColor="blue1"
							style={styles.inputBox}
							onPress={() => setIsHourModalVisible(true)}
						>
							<ThemedText variant="H3" colorName="blue2">
								{formatHour(measurementTime)}
							</ThemedText>
						</ThemedView>
					</View>
				</View>

				<View style={styles.schemaSection}>
					<ThemedText
						tx="measurements.schema"
						variant="H1"
						colorName="blue2"
						style={[styles.sectionTitle, { alignSelf: "flex-start" }]}
					/>
					<MeasurementDiagram levels={measurementLevels} style={{ width: 100, height: 150 }} />
				</View>

				<View style={styles.valuesSection}>
					<ThemedText
						tx="measurements.circumferenceValues"
						variant="H1"
						colorName="blue2"
						style={styles.sectionTitle}
					/>

					<View style={styles.measurementsList}>
						{measurementLevels.map((item, index) => (
							<MeasurementCardItem
								key={item.level}
								item={item}
								levelNumber={index + 1}
								hasInvalidValue={Boolean(item.value.trim()) && !isValidMeasurementValue(item.value)}
								onValueChange={handleMeasurementValueChange}
								onDistancePress={() => handleOpenDistanceDialog(item.level)}
								onDeletePress={() => handleRemoveLevel(item.level)}
								canDelete={measurementLevels.length > 1}
							/>
						))}
					</View>

					<ThemedView
						borderColor="blue1"
						variant="wide"
						onPress={handleOnAddLevel}
						disabled={measurementLevels.length >= MAX_MEASUREMENT_LEVELS}
						style={[
							styles.addLevelButton,
							measurementLevels.length >= MAX_MEASUREMENT_LEVELS && styles.disabledAction,
						]}
						leftChild={<IconPlus color={colors.blue2} width={18} height={18} />}
						centerChild={<ThemedText tx="measurements.addLevel" variant="H2" colorName="blue2" />}
					/>
				</View>

				<ThemedView
					colorName="blue2"
					variant="wide"
					onPress={mockSaveMeasurement}
					style={styles.saveButton}
					centerChild={<ThemedText tx="measurements.save" variant="H1" colorName="bg_0" />}
				/>

				<ThemedView onPress={handleOnDelete} variant="narrow" style={styles.deleteButton}>
					<View style={styles.deleteContent}>
						<IconTrash color={colors.false} width={26} height={26} />
						<ThemedText tx="measurements.delete" variant="H1" colorName="false" />
					</View>
				</ThemedView>
			</ThemedView>
			<DatePickerModal
				visible={isDateModalVisible}
				onClose={() => setIsDateModalVisible(false)}
				onSave={(selectedDate) => {
					handleDateSave(selectedDate)
					setIsDateModalVisible(false)
				}}
				initialDate={measurementDate}
			/>

			<HourPickerModal
				visible={isHourModalVisible}
				onClose={() => setIsHourModalVisible(false)}
				onSave={(hour, minute) => {
					handleHourSave(hour, minute)
					setIsHourModalVisible(false)
				}}
				initialHour={measurementTime.hour}
				initialMinute={measurementTime.minute}
			/>
			<ThemedDialog
				visible={distanceDialogTarget !== null}
				title={distanceDialogTitle}
				errorMessage={t("measurements.invalidDistance")}
				variant="float"
				initialValue={distanceDialogInitialValue}
				validate={validateDistance}
				onSave={handleDistanceSave}
				onCancel={() => setDistanceDialogTarget(null)}
			/>
		</ScrollView>
	)
}

function MeasurementCardItem({
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
	onValueChange: (level: string, value: string) => void
	onDistancePress: () => void
	onDeletePress: () => void
	canDelete: boolean
}) {
	const { colors } = useTheme()

	return (
		<View style={styles.levelRow}>
			<ThemedView colorName="bg_0" borderColor="blue1" style={styles.cardItem}>
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
							onPressIn={(event) => event.stopPropagation()}
							viewStyle={[
								styles.valueInputBox,
								{
									backgroundColor: colors.bg_1,
									borderColor: hasInvalidValue ? colors.false : colors.blue1,
									borderWidth: 1,
								},
							]}
							textStyle={styles.valueInputText}
						/>
						{hasInvalidValue && (
							<ThemedText
								tx="measurements.invalidMeasurementValue"
								variant="H4"
								colorName="false"
								style={styles.measurementValueError}
							/>
						)}
					</View>
					<ThemedText
						tx="measurements.centimeters"
						variant="H2"
						colorName="blue2"
						style={styles.centimetersLabel}
					/>
				</View>
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
	scrollView: {
		flex: 1,
		width: "100%",
	},
	scrollContent: {
		paddingBottom: 10,
		gap: 20,
	},
	selectorsSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	switchesGroup: {
		gap: 12,
		alignItems: "flex-end",
	},
	dateTimeSection: {
		flexDirection: "row",
		gap: 16,
	},
	dateTimeField: {
		flex: 1,
		gap: 8,
	},
	fieldLabel: {
		paddingLeft: 4,
	},
	inputBox: {
		minHeight: 44,
		borderRadius: 15,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 12,
	},
	inputFieldText: {
		width: "100%",
		textAlign: "center",
		fontFamily: "Cabin-Medium",
		fontSize: 16,
		padding: 0,
	},
	schemaSection: {
		gap: 12,
		marginTop: 8,
		alignItems: "center",
	},
	sectionTitle: {
		paddingLeft: 4,
	},
	valuesSection: {
		gap: 12,
	},
	measurementsList: {
		gap: 12,
	},
	levelRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginRight: -16,
	},
	cardItem: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 12,
		minHeight: 76,
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
	centimetersLabel: {
		alignSelf: "flex-end",
		paddingBottom: 4,
	},
	valueField: {
		width: 60,
		alignItems: "center",
	},
	measurementValueError: {
		marginTop: 4,
		textAlign: "center",
	},
	valueInputBox: {
		width: 60,
		height: 38,
		borderRadius: 12,
	},
	valueInputText: {
		width: "100%",
		textAlign: "center",
		fontFamily: "Cabin-Medium",
		fontSize: 15,
		paddingLeft: 0,
	},
	addLevelButton: {
		borderStyle: "dashed",
		borderWidth: 1.5,
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
	saveButton: {
		marginTop: 10,
	},
	deleteButton: {
		alignItems: "center",
		justifyContent: "center",
		marginTop: -15,
	},
	deleteContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
})
