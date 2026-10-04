import { useEffect, useState } from "react"
import { Alert, Modal, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { updateProsthesis, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { DatePickerModal } from "@/src/components/DatePicker"
import {
	AmputationLevelSelector,
	type AmputationLevel,
} from "@/src/components/prosthesis/AmputationLevelSelector"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

const PROSTHESIS_NAME_MAX_LENGTH = 50
const PROSTHESIS_DESCRIPTION_MAX_LENGTH = 500

const formatDate = (date: string | null | undefined) => {
	if (!date) return "-"

	const parsedDate = new Date(date)
	return Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString()
}

const formatDateForStorage = (date: Date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

type EditProsthesisModalProps = {
	visible: boolean
	prosthesis: Prosthesis
	onClose: () => void
	onSaved: (prosthesis: Prosthesis) => void
}

export function EditProsthesisModal({
	visible,
	prosthesis,
	onClose,
	onSaved,
}: EditProsthesisModalProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [name, setName] = useState(prosthesis.name)
	const [side, setSide] = useState<"left" | "right">(prosthesis.side)
	const [limbType, setLimbType] = useState<"upper" | "lower">(prosthesis.limbType)
	const [amputationLevel, setAmputationLevel] = useState<AmputationLevel | null>(
		prosthesis.amputationLevel as AmputationLevel
	)
	const [description, setDescription] = useState(prosthesis.description ?? "")
	const [startedAt, setStartedAt] = useState(prosthesis.startedAt ?? prosthesis.createdAt)
	const [datePickerVisible, setDatePickerVisible] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (!visible) return

		setName(prosthesis.name)
		setSide(prosthesis.side)
		setLimbType(prosthesis.limbType)
		setAmputationLevel(prosthesis.amputationLevel as AmputationLevel)
		setDescription(prosthesis.description ?? "")
		setStartedAt(prosthesis.startedAt ?? prosthesis.createdAt)
	}, [visible, prosthesis])

	const canSave = name.trim().length > 0 && amputationLevel !== null && !isSaving

	const handleLimbChange = (nextLimb: "upper" | "lower") => {
		if (nextLimb === limbType) return
		setLimbType(nextLimb)
		setAmputationLevel(null)
	}

	const handleSave = async () => {
		if (!canSave || !amputationLevel) return

		try {
			setIsSaving(true)
			const updated = await updateProsthesis(prosthesis.id, {
				name: name.trim(),
				side,
				limbType,
				amputationLevel,
				description: description.trim() || null,
				startedAt: startedAt || null,
			})

			if (!updated) {
				throw new Error("Failed to update prosthesis")
			}

			onSaved(updated)
			onClose()
		} catch (error) {
			console.error("Failed to update prosthesis:", error)
			Alert.alert(t("common.error"), t("prosthesisDetails.editSaveError"))
		} finally {
			setIsSaving(false)
		}
	}

	const initialDate = (() => {
		const parsed = new Date(startedAt)
		return Number.isNaN(parsed.getTime()) ? new Date() : parsed
	})()

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.modalBackdrop}>
				<View
					pointerEvents="none"
					style={[styles.modalBackdropOverlay, { backgroundColor: colors.primary_base }]}
				/>
				<ThemedView colorName="tertiary_base_1" style={styles.editModal}>
					<View style={styles.modalHeader}>
						<ThemedText variant="title" colorName="primary_base">
							{t("prosthesisDetails.editProsthesis")}
						</ThemedText>
						<ThemedView colorName="tertiary_base_1" onPress={onClose}>
							<Ionicons name="close" size={26} color={colors.primary_base} />
						</ThemedView>
					</View>

					<ScrollView
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={styles.editScroll}
					>
						<EditFieldLabel text={t("newProsthesis.name")} />
						<ThemedView
							colorName="tertiary_base_3"
							borderColor="secondary_base_0c"
							style={styles.editInputBox}
						>
							<TextInput
								value={name}
								onChangeText={setName}
								maxLength={PROSTHESIS_NAME_MAX_LENGTH}
								placeholder={t("newProsthesis.namePlaceholder")}
								placeholderTextColor={colors.secondary_base_0c}
								style={[styles.editInput, { color: colors.primary_base }]}
							/>
						</ThemedView>

						<EditFieldLabel text={t("prosthesisDetails.location")} />
						<View style={styles.editToggleGroup}>
							<EditToggle
								leftLabel={t("newProsthesis.left")}
								rightLabel={t("newProsthesis.right")}
								value={side}
								leftValue="left"
								rightValue="right"
								onChange={setSide}
							/>
							<EditToggle
								leftLabel={t("newProsthesis.upper")}
								rightLabel={t("newProsthesis.lower")}
								value={limbType}
								leftValue="upper"
								rightValue="lower"
								onChange={handleLimbChange}
							/>
						</View>

						<EditFieldLabel text={t("prosthesisDetails.startDate")} />
						<ThemedView
							colorName="tertiary_base_3"
							borderColor="secondary_base_0c"
							style={styles.editInputBox}
							onPress={() => setDatePickerVisible(true)}
						>
							<View style={styles.editDateRow}>
								<ThemedText variant="body1Regular" colorName="primary_base">
									{formatDate(startedAt)}
								</ThemedText>
								<Ionicons name="calendar-outline" size={18} color={colors.primary_base} />
							</View>
						</ThemedView>

						<DatePickerModal
							visible={datePickerVisible}
							onClose={() => setDatePickerVisible(false)}
							onSave={(date) => {
								setStartedAt(formatDateForStorage(date))
								setDatePickerVisible(false)
							}}
							initialDate={initialDate}
						/>

						<EditFieldLabel text={t("newProsthesis.notes")} />
						<ThemedView
							colorName="tertiary_base_3"
							borderColor="secondary_base_0c"
							style={styles.editDescriptionBox}
						>
							<TextInput
								value={description}
								onChangeText={setDescription}
								maxLength={PROSTHESIS_DESCRIPTION_MAX_LENGTH}
								placeholder={t("newProsthesis.notesPlaceholder")}
								placeholderTextColor={colors.secondary_base_0c}
								multiline
								textAlignVertical="top"
								style={[styles.editDescriptionInput, { color: colors.primary_base }]}
							/>
						</ThemedView>

						<EditFieldLabel text={t("newProsthesis.amputationLevel")} />
						<AmputationLevelSelector
							limb={limbType}
							value={amputationLevel}
							onChange={setAmputationLevel}
						/>

						<ThemedView
							colorName={canSave ? "primary_base" : "primary_base_3"}
							style={styles.editSaveButton}
							onPress={canSave ? handleSave : undefined}
							accessibilityRole="button"
							accessibilityState={{ disabled: !canSave }}
						>
							<ThemedText tx="common.save" variant="subTitle2" colorName="accent_base" />
						</ThemedView>
					</ScrollView>
				</ThemedView>
			</View>
		</Modal>
	)
}

function EditFieldLabel({ text }: { text: string }) {
	return (
		<ThemedText variant="subTitle2" colorName="secondary_base_0c" style={styles.editFieldLabel}>
			{text}
		</ThemedText>
	)
}

function EditToggle<T extends string>({
	leftLabel,
	rightLabel,
	value,
	leftValue,
	rightValue,
	onChange,
}: {
	leftLabel: string
	rightLabel: string
	value: T
	leftValue: T
	rightValue: T
	onChange: (value: T) => void
}) {
	return (
		<View style={styles.editToggleRow}>
			<ThemedView
				colorName={value === leftValue ? "primary_base" : "tertiary_base_3"}
				borderColor="secondary_base_0c"
				style={styles.editToggleOption}
				onPress={() => onChange(leftValue)}
			>
				<ThemedText
					variant="body1Regular"
					colorName={value === leftValue ? "accent_base" : "primary_base"}
				>
					{leftLabel}
				</ThemedText>
			</ThemedView>
			<ThemedView
				colorName={value === rightValue ? "primary_base" : "tertiary_base_3"}
				borderColor="secondary_base_0c"
				style={styles.editToggleOption}
				onPress={() => onChange(rightValue)}
			>
				<ThemedText
					variant="body1Regular"
					colorName={value === rightValue ? "accent_base" : "primary_base"}
				>
					{rightLabel}
				</ThemedText>
			</ThemedView>
		</View>
	)
}

const styles = StyleSheet.create({
	modalBackdrop: {
		flex: 1,
		justifyContent: "center",
		padding: 20,
	},
	modalBackdropOverlay: {
		...StyleSheet.absoluteFill,
		opacity: 0.45,
	},
	editModal: {
		maxHeight: "92%",
		borderRadius: 18,
		padding: 18,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	editScroll: {
		paddingBottom: 8,
	},
	editFieldLabel: {
		marginTop: 12,
		marginBottom: 6,
	},
	editInputBox: {
		minHeight: 44,
		borderWidth: 1,
		borderRadius: 12,
		justifyContent: "center",
	},
	editInput: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
	},
	editDateRow: {
		minHeight: 42,
		paddingHorizontal: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	editDescriptionBox: {
		minHeight: 88,
		borderWidth: 1,
		borderRadius: 12,
	},
	editDescriptionInput: {
		minHeight: 88,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
	},
	editToggleGroup: {
		gap: 8,
	},
	editToggleRow: {
		flexDirection: "row",
		gap: 8,
	},
	editToggleOption: {
		flex: 1,
		minHeight: 40,
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	editSaveButton: {
		minHeight: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 18,
	},
})
