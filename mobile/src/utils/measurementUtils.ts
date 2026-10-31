import type {
	CreateMeasureLevelInput,
	MeasureWithLevels,
} from "@/db/repositories/measuresRepository"

export type MeasurementLevel = Omit<CreateMeasureLevelInput, "value"> & {
	value: string
}

export const INITIAL_MEASUREMENTS: MeasurementLevel[] = [
	{ level: 1, value: "", distance: 15 },
	{ level: 2, value: "", distance: 10 },
	{ level: 3, value: "", distance: 5 },
]

export const MAX_MEASUREMENT_LEVELS = 5

export function sortAndRenumberLevels(levels: MeasurementLevel[]): MeasurementLevel[] {
	return [...levels]
		.sort((left, right) => left.distance - right.distance)
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
