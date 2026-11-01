import { useEffect, useMemo, useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import type { ParseKeys } from "i18next"

import IconCheck from "@/assets/icons/check.svg"
import { useTheme } from "@/context/ThemeContext"
import { getAllProstheses, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import {
	buildStructuredExport,
	hasExportableData,
	type ProsthesisExportSelection,
} from "@/db/repositories/exportRepository"
import { DatePickerModal } from "@/src/components/DatePicker"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import {
	downloadExportFile,
	generateExportFile,
	shareExportFile,
	type ExportFileFormat,
	type ExportLabels,
	type GeneratedExportFile,
} from "@/src/services/dataExportService"

type ProsthesisSelection = {
	incidents: boolean
	components: boolean
}

interface RadioOptionProps {
	selected: boolean
	titleTx: ParseKeys
	descriptionTx: ParseKeys
	onPress: () => void
}

function RadioOption({ selected, titleTx, descriptionTx, onPress }: RadioOptionProps) {
	const { colors } = useTheme()

	return (
		<ThemedView
			onPress={onPress}
			style={styles.radioRow}
			accessibilityRole="radio"
			accessibilityState={{ selected }}
		>
			<View
				style={[
					styles.radioOuter,
					{
						borderColor: colors.blue2,
						backgroundColor: colors.bg_0,
					},
				]}
			>
				{selected && <View style={[styles.radioInner, { backgroundColor: colors.blue2 }]} />}
			</View>

			<View style={styles.radioText}>
				<ThemedText tx={titleTx} variant="H3" colorName="blue2" />
				<ThemedText tx={descriptionTx} variant="H4" colorName="blue2" />
			</View>
		</ThemedView>
	)
}

interface CheckRowProps {
	tx: ParseKeys
	checked: boolean
	onPress: () => void
	indented?: boolean
}

function CheckRow({ tx, checked, onPress, indented = false }: CheckRowProps) {
	const { colors } = useTheme()

	return (
		<ThemedView
			onPress={onPress}
			style={[styles.checkRow, indented && styles.checkRowIndented]}
			accessibilityRole="checkbox"
			accessibilityState={{ checked }}
		>
			<ThemedText tx={tx} variant="H2" colorName="blue2" style={styles.checkLabel} />

			<View
				style={[
					styles.checkbox,
					{
						borderColor: colors.blue1,
						backgroundColor: checked ? colors.blue2 : colors.bg_1,
					},
				]}
			>
				{checked && <IconCheck width={22} height={22} color={colors.bg_0} />}
			</View>
		</ThemedView>
	)
}

function startOfDayIso(date: Date) {
	const value = new Date(date)
	value.setHours(0, 0, 0, 0)
	return value.toISOString()
}

function endOfDayIso(date: Date) {
	const value = new Date(date)
	value.setHours(23, 59, 59, 999)
	return value.toISOString()
}

export default function ExportDataScreen() {
	const { colors } = useTheme()
	const { t, i18n } = useTranslation()

	const [format, setFormat] = useState<ExportFileFormat | null>(null)
	const [medicalProfile, setMedicalProfile] = useState(false)
	const [prostheses, setProstheses] = useState<Prosthesis[]>([])
	const [prosthesisSelections, setProsthesisSelections] = useState<
		Record<string, ProsthesisSelection>
	>({})
	const [fromDate, setFromDate] = useState<Date | null>(null)
	const [toDate, setToDate] = useState<Date | null>(null)
	const [activeDate, setActiveDate] = useState<"from" | "to" | null>(null)
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSharing, setIsSharing] = useState(false)
	const [generatedFile, setGeneratedFile] = useState<GeneratedExportFile | null>(null)

	const locale = i18n.language.startsWith("pl") ? "pl-PL" : "en-US"

	const compactDateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				day: "2-digit",
				month: "2-digit",
			}),
		[locale]
	)

	const today = new Date()
	const defaultFromDate = new Date(today)
	defaultFromDate.setDate(defaultFromDate.getDate() - 30)
	const datePickerMaximumDate = activeDate === "from" && toDate && toDate < today ? toDate : today

	useEffect(() => {
		const loadProstheses = async () => {
			try {
				const data = await getAllProstheses()
				setProstheses(data)

				setProsthesisSelections((current) => {
					const next = { ...current }

					for (const prosthesis of data) {
						next[prosthesis.id] ??= {
							incidents: false,
							components: false,
						}
					}

					return next
				})
			} catch (error) {
				console.error("Failed to load prostheses for export:", error)
			}
		}

		void loadProstheses()
	}, [])

	const updateProsthesisSelection = (prosthesisId: string, key: keyof ProsthesisSelection) => {
		setGeneratedFile(null)

		setProsthesisSelections((current) => ({
			...current,
			[prosthesisId]: {
				...(current[prosthesisId] ?? {
					incidents: false,
					components: false,
				}),
				[key]: !(current[prosthesisId]?.[key] ?? false),
			},
		}))
	}

	const hasAnySelection =
		medicalProfile ||
		Object.values(prosthesisSelections).some(
			(selection) => selection.incidents || selection.components
		)

	const labels: ExportLabels = {
		reportTitle: t("settings.export.reportTitle"),
		generatedAt: t("settings.export.generatedAt"),
		dateRange: t("settings.export.dateRange"),
		medicalProfile: t("settings.export.medicalProfile"),
		conditions: t("settings.export.conditions"),
		medications: t("settings.export.medications"),
		prostheses: t("settings.export.prostheses"),
		components: t("settings.export.components"),
		incidents: t("settings.export.incidents"),
		noRows: t("settings.export.noRowsInSection"),
	}

	const handleGenerate = async () => {
		if (!format) {
			Alert.alert(t("settings.export.validationTitle"), t("settings.export.selectFormatMessage"))
			return
		}

		if (!fromDate || !toDate) {
			Alert.alert(t("settings.export.validationTitle"), t("settings.export.selectDateRangeMessage"))
			return
		}

		if (!hasAnySelection) {
			Alert.alert(t("settings.export.validationTitle"), t("settings.export.selectDataTypeMessage"))
			return
		}

		if (fromDate.getTime() > toDate.getTime()) {
			Alert.alert(
				t("settings.export.validationTitle"),
				t("settings.export.invalidDateRangeMessage")
			)
			return
		}

		const today = new Date()
		today.setHours(23, 59, 59, 999)

		if (toDate.getTime() > today.getTime()) {
			Alert.alert(t("settings.export.validationTitle"), t("settings.export.futureDateMessage"))
			return
		}

		const prosthesisSelection: ProsthesisExportSelection[] = prostheses
			.map((prosthesis) => {
				const selection = prosthesisSelections[prosthesis.id] ?? {
					incidents: false,
					components: false,
				}

				return {
					prosthesisId: prosthesis.id,
					includeComponents: selection.components,
					includeIncidents: selection.incidents,
				}
			})
			.filter((selection) => selection.includeComponents || selection.includeIncidents)

		setIsGenerating(true)

		try {
			const structuredExport = await buildStructuredExport({
				fromIso: startOfDayIso(fromDate),
				toIso: endOfDayIso(toDate),
				includeMedicalProfile: medicalProfile,
				prostheses: prosthesisSelection,
			})

			if (!hasExportableData(structuredExport)) {
				Alert.alert(t("settings.export.emptyRangeTitle"), t("settings.export.emptyRangeMessage"))
				return
			}

			const file = await generateExportFile({
				format,
				exportData: structuredExport,
				locale,
				labels,
			})

			setGeneratedFile(file)

			const downloadResult = await downloadExportFile(file)

			if (downloadResult.saved) {
				Alert.alert(
					t("settings.export.downloadSuccessTitle"),
					t("settings.export.downloadSuccessMessage")
				)
			} else if (downloadResult.cancelled) {
				Alert.alert(
					t("settings.export.downloadCancelledTitle"),
					t("settings.export.downloadCancelledMessage")
				)
			}
		} catch (error) {
			console.error("Failed to generate data export:", error)
			Alert.alert(
				t("settings.export.generateErrorTitle"),
				t("settings.export.generateErrorMessage")
			)
		} finally {
			setIsGenerating(false)
		}
	}

	const handleShare = async () => {
		if (!generatedFile || isSharing) {
			return
		}

		setIsSharing(true)

		try {
			const shared = await shareExportFile(generatedFile, {
				dialogTitle: t("settings.export.shareDialogTitle"),
			})

			if (!shared) {
				Alert.alert(
					t("settings.export.shareUnavailableTitle"),
					t("settings.export.shareUnavailableMessage")
				)
			}
		} catch (error) {
			console.error("Failed to share data export:", error)
			Alert.alert(t("settings.export.shareErrorTitle"), t("settings.export.shareErrorMessage"))
		} finally {
			setIsSharing(false)
		}
	}

	return (
		<ThemedView colorName="bg_1" style={styles.screen}>
			<ThemedHeader
				tx="settings.export.title"
				style={[styles.header, { backgroundColor: colors.bg_0 }]}
			/>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View>
					<ThemedText
						tx="settings.export.fileFormat"
						variant="H1"
						colorName="blue2"
						style={styles.sectionTitle}
					/>

					<RadioOption
						selected={format === "pdf"}
						titleTx="settings.export.pdfTitle"
						descriptionTx="settings.export.pdfDescription"
						onPress={() => {
							setFormat("pdf")
							setGeneratedFile(null)
						}}
					/>

					<RadioOption
						selected={format === "json"}
						titleTx="settings.export.jsonTitle"
						descriptionTx="settings.export.jsonDescription"
						onPress={() => {
							setFormat("json")
							setGeneratedFile(null)
						}}
					/>
				</View>

				<View style={styles.rangeSection}>
					<ThemedText
						tx="settings.export.dataRange"
						variant="H1"
						colorName="blue2"
						style={styles.sectionTitle}
					/>

					<ThemedView colorName="bg_0" borderColor="blue1" style={styles.dataCard}>
						<View style={styles.dateRow}>
							<ThemedText tx="settings.export.dateRange" variant="H2" colorName="blue2" />

							<View style={styles.dateButtons}>
								{(["from", "to"] as const).map((field) => {
									const date = field === "from" ? fromDate : toDate
									const label =
										field === "from" ? "settings.export.fromDate" : "settings.export.toDate"
									return (
										<ThemedView
											key={field}
											onPress={() => setActiveDate(field)}
											borderColor="blue1"
											colorName="bg_1"
											style={styles.dateButton}
											accessibilityRole="button"
											accessibilityLabel={t(label)}
										>
											<ThemedText tx={label} variant="H5" colorName="blue2" />
											<ThemedText
												variant="H4"
												colorName="blue2"
												numberOfLines={1}
												adjustsFontSizeToFit
												minimumFontScale={0.8}
												style={styles.dateButtonText}
											>
												{date ? compactDateFormatter.format(date) : "—"}
											</ThemedText>
										</ThemedView>
									)
								})}
							</View>
						</View>

						<CheckRow
							tx="settings.export.medicalProfile"
							checked={medicalProfile}
							onPress={() => {
								setMedicalProfile((value) => !value)
								setGeneratedFile(null)
							}}
						/>

						{prostheses.map((prosthesis) => {
							const selection = prosthesisSelections[prosthesis.id] ?? {
								incidents: false,
								components: false,
							}

							return (
								<View key={prosthesis.id} style={styles.prosthesisBlock}>
									<ThemedText
										tx="settings.export.prosthesisName"
										txOptions={{ name: prosthesis.name }}
										variant="H2"
										colorName="blue2"
										style={styles.prosthesisName}
									/>

									<CheckRow
										tx="settings.export.incidents"
										checked={selection.incidents}
										onPress={() => updateProsthesisSelection(prosthesis.id, "incidents")}
										indented
									/>

									<CheckRow
										tx="settings.export.components"
										checked={selection.components}
										onPress={() => updateProsthesisSelection(prosthesis.id, "components")}
										indented
									/>
								</View>
							)
						})}
					</ThemedView>
				</View>

				<View style={styles.buttonWrapper}>
					<ThemedView
						variant="wide"
						colorName="blue2"
						onPress={handleGenerate}
						disabled={isGenerating}
						style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
						centerChild={
							<ThemedText
								tx={
									isGenerating
										? "settings.export.generating"
										: "settings.export.generateAndDownload"
								}
								variant="H2"
								colorName="bg_0"
								style={styles.generateLabel}
							/>
						}
					/>

					<ThemedView
						variant="wide"
						colorName={generatedFile ? "bg_0" : "bg_2"}
						borderColor="blue1"
						onPress={handleShare}
						disabled={!generatedFile || isSharing}
						style={[styles.shareButton, (!generatedFile || isSharing) && styles.buttonDisabled]}
						centerChild={
							<ThemedText
								tx={isSharing ? "settings.export.sharing" : "settings.export.shareFile"}
								variant="H2"
								colorName="blue2"
								style={styles.generateLabel}
							/>
						}
					/>
				</View>
			</ScrollView>

			<DatePickerModal
				key={activeDate ?? "closed"}
				visible={activeDate !== null}
				initialDate={activeDate === "from" ? (fromDate ?? defaultFromDate) : (toDate ?? today)}
				minimumDate={activeDate === "to" ? (fromDate ?? undefined) : undefined}
				maximumDate={datePickerMaximumDate}
				onClose={() => setActiveDate(null)}
				onSave={(date) => {
					const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
					if (activeDate === "from") setFromDate(selectedDate)
					if (activeDate === "to") setToDate(selectedDate)
					setGeneratedFile(null)
				}}
			/>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		flexDirection: "column",
		alignItems: "stretch",
		justifyContent: "flex-start",
		borderRadius: 0,
	},
	header: {
		minHeight: 92,
		justifyContent: "flex-end",
		paddingBottom: 18,
		borderRadius: 0,
		elevation: 4,
	},
	scroll: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: "8%",
		paddingTop: 30,
		paddingBottom: 20,
	},
	sectionTitle: {
		marginBottom: 16,
	},
	radioRow: {
		width: "100%",
		minHeight: 60,
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		gap: 14,
		borderRadius: 0,
	},
	radioOuter: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	radioInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	radioText: {
		flex: 1,
		gap: 2,
	},
	rangeSection: {
		marginTop: 32,
	},
	dataCard: {
		width: "100%",
		paddingHorizontal: 14,
		paddingVertical: 12,
		flexDirection: "column",
		alignItems: "stretch",
		justifyContent: "flex-start",
		borderRadius: 18,
	},
	dateRow: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: 8,
	},
	dateButtons: {
		flexDirection: "row",
		gap: 6,
	},
	dateButton: {
		width: 82,
		minHeight: 44,
		paddingHorizontal: 4,
		borderRadius: 8,
		flexShrink: 0,
	},
	dateButtonText: {
		width: "100%",
		textAlign: "center",
	},
	checkRow: {
		width: "100%",
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: 0,
	},
	checkRowIndented: {
		paddingLeft: 18,
	},
	checkLabel: {
		flex: 1,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 7,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	prosthesisBlock: {
		marginTop: 2,
	},
	prosthesisName: {
		marginTop: 3,
		marginBottom: 0,
	},
	buttonWrapper: {
		marginTop: "auto",
		paddingTop: 42,
		gap: 12,
	},
	generateButton: {
		width: "100%",
		minHeight: 50,
		borderRadius: 20,
	},
	shareButton: {
		width: "100%",
		minHeight: 50,
		borderRadius: 20,
	},
	buttonDisabled: {
		opacity: 0.55,
	},
	generateLabel: {
		textTransform: "uppercase",
		textAlign: "center",
	},
})
