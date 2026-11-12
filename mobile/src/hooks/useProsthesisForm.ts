import { useEffect, useState } from "react"
import { Alert } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import {
	createProsthesis,
	deleteProsthesis,
	getProsthesisById,
	updateProsthesis,
} from "@/db/repositories/prosthesisRepository"
import type { AmputationLevel } from "@/src/components/prosthesis/AmputationLevelSelector"

export type FormMode = "Create" | "Edit"
type Side = "left" | "right"
type Limb = "upper" | "lower"
type FormValues = {
	name: string
	side: Side
	limb: Limb
	amputationLevel: AmputationLevel | null
	startedAt: string | null
	replacementDate: string | null
	description: string
}
type DateField = "start" | "replacement"
type LoadState = "loading" | "ready" | "notFound" | "error"

const formatDateForStorage = (date: Date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")

	return `${year}-${month}-${day}`
}

const parseStoredDate = (value: string | null | undefined) => {
	if (!value) return null

	const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	const parsed = dateOnly
		? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
		: new Date(value)

	return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function useProsthesisForm(formMode: FormMode, prosthesisId?: string) {
	const router = useRouter()
	const { t } = useTranslation()
	const isEditing = formMode === "Edit"
	const [loadState, setLoadState] = useState<LoadState>(isEditing ? "loading" : "ready")
	const [loadAttempt, setLoadAttempt] = useState(0)
	const [initialFormValues, setInitialFormValues] = useState<FormValues | null>(null)

	const [name, setName] = useState("")
	const [side, setSide] = useState<Side>("left")
	const [limb, setLimb] = useState<Limb>("lower")
	const [amputationLevel, setAmputationLevel] = useState<AmputationLevel | null>(null)
	const [startOfUsageDate, setStartOfUsageDate] = useState<Date | null>(null)
	const [replacementDate, setReplacementDate] = useState<Date | null>(null)
	const [activeDatePicker, setActiveDatePicker] = useState<DateField | null>(null)
	const [notes, setNotes] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (!isEditing || !prosthesisId) return

		let isMounted = true
		void getProsthesisById(prosthesisId)
			.then((prosthesis) => {
				if (!isMounted) return
				if (!prosthesis) {
					setLoadState("notFound")
					return
				}

				const startedAt = parseStoredDate(prosthesis.startedAt ?? prosthesis.createdAt)
				const replacementDate = parseStoredDate(prosthesis.replacementDate)
				const values: FormValues = {
					name: prosthesis.name,
					side: prosthesis.side,
					limb: prosthesis.limbType,
					amputationLevel: prosthesis.amputationLevel as AmputationLevel,
					startedAt: startedAt ? formatDateForStorage(startedAt) : null,
					replacementDate: replacementDate ? formatDateForStorage(replacementDate) : null,
					description: prosthesis.description ?? "",
				}

				setName(values.name)
				setSide(values.side)
				setLimb(values.limb)
				setAmputationLevel(values.amputationLevel)
				setStartOfUsageDate(startedAt)
				setReplacementDate(replacementDate)
				setNotes(values.description)
				setInitialFormValues(values)
				setLoadState("ready")
			})
			.catch((error: unknown) => {
				console.error("Failed to load prosthesis for editing:", error)
				if (isMounted) setLoadState("error")
			})

		return () => {
			isMounted = false
		}
	}, [isEditing, prosthesisId, loadAttempt])

	const currentFormValues: FormValues = {
		name,
		side,
		limb,
		amputationLevel,
		startedAt: startOfUsageDate ? formatDateForStorage(startOfUsageDate) : null,
		replacementDate: replacementDate ? formatDateForStorage(replacementDate) : null,
		description: notes,
	}
	const hasUnsavedChanges =
		isEditing &&
		initialFormValues !== null &&
		JSON.stringify(currentFormValues) !== JSON.stringify(initialFormValues)
	const screenLoadState: LoadState = isEditing && !prosthesisId ? "notFound" : loadState
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

		if (activeDatePicker === "start") setStartOfUsageDate(date)
		else if (activeDatePicker === "replacement") setReplacementDate(date)
	}

	const handleLimbChange = (nextLimb: Limb) => {
		if (nextLimb === limb) return

		setLimb(nextLimb)
		setAmputationLevel(
			nextLimb === initialFormValues?.limb ? initialFormValues.amputationLevel : null
		)
	}

	const validateForm = () => {
		if (!canSave || amputationLevel === null) return false

		if (!isValidDate(startOfUsageDate, false)) {
			Alert.alert(t("common.error"), t("newProsthesis.startDateFutureError"))
			return false
		}

		if (!isValidDate(replacementDate, true)) {
			Alert.alert(t("common.error"), t("newProsthesis.replacementDatePastError"))
			return false
		}

		return true
	}

	const handleCreate = async () => {
		if (!validateForm() || amputationLevel === null) return

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
				params: { prosthesisId: prosthesis.id },
			})
		} catch (error) {
			console.error("Failed to create prosthesis:", error)
			Alert.alert(t("common.error"), t("newProsthesis.saveError"))
		} finally {
			setIsSaving(false)
		}
	}

	const handleEdit = async () => {
		if (!validateForm() || !amputationLevel || !prosthesisId) return

		try {
			setIsSaving(true)
			const prosthesis = await updateProsthesis(prosthesisId, {
				name: name.trim(),
				side,
				limbType: limb,
				amputationLevel,
				description: notes.trim() || null,
				startedAt: startOfUsageDate ? formatDateForStorage(startOfUsageDate) : null,
				replacementDate: replacementDate ? formatDateForStorage(replacementDate) : null,
			})

			if (!prosthesis) throw new Error("Failed to update prosthesis")
			router.back()
		} catch (error) {
			console.error("Failed to update prosthesis:", error)
			Alert.alert(t("common.error"), t("prosthesisDetails.editSaveError"))
		} finally {
			setIsSaving(false)
		}
	}

	const handleSave = isEditing ? handleEdit : handleCreate

	const handleLeave = () => {
		if (!hasUnsavedChanges) {
			router.back()
			return
		}

		Alert.alert(
			t("prosthesisDetails.unsavedChangesTitle"),
			t("prosthesisDetails.unsavedChangesMessage"),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("prosthesisDetails.discardChanges"),
					style: "destructive",
					onPress: () => router.back(),
				},
			]
		)
	}

	const handleDelete = () => {
		if (!prosthesisId || isSaving) return

		Alert.alert(
			t("prosthesisDetails.deleteWarningTitle"),
			t("prosthesisDetails.deleteWarningMessage"),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("prosthesisDetails.continueDelete"),
					style: "destructive",
					onPress: () => {
						Alert.alert(
							t("prosthesisDetails.deleteConfirmTitle"),
							t("prosthesisDetails.deleteConfirmMessage"),
							[
								{ text: t("common.cancel"), style: "cancel" },
								{
									text: t("prosthesisDetails.deleteProsthesis"),
									style: "destructive",
									onPress: async () => {
										try {
											setIsSaving(true)
											const deleted = await deleteProsthesis(prosthesisId)
											if (!deleted) throw new Error("Failed to delete prosthesis")
											router.replace("/(tabs)/(home)/home")
										} catch (error) {
											console.error("Failed to delete prosthesis:", error)
											Alert.alert(t("common.error"), t("prosthesisDetails.deleteError"))
										} finally {
											setIsSaving(false)
										}
									},
								},
							]
						)
					},
				},
			]
		)
	}

	//TODO
	const handleAddFiles = () => {}

	const retryLoad = () => {
		setLoadState("loading")
		setLoadAttempt((attempt) => attempt + 1)
	}

	return {
		formMode,
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
		hasUnsavedChanges,
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
		setStartOfUsageDate,
		setReplacementDate,
		setActiveDatePicker,
		setNotes,
	}
}
