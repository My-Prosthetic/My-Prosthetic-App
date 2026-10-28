import type {
	CreateMeasureLevelInput,
	MeasureWithLevels,
} from "@/db/repositories/measuresRepository"
import type { FormatHourOptions } from "@/src/utils/hourFormatter"

export type MeasurementLevel = Omit<CreateMeasureLevelInput, "value"> & {
	value: string
}

export const INITIAL_MEASUREMENTS: MeasurementLevel[] = [
	{ level: 1, value: "", distance: 15 },
	{ level: 2, value: "", distance: 10 },
	{ level: 3, value: "", distance: 5 },
]

export const MAX_MEASUREMENT_LEVELS = 5

export function formatDateForStorage(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

export function formatTimeForStorage({ hour, minute }: FormatHourOptions): string {
	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function sortAndRenumberLevels(levels: MeasurementLevel[]): MeasurementLevel[] {
	return [...levels]
		.sort((left, right) => right.distance - left.distance)
		.map((item, index) => ({ ...item, level: index + 1 }))
}

export function isValidMeasurementValue(value: string): boolean {
	const normalizedValue = value.trim().replace(",", ".")
	return /^\d+(?:\.\d+)?$/.test(normalizedValue) && Number.isFinite(Number(normalizedValue))
}

export function isValidMeasurementDistance(value: string): boolean {
	return (
		/^\d+$/.test(value.trim()) &&
		Number.isSafeInteger(Number(value)) &&
		Number(value) >= 0 &&
		Number(value) <= 100
	)
}

export function getMeasurementLevelsFromHistory(
	measure: MeasureWithLevels | null
): MeasurementLevel[] {
	if (!measure) return INITIAL_MEASUREMENTS.map((item) => ({ ...item }))

	return measure.levels.map(({ level, distance }) => ({
		level,
		distance,
		value: "",
	}))
}
