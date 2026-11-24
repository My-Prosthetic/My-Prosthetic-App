import { useState } from "react"
import { Modal, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedToggleSwitch } from "@/src/components/ThemedToggleSwitch"
import { DatePickerModal } from "@/src/components/DatePicker"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import { formatDate } from "@/src/utils/dateTimeUtils"

type Permissions = {
	medical_history: boolean
	prostheses: string[]
	incidents: string[]
}

type Props = {
	specialist: {
		id: string
		name: string
	}
	prostheses: {
		id: string
		name: string
	}[]
	initialPermissions: Permissions
	onClose: () => void
	onSave: (permissions: Permissions) => Promise<void>
}

export function SharePermissionsModal({
	specialist,
	prostheses,
	initialPermissions,
	onClose,
	onSave,
}: Props) {
	const { t } = useTranslation()
	const { colors } = useTheme()

	const [medicalHistory, setMedicalHistory] = useState(initialPermissions.medical_history)
	const [selectedIds, setSelectedIds] = useState<string[]>([...initialPermissions.prostheses])
	const [isSaving, setIsSaving] = useState(false)
	const [saveFailed, setSaveFailed] = useState(false)
	const [dateStep, setDateStep] = useState<"start" | "end" | null>(null)
	const [startDate, setStartDate] = useState(new Date())
	const [endDate, setEndDate] = useState(new Date())

	function toggleProsthesis(id: string, enabled: boolean) {
		setSelectedIds((current) =>
			enabled ? [...new Set([...current, id])] : current.filter((selectedId) => selectedId !== id)
		)
	}

	async function handleSave() {
		if (isSaving) return

		setIsSaving(true)
		setSaveFailed(false)

		try {
			await onSave({
				medical_history: medicalHistory,
				prostheses: selectedIds,
				incidents: [],
			})
		} catch {
			setSaveFailed(true)
			setIsSaving(false)
			return
		}

		setIsSaving(false)
		onClose()
	}

	return (
		<Modal
			visible
			transparent
			animationType="fade"
			onRequestClose={() => {
				if (!isSaving) onClose()
			}}
		>
			<View style={styles.overlay}>
				<ThemedView
					colorName="bg_0"
					style={[styles.card, { backgroundColor: colors.bg_0 }]}
					accessibilityViewIsModal
				>
					{/* header */}
					<ThemedText variant="H1" colorName="blue2" style={styles.title}>
						{t("sharePermissions.title")}
					</ThemedText>
					<ThemedView variant="divider" colorName="blue0" />

					{/* prosthethist's data */}
					<ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
						<View style={styles.optionRow}>
							<ThemedText variant="H5" colorName="blue2" tx={"sharePermissions.prosthethistData"} />
							<ThemedText variant="H4" colorName="blue2">
								{specialist.name}
							</ThemedText>
						</View>

						<View style={styles.optionRow}>
							<ThemedText variant="H5" colorName="blue2" style={styles.optionLabel}>
								{t("sharePermissions.timetable")}
							</ThemedText>

							{/* date-range */}
							<ThemedView
								borderColor="blue1"
								style={styles.inputBox}
								onPress={() => {
									if (!isSaving) setDateStep("start")
								}}
							>
								<ThemedText variant="H4" colorName="blue2">
									{formatDate(startDate, "dotted-without-year")}
									{" - "}
									{formatDate(endDate, "dotted-without-year")}
								</ThemedText>
							</ThemedView>
						</View>
						{/* checkbox to allow profile sharing */}
						<View style={styles.optionRow}>
							<ThemedText variant="H5" colorName="blue2" style={styles.optionLabel}>
								{t("sharePermissions.medicalHistory")}
							</ThemedText>
							<View style={styles.checkboxWrapper}>
								<ThemedCheckbox
									checked={medicalHistory}
									onPress={() => {
										if (!isSaving) setMedicalHistory((checked) => !checked)
									}}
								/>
							</View>
						</View>

						<ThemedText variant="H5" colorName="blue2">
							{t("sharePermissions.prostheses")}
						</ThemedText>

						{prostheses.length === 0 && (
							<ThemedText colorName="blue2">{t("sharePermissions.noProstheses")}</ThemedText>
						)}

						{prostheses.map((prosthesis) => (
							<ThemedView key={prosthesis.id} style={styles.optionRow}>
								<ThemedText colorName="blue2" style={styles.optionLabel}>
									{prosthesis.name}
								</ThemedText>

								<View style={styles.toggleArea}>
									<ThemedToggleSwitch
										value={selectedIds.includes(prosthesis.id)}
										onValueChange={(enabled) => {
											if (!isSaving) {
												toggleProsthesis(prosthesis.id, enabled)
											}
										}}
									/>
								</View>
							</ThemedView>
						))}
					</ScrollView>

					{saveFailed && (
						<ThemedText accessibilityRole="alert">{t("sharePermissions.saveError")}</ThemedText>
					)}

					<View style={styles.actions}>
						<ThemedView
							style={[styles.button, { borderColor: colors.blue2 }]}
							onPress={() => {
								if (!isSaving) onClose()
							}}
							accessibilityRole="button"
							accessibilityState={{ disabled: isSaving }}
						>
							<ThemedText colorName="blue2">{t("sharePermissions.cancel")}</ThemedText>
						</ThemedView>

						<ThemedView
							style={[
								styles.button,
								{
									borderColor: colors.blue2,
									backgroundColor: colors.blue2,
								},
							]}
							onPress={handleSave}
							accessibilityRole="button"
							accessibilityState={{
								disabled: isSaving,
								busy: isSaving,
							}}
						>
							<ThemedText colorName="bg_0">
								{isSaving ? t("sharePermissions.saving") : t("sharePermissions.save")}
							</ThemedText>
						</ThemedView>
					</View>
				</ThemedView>
			</View>
			{dateStep !== null && (
				<DatePickerModal
					key={dateStep}
					visible
					closeOnSave={false}
					onClose={() => setDateStep(null)}
					initialDate={dateStep === "start" ? startDate : endDate}
					rangeStartDate={dateStep === "end" ? startDate : undefined}
					onSave={(selectedDate) => {
						if (dateStep === "start") {
							setStartDate(selectedDate)

							if (selectedDate > endDate) {
								setEndDate(selectedDate)
							}

							setDateStep("end")
						} else {
							// Keep the range valid.
							if (selectedDate < startDate) {
								setStartDate(selectedDate)
								setEndDate(startDate)
							} else {
								setEndDate(selectedDate)
							}

							setDateStep(null)
						}
					}}
				/>
			)}
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.45)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	card: {
		width: "100%",
		maxWidth: 440,
		maxHeight: "85%",
		borderRadius: 20,
		padding: 20,
		gap: 16,
	},
	title: {
		textAlign: "center",
	},
	options: {
		flexShrink: 1,
	},
	optionsContent: {
		gap: 12,
	},
	optionRow: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		minHeight: 44,
	},
	optionLabel: {
		flex: 1,
	},
	checkboxWrapper: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 4,
	},
	toggleArea: {
		minWidth: 44,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	actions: {
		flexDirection: "row",
		gap: 12,
	},
	button: {
		flex: 1,
		minHeight: 44,
		borderRadius: 12,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 10,
	},
	inputBox: {
		minHeight: 44,
		borderRadius: 15,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 12,
	},
})
