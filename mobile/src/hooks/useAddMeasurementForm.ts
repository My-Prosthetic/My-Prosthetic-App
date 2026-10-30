import { useEffect, useRef, useState } from "react"
import { Alert } from "react-native"
import * as Crypto from "expo-crypto"
import { useRouter } from "expo-router"
import {
	createMeasure,
	getLatestMeasure,
	type CreateMeasureInput,
	type CreateMeasureLevelInput,
} from "@/db/repositories/measuresRepository"
import {
	formatDateForStorage,
	formatTimeForStorage,
	getMeasurementLevelsFromHistory,
	isValidMeasurementDistance,
	isValidMeasurementValue,
	MAX_MEASUREMENT_LEVELS,
	sortAndRenumberLevels,
	type MeasurementLevel,
} from "@/src/utils/measurementUtils"
import type { FormatHourOptions } from "@/src/utils/hourFormatter"
import { useTranslation } from "react-i18next"
import { useProsthesis } from "@/context/SelectedProsthesisContext"

type DistanceDialogTarget = { type: "add" } | { type: "edit"; level: number }

export function useAddMeasurementForm() {
	const router = useRouter()
	const { t } = useTranslation()
	const { selectedProsthesis } = useProsthesis()
	const [side, setSide] = useState<"left" | "right">("left")
	const [limbType, setLimbType] = useState<"upper" | "lower">("lower")
	const [measurementLevels, setMeasurementLevels] = useState<MeasurementLevel[]>(() =>
		getMeasurementLevelsFromHistory(null)
	)
	const [measurementDate, setMeasurementDate] = useState<Date>(() => new Date())
	const [measurementTime, setMeasurementTime] = useState<FormatHourOptions>(() => {
		const now = new Date()
		return { hour: now.getHours(), minute: now.getMinutes() }
	})
	const [isDateModalVisible, setIsDateModalVisible] = useState(false)
	const [isHourModalVisible, setIsHourModalVisible] = useState(false)
	const [distanceDialogTarget, setDistanceDialogTarget] = useState<DistanceDialogTarget | null>(
		null
	)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoadingConfig, setIsLoadingConfig] = useState(true)
	const initializationStartedRef = useRef(false)
	const isInitializedRef = useRef(false)
	const historyRequestIdRef = useRef(0)

	useEffect(() => {
		if (initializationStartedRef.current) return
		initializationStartedRef.current = true

		const initializeFromHistory = async () => {
			try {
				const latestMeasure = await getLatestMeasure()

				if (latestMeasure) {
					setSide(latestMeasure.side)
					setLimbType(latestMeasure.limbType)
				} else if (selectedProsthesis) {
					setSide(selectedProsthesis.side)
					setLimbType(selectedProsthesis.limbType)
				}

				setMeasurementLevels(getMeasurementLevelsFromHistory(latestMeasure))
			} catch (error) {
				console.error("Failed to load latest measurement:", error)

				if (selectedProsthesis) {
					setSide(selectedProsthesis.side)
					setLimbType(selectedProsthesis.limbType)
				} else {
					setSide("left")
					setLimbType("lower")
				}
				setMeasurementLevels(getMeasurementLevelsFromHistory(null))
			} finally {
				isInitializedRef.current = true
				setIsLoadingConfig(false)
			}
		}

		void initializeFromHistory()
	}, [selectedProsthesis])

	const reloadLevelsForSelection = async (
		nextSide: "left" | "right",
		nextLimbType: "upper" | "lower"
	) => {
		const requestId = ++historyRequestIdRef.current
		setIsLoadingConfig(true)

		try {
			const latestMeasure = await getLatestMeasure({
				side: nextSide,
				limbType: nextLimbType,
			})
			if (requestId === historyRequestIdRef.current) {
				setMeasurementLevels(getMeasurementLevelsFromHistory(latestMeasure))
			}
		} catch (error) {
			console.error("Failed to load measurement history for selected limb:", error)
			if (requestId === historyRequestIdRef.current) {
				setMeasurementLevels(getMeasurementLevelsFromHistory(null))
			}
		} finally {
			if (requestId === historyRequestIdRef.current) {
				setIsLoadingConfig(false)
			}
		}
	}

	const handleSideChange = (nextSide: "left" | "right") => {
		setSide(nextSide)
		if (isInitializedRef.current) {
			void reloadLevelsForSelection(nextSide, limbType)
		}
	}

	const handleLimbTypeChange = (nextLimbType: "upper" | "lower") => {
		setLimbType(nextLimbType)
		if (isInitializedRef.current) {
			void reloadLevelsForSelection(side, nextLimbType)
		}
	}

	const isFutureMoment = (date: Date, hour: number, minute: number) => {
		const candidate = new Date(date)
		candidate.setHours(hour, minute, 0, 0)
		return candidate.getTime() > Date.now()
	}

	const validateMoment = (date: Date, hour: number, minute: number) => {
		if (!isFutureMoment(date, hour, minute)) return true

		Alert.alert(t("common.error"), t("measurements.futureMomentError"))
		return false
	}

	const handleDateSave = (date: Date) => {
		if (!validateMoment(date, measurementTime.hour, measurementTime.minute)) return
		setMeasurementDate(date)
	}

	const handleHourSave = (hour: number, minute: number) => {
		if (!validateMoment(measurementDate, hour, minute)) return
		setMeasurementTime({ hour, minute })
	}

	const handleOnAddLevel = () => {
		if (measurementLevels.length >= MAX_MEASUREMENT_LEVELS) return
		setDistanceDialogTarget({ type: "add" })
	}

	const handleDistanceSave = (distanceValue: string) => {
		const distance = Number(distanceValue)
		const target = distanceDialogTarget
		if (!target) return

		setMeasurementLevels((levels) => {
			if (target.type === "add") {
				if (levels.length >= MAX_MEASUREMENT_LEVELS) return levels
				return sortAndRenumberLevels([...levels, { level: 0, value: "", distance }])
			}

			return sortAndRenumberLevels(
				levels.map((item) => (item.level === target.level ? { ...item, distance } : item))
			)
		})
		setDistanceDialogTarget(null)
	}

	const handleMeasurementValueChange = (level: number, input: string) => {
		setMeasurementLevels((levels) =>
			levels.map((item) => (item.level === level ? { ...item, value: input } : item))
		)
	}

	const handleRemoveLevel = (level: number) => {
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

	const handleOpenDistanceDialog = (level: number) => {
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
		isValidMeasurementDistance(value) &&
		!measurementLevels.some(
			(item) =>
				item.level !==
					(distanceDialogTarget?.type === "edit" ? distanceDialogTarget.level : undefined) &&
				item.distance === Number(value)
		)

	const handleSaveMeasurement = async () => {
		if (isSubmitting || isLoadingConfig) return
		if (!validateMoment(measurementDate, measurementTime.hour, measurementTime.minute)) return

		if (measurementLevels.some((item) => !item.value.trim())) {
			Alert.alert(t("common.error"), t("measurements.missingMeasurement"))
			return
		}

		const invalidLevel = measurementLevels.find((item) => !isValidMeasurementValue(item.value))
		if (invalidLevel) {
			Alert.alert(
				t("common.error"),
				t("measurements.invalidMeasurementForLevel", { level: invalidLevel.level })
			)
			return
		}

		const levels: CreateMeasureLevelInput[] = measurementLevels.map((item) => ({
			level: item.level,
			distance: item.distance,
			value: Number(item.value.trim().replace(",", ".")),
		}))
		const input: CreateMeasureInput = {
			id: Crypto.randomUUID(),
			date: formatDateForStorage(measurementDate),
			time: formatTimeForStorage(measurementTime),
			side,
			limbType,
			levels,
		}

		setIsSubmitting(true)
		try {
			await createMeasure(input)
			Alert.alert(t("measurements.saveSuccessTitle"), t("measurements.saveSuccessMessage"), [
				{ onPress: () => router.back() },
			])
		} catch (error) {
			console.error("Failed to save measurement:", error)
			Alert.alert(t("common.error"), t("measurements.saveError"))
		} finally {
			setIsSubmitting(false)
		}
	}

	const distanceDialogErrorMessage = t("measurements.invalidDistance")

	return {
		side,
		limbType,
		measurementLevels,
		measurementDate,
		measurementTime,
		isDateModalVisible,
		isHourModalVisible,
		distanceDialogTarget,
		distanceDialogItem,
		isSubmitting,
		isLoadingConfig,
		distanceDialogInitialValue,
		distanceDialogTitle,
		distanceDialogErrorMessage,
		validateDistance,
		handleSideChange,
		handleLimbTypeChange,
		handleDateSave,
		handleHourSave,
		handleDistanceSave,
		handleMeasurementValueChange,
		handleRemoveLevel,
		handleOnAddLevel,
		handleOpenDistanceDialog,
		handleSaveMeasurement,
		setIsDateModalVisible,
		setIsHourModalVisible,
		setDistanceDialogTarget,
	}
}
