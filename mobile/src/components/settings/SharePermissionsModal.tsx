import { useState } from "react"
import { Alert, Modal, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { DatePickerModal } from "@/src/components/DatePicker"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import { formatDate } from "@/src/utils/dateTimeUtils"
import { ShareError } from "@/db/repositories/shares"
import IconCross from "@/assets/icons/x.svg"
import IconPencil from "@/assets/icons/pencil.svg"
import IconTrashcan from "@/assets/icons/trash-bin.svg"

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
	incidents: {
		id: string
		prosthesisId: string
	}[]
	initialPermissions: Permissions
	onClose: () => void
	onSave: (permissions: Permissions) => Promise<void>
	onRevoke?: () => Promise<void>
}

export function SharePermissionsModal({
	specialist,
	prostheses,
	incidents,
	initialPermissions,
	onClose,
	onSave,
	onRevoke,
}: Props) {
	const { t } = useTranslation()
	const { colors } = useTheme()

	const [medicalHistory, setMedicalHistory] = useState(initialPermissions.medical_history)
	const [selectedIds, setSelectedIds] = useState<string[]>([...initialPermissions.prostheses])
	const [isSaving, setIsSaving] = useState(false)
	const [saveError, setSaveError] = useState<
		| "sharePermissions.saveError"
		| "sharePermissions.alreadyExists"
		| "sharePermissions.sessionChanged"
		| "sharePermissions.notFound"
		| "sharePermissions.revokeError"
		| null
	>(null)
	const [dateStep, setDateStep] = useState<"start" | "end" | null>(null)
	const [startDate, setStartDate] = useState(new Date())
	const [endDate, setEndDate] = useState(new Date())
	const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([
		...initialPermissions.incidents,
	])

	async function handleSave() {
		if (isSaving) return

		setIsSaving(true)
		setSaveError(null)

		try {
			await onSave({
				medical_history: medicalHistory,
				prostheses: selectedIds,
				incidents: selectedIncidentIds,
			})
		} catch (error) {
			if (error instanceof ShareError) {
				switch (error.code) {
					case "ALREADY_EXISTS":
						setSaveError("sharePermissions.alreadyExists")
						break
					case "NOT_FOUND":
						setSaveError("sharePermissions.notFound")
						break
					case "SESSION_CHANGED":
						setSaveError("sharePermissions.sessionChanged")
						break
				}
			} else {
				setSaveError("sharePermissions.saveError")
			}

			setIsSaving(false)
			return
		}
		setIsSaving(false)
		onClose()
	}

	async function handleRevoke() {
		if (isSaving || !onRevoke) return

		setIsSaving(true)
		setSaveError(null)

		try {
			await onRevoke()
		} catch (error) {
			if (error instanceof ShareError && error.code === "SESSION_CHANGED") {
				setSaveError("sharePermissions.sessionChanged")
			} else {
				setSaveError("sharePermissions.revokeError")
			}

			setIsSaving(false)
			return
		}

		setIsSaving(false)
		onClose()
	}

	function confirmRevoke() {
		if (isSaving || !onRevoke) return

		Alert.alert(
			t("sharePermissions.revoke"),
			t("sharePermissions.revokeConfirmation", {
				name: specialist.name,
			}),
			[
				{
					text: t("sharePermissions.cancel"),
					style: "cancel",
				},
				{
					text: t("sharePermissions.revoke"),
					style: "destructive",
					onPress: () => {
						void handleRevoke()
					},
				},
			]
		)
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

						{prostheses.length === 0 && (
							<ThemedText colorName="false">{t("sharePermissions.noProstheses")}</ThemedText>
						)}

						{prostheses.map((prosthesis) => {
							const incidentIds = incidents
								.filter((incident) => incident.prosthesisId === prosthesis.id)
								.map((incident) => incident.id)

							const allSelected =
								incidentIds.length > 0 &&
								incidentIds.every((id) => selectedIncidentIds.includes(id))

							return (
								<View key={prosthesis.id} style={styles.prosthesisGroup}>
									<ThemedView variant="divider" colorName="blue0" />
									<ThemedText variant="H5" colorName="blue2">
										{prosthesis.name}
									</ThemedText>

									<View style={styles.optionRow}>
										<ThemedText variant="H5" colorName="blue2" style={styles.optionLabel}>
											{t("sharePermissions.incidents")}
										</ThemedText>

										<View style={styles.checkboxWrapper}>
											<ThemedCheckbox
												checked={allSelected}
												onPress={() => {
													if (isSaving || incidentIds.length === 0) return

													setSelectedIncidentIds((current) =>
														allSelected
															? current.filter((id) => !incidentIds.includes(id))
															: [...new Set([...current, ...incidentIds])]
													)
												}}
											/>
										</View>
									</View>

									<View style={styles.optionRow}>
										<ThemedText variant="H5" colorName="blue2" style={styles.optionLabel}>
											{t("sharePermissions.prosthesisAndComponents")}
										</ThemedText>

										<View style={styles.checkboxWrapper}>
											<ThemedCheckbox
												checked={selectedIds.includes(prosthesis.id)}
												onPress={() => {
													if (isSaving) return

													setSelectedIds((current) =>
														current.includes(prosthesis.id)
															? current.filter((id) => id !== prosthesis.id)
															: [...current, prosthesis.id]
													)
												}}
											/>
										</View>
									</View>
								</View>
							)
						})}
					</ScrollView>

					{saveError && <ThemedText accessibilityRole="alert">{t(saveError)}</ThemedText>}

					<View style={styles.actions}>
						{/* Create: Cancel. Edit: Revoke access. */}
						<ThemedView
							style={[
								styles.button,
								styles.buttonContent,
								{
									borderColor: onRevoke ? colors.false : colors.blue2,
									backgroundColor: onRevoke ? colors.false : colors.bg_0,
								},
							]}
							onPress={() => {
								if (isSaving) return

								if (onRevoke) {
									confirmRevoke()
								} else {
									onClose()
								}
							}}
							accessibilityRole="button"
							accessibilityState={{ disabled: isSaving }}
						>
							{onRevoke ? (
								<IconTrashcan width={22} height={22} color={colors.bg_0} />
							) : (
								<IconCross width={14} height={14} color={colors.blue1} />
							)}

							<ThemedText variant="H5" colorName={onRevoke ? "bg_0" : "graphite0"}>
								{t(onRevoke ? "sharePermissions.revoke" : "sharePermissions.cancel")}
							</ThemedText>
						</ThemedView>

						{/* Save in both modes. */}
						<ThemedView
							style={[
								styles.button,
								styles.buttonContent,
								{
									borderColor: colors.blue2,
									backgroundColor: colors.blue2,
								},
							]}
							onPress={handleSave}
							accessibilityRole="button"
							accessibilityState={{ disabled: isSaving, busy: isSaving }}
						>
							<IconPencil width={14} height={14} color={colors.bg_0} />

							<ThemedText variant="H5" colorName="bg_0">
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
		marginLeft: 20,
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
	prosthesisGroup: {
		gap: 8,
		marginBottom: 12,
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	revokeButton: {
		minHeight: 44,
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderWidth: 1,
		borderRadius: 12,
		padding: 10,
	},
})
