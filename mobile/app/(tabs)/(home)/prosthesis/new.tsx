import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"

import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { createProsthesis } from "@/db/repositories/prosthesisRepository"
import { DatePickerModal } from "@/src/components/DatePicker"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { Carousel } from "@/src/components/Carousel"
import { formatDate } from "@/src/utils/date&timeUtils"

import {
	AmputationLevel,
	AmputationLevelSelector,
} from "@/src/components/prosthesis/AmputationLevelSelector"

import { SvgProps } from "react-native-svg"
import { ThemedInput } from "@/src/components/ThemedInput"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"

import IconLeg from "@/assets/icons/leg_logo.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconFile from "@/assets/icons/file.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"

type Side = "left" | "right"
type Limb = "upper" | "lower"

const formatDateForStorage = (date: Date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")

	return `${year}-${month}-${day}`
}

export default function NewProsthesisScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { t } = useTranslation()

	const iconsList = [IconLeg, IconLeg, IconLeg]
	const [name, setName] = useState("")
	const [side, setSide] = useState<Side>("left")
	const [limb, setLimb] = useState<Limb>("lower")

	const [amputationLevel, setAmputationLevel] = useState<AmputationLevel | null>(null)

	const [startOfUsageDate, setStartOfUsageDate] = useState<Date | null>(null)
	const [replacementDate, setReplacementDate] = useState<Date | null>(null)
	const [activeDatePicker, setActiveDatePicker] = useState<"start" | "replacement" | null>(null)

	const [notes, setNotes] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	const canSave = name.trim().length > 0 && amputationLevel !== null && !isSaving

	const isValidDate = (date: Date | null, mustBeFuture: boolean) => {
		if (!date) return true

		const selectedDay = new Date(date)
		selectedDay.setHours(0, 0, 0, 0)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		return mustBeFuture ? selectedDay >= today : selectedDay <= today
	}

	const handleDateSave = (date: Date) => {
		if (activeDatePicker === "start" && !isValidDate(date, false)) {
			Alert.alert(t("common.error"), t("newProsthesis.startDateFutureError"))
			return
		}

		if (activeDatePicker === "replacement" && !isValidDate(date, true)) {
			Alert.alert(t("common.error"), t("newProsthesis.replacementDatePastError"))
			return
		}

		if (activeDatePicker === "start") {
			setStartOfUsageDate(date)
		} else if (activeDatePicker === "replacement") {
			setReplacementDate(date)
		}
	}

	const handleLimbChange = (newLimb: Limb) => {
		setLimb(newLimb)
		setAmputationLevel(null)
	}

	const handleSave = async () => {
		if (!canSave || amputationLevel === null) {
			return
		}

		if (!isValidDate(startOfUsageDate, false)) {
			Alert.alert(t("common.error"), t("newProsthesis.startDateFutureError"))
			return
		}

		if (!isValidDate(replacementDate, true)) {
			Alert.alert(t("common.error"), t("newProsthesis.replacementDatePastError"))
			return
		}

		try {
			setIsSaving(true)

			const prosthesis = await createProsthesis({
				name: name.trim(),
				side,
				limbType: limb,
				amputationLevel,
				description: notes,
				startedAt: startOfUsageDate ? formatDateForStorage(startOfUsageDate) : null,
				replacementDate: replacementDate ? formatDateForStorage(replacementDate) : null,
			})

			router.replace({
				pathname: "/prosthesis/[prosthesisId]",
				params: {
					prosthesisId: prosthesis.id,
				},
			})
		} catch (error) {
			console.error("Failed to create prosthesis:", error)

			Alert.alert(t("common.error"), t("newProsthesis.saveError"))
		} finally {
			setIsSaving(false)
		}
	}

	const renderIconCard = (Icon: React.ComponentType<SvgProps>) => {
		return (
			<ThemedView colorName="blue2" style={styles.prosthesisIconCard}>
				<Icon color={colors.blue0} width={64} />
			</ThemedView>
		)
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
			<ThemedView colorName="bg_1" variant="background" style={styles.content}>
				{/* HEADER */}
				<ThemedHeader tx="newProsthesis.title" />

				{/* IKONA */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.icon"
						variant="H1"
						colorName="blue2"
						style={styles.sectionLabel}
					/>

					<Carousel renderItem={renderIconCard} items={iconsList} chevronScale={0.75} />
				</View>

				{/* NAZWA PROTEZY */}
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

				{/* WYBIERZ KOŃCZYNĘ */}
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
					<View
						style={{
							flexDirection: "column",
							alignItems: "flex-end",
							justifyContent: "flex-start",
							gap: 10,
						}}
					>
						<ThemedSelectiveSwitch
							leftTx="newProsthesis.left"
							rightTx="newProsthesis.right"
							selectLeft={() => setSide("left")}
							selectRight={() => setSide("right")}
						/>
						<ThemedSelectiveSwitch
							leftTx="newProsthesis.upper"
							rightTx="newProsthesis.lower"
							selectLeft={() => handleLimbChange("upper")}
							selectRight={() => handleLimbChange("lower")}
							initialState="right"
						/>
					</View>
				</View>

				{/* POZIOM AMPUTACJI */}
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

				{/* DATA ROZPOCZĘCIAN UŻTYKOWANIA */}
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

				{/* PRZEWIDYWANA DATA WYMIANY */}
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

				{/* OPIS / NOTATKI */}
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
					{/* DODAJ PLIKI */}
					<ThemedView
						colorName="blue0"
						variant="wide"
						onPress={() => {
							// TODO: obsługa dodawania plików
						}}
						leftChild={<IconFile color={colors.graphite0} />}
						centerChild={
							<ThemedText tx="newProsthesis.addFiles" variant="H1" colorName="graphite0" />
						}
						rightChild={<IconPlus color={colors.graphite0} />}
					/>
					{/* TODO display listy dodanych plików */}
				</View>

				<View style={[styles.section, { gap: 16, marginTop: 40 }]}>
					{/* ZAPISZ PROTEZĘ */}
					<ThemedView
						variant="wide"
						colorName={canSave ? "blue2" : "blue1"}
						style={!canSave && styles.saveButtonDisabled}
						onPress={canSave ? handleSave : undefined}
						accessibilityState={{
							disabled: !canSave,
						}}
						centerChild={<ThemedText tx="newProsthesis.save" variant="H1" colorName="bg_0" />}
					/>
					<ThemedView onPress={() => router.back()} style={{ flexDirection: "row", gap: 10 }}>
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
	prosthesisIconCard: {
		width: 145,
		height: 145,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},
	saveButtonDisabled: {
		opacity: 0.65,
	},
})
