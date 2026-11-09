import React from "react"
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import type { SvgProps } from "react-native-svg"

import { useTheme } from "@/context/ThemeContext"
import { DatePickerModal } from "@/src/components/DatePicker"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { Carousel } from "@/src/components/Carousel"
import { formatDate } from "@/src/utils/dateTimeUtils"
import { AmputationLevelSelector } from "@/src/components/prosthesis/AmputationLevelSelector"
import { ThemedInput } from "@/src/components/ThemedInput"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"
import { useProsthesisForm, type FormMode } from "@/src/hooks/useProsthesisForm"

import IconLeg from "@/assets/icons/leg_logo.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconFile from "@/assets/icons/file.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"

export default function ProsthesisFormScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const params = useLocalSearchParams<{ mode?: string; prosthesisId?: string }>()
	const formMode: FormMode = params.mode === "Edit" ? "Edit" : "Create"
	const {
		screenLoadState,
		name,
		side,
		limb,
		amputationLevel,
		startOfUsageDate,
		replacementDate,
		activeDatePicker,
		notes,
		isSaving,
		canSave,
		handleDateSave,
		handleLimbChange,
		handleSave,
		handleLeave,
		handleDelete,
		handleAddFiles,
		retryLoad,
		setName,
		setSide,
		setAmputationLevel,
		setActiveDatePicker,
		setNotes,
	} = useProsthesisForm(formMode, params.prosthesisId)

	const iconsList = [IconLeg, IconLeg, IconLeg]

	if (screenLoadState === "loading") {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ActivityIndicator size="large" color={colors.blue2} />
			</ThemedView>
		)
	}

	if (screenLoadState === "notFound" || screenLoadState === "error") {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ThemedText
					tx={
						screenLoadState === "notFound"
							? "prosthesisDetails.notFound"
							: "prosthesisDetails.loadError"
					}
					variant="H2"
					colorName="blue2"
				/>
				{screenLoadState === "error" && (
					<ThemedView colorName="blue2" onPress={retryLoad} style={styles.retryButton}>
						<ThemedText tx="prosthesisDetails.retry" variant="H2" colorName="bg_0" />
					</ThemedView>
				)}
			</ThemedView>
		)
	}

	const renderIconCard = (Icon: React.ComponentType<SvgProps>) => (
		<ThemedView colorName="blue2" style={styles.prosthesisIconCard}>
			<Icon color={colors.blue0} width={64} />
		</ThemedView>
	)

	return (
		<ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
			<ThemedView colorName="bg_1" variant="background" style={styles.content}>
				<ThemedHeader
					tx={formMode === "Create" ? "newProsthesis.title" : "prosthesisDetails.editProsthesis"}
					onBack={handleLeave}
				/>

				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.icon"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<Carousel renderItem={renderIconCard} items={iconsList} chevronScale={0.75} />
				</View>

				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.name"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<ThemedInput
						variant="regular"
						viewStyle={{ backgroundColor: colors.bg_0 }}
						value={name}
						onChangeText={setName}
						placeholder={t("newProsthesis.namePlaceholder")}
					/>
				</View>

				<View
					style={[
						styles.section,
						{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
					]}
				>
					<ThemedText
						tx="newProsthesis.selectLimb"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<View style={styles.switches}>
						<ThemedSelectiveSwitch
							leftTx="newProsthesis.left"
							rightTx="newProsthesis.right"
							key={`side-${formMode}-${side}`}
							initialState={side === "left" ? "left" : "right"}
							selectLeft={() => setSide("left")}
							selectRight={() => setSide("right")}
						/>
						<ThemedSelectiveSwitch
							leftTx="newProsthesis.upper"
							rightTx="newProsthesis.lower"
							key={`limb-${formMode}-${limb}`}
							initialState={limb === "upper" ? "left" : "right"}
							selectLeft={() => handleLimbChange("upper")}
							selectRight={() => handleLimbChange("lower")}
						/>
					</View>
				</View>

				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.amputationLevel"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<AmputationLevelSelector
						limb={limb}
						value={amputationLevel}
						onChange={setAmputationLevel}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.startOfUsageDate"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<ThemedView
						variant="wide"
						colorName="bg_0"
						borderColor="blue1"
						onPress={() => setActiveDatePicker("start")}
						leftChild={
							<ThemedText variant="H3" colorName="graphite0">
								{startOfUsageDate
									? formatDate(startOfUsageDate, "numeric")
									: t("newProsthesis.datePlaceholder")}
							</ThemedText>
						}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.replacementDate"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<ThemedView
						variant="wide"
						colorName="bg_0"
						borderColor="blue1"
						onPress={() => setActiveDatePicker("replacement")}
						leftChild={
							<ThemedText variant="H3" colorName="graphite0">
								{replacementDate
									? formatDate(replacementDate, "numeric")
									: t("newProsthesis.datePlaceholder")}
							</ThemedText>
						}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.notes"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>
					<ThemedInput
						variant="note"
						value={notes}
						onChangeText={setNotes}
						placeholder={t("newProsthesis.notesPlaceholder")}
					/>
				</View>

				<View style={styles.section}>
					<ThemedView
						colorName="blue0"
						variant="wide"
						onPress={handleAddFiles}
						leftChild={<IconFile color={colors.graphite0} />}
						centerChild={
							<ThemedText tx="newProsthesis.addFiles" variant="H1" colorName="graphite0" />
						}
						rightChild={<IconPlus color={colors.graphite0} />}
					/>
				</View>

				<View style={[styles.section, styles.actions]}>
					<ThemedView
						variant="wide"
						colorName={canSave ? "blue2" : "blue1"}
						style={!canSave && styles.saveButtonDisabled}
						onPress={canSave ? handleSave : undefined}
						accessibilityState={{ disabled: !canSave }}
						centerChild={
							<ThemedText
								tx={formMode === "Create" ? "newProsthesis.save" : "prosthesisDetails.saveChanges"}
								variant="H1"
								colorName="bg_0"
							/>
						}
					/>
					{formMode === "Edit" && (
						<ThemedView
							variant="wide"
							colorName="false"
							onPress={!isSaving ? handleDelete : undefined}
							centerChild={
								<ThemedText tx="prosthesisDetails.deleteProsthesis" variant="H1" colorName="bg_0" />
							}
						/>
					)}
					<ThemedView onPress={handleLeave} style={styles.cancelButton}>
						<IconTrash color={colors.false} />
						<ThemedText tx="common.cancel" variant="H1" colorName="false" />
					</ThemedView>
				</View>

				<DatePickerModal
					visible={activeDatePicker !== null}
					onClose={() => setActiveDatePicker(null)}
					onSave={handleDateSave}
					initialDate={
						activeDatePicker === "start"
							? (startOfUsageDate ?? new Date())
							: (replacementDate ?? new Date())
					}
				/>
			</ThemedView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	retryButton: {
		marginTop: 16,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 16,
	},
	content: {
		paddingBottom: 28,
	},
	section: {
		width: "100%",
		marginTop: 18,
	},
	sectionLabel: {
		marginBottom: 8,
	},
	switches: {
		flexDirection: "column",
		alignItems: "flex-end",
		justifyContent: "flex-start",
		gap: 10,
	},
	prosthesisIconCard: {
		width: 145,
		height: 145,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},
	actions: {
		gap: 16,
		marginTop: 40,
	},
	cancelButton: {
		flexDirection: "row",
		gap: 10,
	},
	saveButtonDisabled: {
		opacity: 0.65,
	},
})
