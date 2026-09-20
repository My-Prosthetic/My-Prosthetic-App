import { useMemo, useState } from "react"
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"

import type { AddMode, Condition, Medication } from "./types"

const CONDITION_NAME_MAX_LENGTH = 100
const MEDICATION_NAME_MAX_LENGTH = 100
const MEDICATION_USAGE_MAX_LENGTH = 160

const normalizeEntry = (value: string) => value.trim().toLocaleLowerCase()

type MedicalProfileModalProps = {
	mode: AddMode
	conditions: Condition[]
	medications: Medication[]
	onClose: () => void
	onAddCondition: (input: { name: string }) => Promise<void>
	onAddMedication: (input: { name: string; usage: string }) => Promise<void>
}

export function MedicalProfileModal({
	mode,
	conditions,
	medications,
	onClose,
	onAddCondition,
	onAddMedication,
}: MedicalProfileModalProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	const [conditionName, setConditionName] = useState("")
	const [medicationName, setMedicationName] = useState("")
	const [medicationUsage, setMedicationUsage] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	const handleClose = () => {
		setConditionName("")
		setMedicationName("")
		setMedicationUsage("")
		setIsSaving(false)
		onClose()
	}

	const isDuplicate = useMemo(() => {
		if (mode === "condition") {
			const normalizedName = normalizeEntry(conditionName)

			return (
				normalizedName.length > 0 &&
				conditions.some((condition) => normalizeEntry(condition.name) === normalizedName)
			)
		}

		if (mode === "medication") {
			const normalizedName = normalizeEntry(medicationName)
			const normalizedUsage = normalizeEntry(medicationUsage)

			return (
				normalizedName.length > 0 &&
				normalizedUsage.length > 0 &&
				medications.some(
					(medication) =>
						normalizeEntry(medication.name) === normalizedName &&
						normalizeEntry(medication.usage) === normalizedUsage
				)
			)
		}

		return false
	}, [conditionName, conditions, medicationName, medicationUsage, medications, mode])

	const canSave = useMemo(() => {
		if (isDuplicate) {
			return false
		}

		if (mode === "condition") {
			return conditionName.trim().length > 0
		}

		if (mode === "medication") {
			return medicationName.trim().length > 0 && medicationUsage.trim().length > 0
		}

		return false
	}, [conditionName, isDuplicate, medicationName, medicationUsage, mode])

	const handleSave = async () => {
		if (!mode || !canSave || isSaving) {
			return
		}

		try {
			setIsSaving(true)

			if (mode === "condition") {
				await onAddCondition({
					name: conditionName.trim(),
				})
			} else {
				await onAddMedication({
					name: medicationName.trim(),
					usage: medicationUsage.trim(),
				})
			}

			handleClose()
		} catch (error) {
			console.error("Failed to save medical profile entry:", error)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Modal visible={mode !== null} transparent animationType="fade" onRequestClose={handleClose}>
			<Pressable style={styles.modalBackdrop} onPress={handleClose}>
				<View
					pointerEvents="none"
					style={[
						StyleSheet.absoluteFill,
						styles.modalOverlay,
						{ backgroundColor: colors.primary_base },
					]}
				/>

				<Pressable
					style={[styles.modalCard, { backgroundColor: colors.tertiary_base_3 }]}
					onPress={(event) => event.stopPropagation()}
				>
					<ThemedText
						tx={mode === "condition" ? "profile.addConditionTitle" : "profile.addMedicationTitle"}
						variant="subTitle1"
						colorName="primary_base"
						style={styles.modalTitle}
					/>

					{mode === "condition" ? (
						<>
							<TextInput
								value={conditionName}
								onChangeText={setConditionName}
								maxLength={CONDITION_NAME_MAX_LENGTH}
								placeholder={t("profile.conditionNamePlaceholder")}
								placeholderTextColor={colors.secondary_base_0c}
								style={[
									styles.modalInput,
									{
										borderColor: colors.primary_base_3,
										color: colors.primary_base,
									},
								]}
							/>

							{isDuplicate && (
								<ThemedText
									tx="profile.duplicateCondition"
									variant="subTitle2"
									colorName="secondary_base_0c"
									style={styles.validationMessage}
								/>
							)}
						</>
					) : (
						<>
							<TextInput
								value={medicationName}
								onChangeText={setMedicationName}
								maxLength={MEDICATION_NAME_MAX_LENGTH}
								placeholder={t("profile.medicationNamePlaceholder")}
								placeholderTextColor={colors.secondary_base_0c}
								style={[
									styles.modalInput,
									{
										borderColor: colors.primary_base_3,
										color: colors.primary_base,
									},
								]}
							/>

							<TextInput
								value={medicationUsage}
								onChangeText={setMedicationUsage}
								maxLength={MEDICATION_USAGE_MAX_LENGTH}
								placeholder={t("profile.medicationUsagePlaceholder")}
								placeholderTextColor={colors.secondary_base_0c}
								style={[
									styles.modalInput,
									{
										borderColor: colors.primary_base_3,
										color: colors.primary_base,
									},
								]}
							/>

							{isDuplicate && (
								<ThemedText
									tx="profile.duplicateMedication"
									variant="subTitle2"
									colorName="secondary_base_0c"
									style={styles.validationMessage}
								/>
							)}
						</>
					)}

					<View style={styles.modalActions}>
						<Pressable
							onPress={handleClose}
							style={[styles.modalButton, { borderColor: colors.primary_base }]}
						>
							<ThemedText tx="profile.cancel" variant="subTitle2" colorName="primary_base" />
						</Pressable>

						<Pressable
							onPress={() => void handleSave()}
							disabled={isSaving || !canSave}
							style={[
								styles.modalButton,
								{ backgroundColor: colors.primary_base },
								(isSaving || !canSave) && styles.disabledButton,
							]}
						>
							<ThemedText
								tx={isSaving ? "profile.saving" : "profile.save"}
								variant="subTitle2"
								colorName="accent_base"
							/>
						</Pressable>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const styles = StyleSheet.create({
	modalBackdrop: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	modalOverlay: {
		opacity: 0.35,
	},
	modalCard: {
		width: "100%",
		borderRadius: 18,
		padding: 18,
	},
	modalTitle: {
		marginBottom: 14,
	},
	modalInput: {
		width: "100%",
		minHeight: 44,
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		marginBottom: 12,
	},
	validationMessage: {
		marginTop: -4,
		marginBottom: 12,
	},
	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 8,
		marginTop: 4,
	},
	modalButton: {
		minHeight: 40,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	disabledButton: {
		opacity: 0.45,
	},
})
