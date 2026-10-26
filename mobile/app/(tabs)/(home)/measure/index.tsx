import React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import IconPlus from "@/assets/icons/plus.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"
import { ThemedDialog } from "@/src/components/ThemedDialog"
import { DatePickerModal } from "@/src/components/DatePicker"
import { HourPickerModal } from "@/src/components/HourPicker"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { MeasurementCardItem } from "@/src/components/measure/MeasurementCard"
import { MeasurementDiagram } from "@/src/components/measure/MeasurementDiagram"
import { useAddMeasurementForm } from "@/src/hooks/useAddMeasurementForm"
import { isValidMeasurementValue, MAX_MEASUREMENT_LEVELS } from "@/src/utils/measurementUtils"
import { formatDate } from "@/src/utils/dateFormatter"
import { formatHour } from "@/src/utils/hourFormatter"

export default function AddMeasurementScreen() {
	const form = useAddMeasurementForm()
	const { colors } = useTheme()

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
							key={`side-${form.side}`}
							leftTx="newProsthesis.left"
							rightTx="newProsthesis.right"
							selectLeft={() => form.handleSideChange("left")}
							selectRight={() => form.handleSideChange("right")}
							initialState={form.side}
						/>
						<ThemedSelectiveSwitch
							key={`limb-${form.limbType}`}
							leftTx="newProsthesis.upper"
							rightTx="newProsthesis.lower"
							selectLeft={() => form.handleLimbTypeChange("upper")}
							selectRight={() => form.handleLimbTypeChange("lower")}
							initialState={form.limbType === "upper" ? "left" : "right"}
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
							onPress={() => form.setIsDateModalVisible(true)}
						>
							<ThemedText variant="H3" colorName="blue2">
								{formatDate(form.measurementDate, "numeric")}
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
							onPress={() => form.setIsHourModalVisible(true)}
						>
							<ThemedText variant="H3" colorName="blue2">
								{formatHour(form.measurementTime)}
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
					<MeasurementDiagram levels={form.measurementLevels} style={{ width: 100, height: 150 }} />
				</View>

				<View style={styles.valuesSection}>
					<ThemedText
						tx="measurements.circumferenceValues"
						variant="H1"
						colorName="blue2"
						style={styles.sectionTitle}
					/>

					<View style={styles.measurementsList}>
						{form.measurementLevels.map((item, index) => (
							<MeasurementCardItem
								key={item.level}
								item={item}
								levelNumber={index + 1}
								hasInvalidValue={Boolean(item.value.trim()) && !isValidMeasurementValue(item.value)}
								onValueChange={form.handleMeasurementValueChange}
								onDistancePress={() => form.handleOpenDistanceDialog(item.level)}
								onDeletePress={() => form.handleRemoveLevel(item.level)}
								canDelete={form.measurementLevels.length > 1}
							/>
						))}
					</View>

					<ThemedView
						borderColor="blue1"
						variant="wide"
						onPress={form.handleOnAddLevel}
						disabled={form.measurementLevels.length >= MAX_MEASUREMENT_LEVELS}
						style={[
							styles.addLevelButton,
							form.measurementLevels.length >= MAX_MEASUREMENT_LEVELS && styles.disabledAction,
						]}
						leftChild={<IconPlus color={colors.blue2} width={18} height={18} />}
						centerChild={<ThemedText tx="measurements.addLevel" variant="H2" colorName="blue2" />}
					/>
				</View>

				<ThemedView
					colorName="blue2"
					variant="wide"
					onPress={form.handleSaveMeasurement}
					disabled={form.isSubmitting || form.isLoadingConfig}
					style={styles.saveButton}
					centerChild={<ThemedText tx="measurements.save" variant="H1" colorName="bg_0" />}
				/>

				<ThemedView onPress={form.handleOnDelete} variant="narrow" style={styles.deleteButton}>
					<View style={styles.deleteContent}>
						<IconTrash color={colors.false} width={26} height={26} />
						<ThemedText tx="measurements.delete" variant="H1" colorName="false" />
					</View>
				</ThemedView>
			</ThemedView>
			<DatePickerModal
				visible={form.isDateModalVisible}
				onClose={() => form.setIsDateModalVisible(false)}
				onSave={(selectedDate) => {
					form.handleDateSave(selectedDate)
					form.setIsDateModalVisible(false)
				}}
				initialDate={form.measurementDate}
			/>

			<HourPickerModal
				visible={form.isHourModalVisible}
				onClose={() => form.setIsHourModalVisible(false)}
				onSave={(hour, minute) => {
					form.handleHourSave(hour, minute)
					form.setIsHourModalVisible(false)
				}}
				initialHour={form.measurementTime.hour}
				initialMinute={form.measurementTime.minute}
			/>
			<ThemedDialog
				visible={form.distanceDialogTarget !== null}
				title={form.distanceDialogTitle}
				errorMessage={form.distanceDialogErrorMessage}
				variant="float"
				initialValue={form.distanceDialogInitialValue}
				validate={form.validateDistance}
				onSave={form.handleDistanceSave}
				onCancel={() => form.setDistanceDialogTarget(null)}
			/>
		</ScrollView>
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
	addLevelButton: {
		borderStyle: "dashed",
		borderWidth: 1.5,
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
