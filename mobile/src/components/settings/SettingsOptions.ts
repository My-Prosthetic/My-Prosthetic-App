import type { DateFormat, Language, FontSize } from "@/context/SettingsContext"

export const LANGUAGE_OPTIONS: {
	value: Language
	labelKey: "display.language.polish" | "display.language.english"
}[] = [
	{ value: "pl", labelKey: "display.language.polish" },
	{ value: "en", labelKey: "display.language.english" },
]

export const DATE_FORMAT_OPTIONS: {
	value: DateFormat
	label: string
}[] = [
	{ value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
	{ value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
	{ value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
]

export const FONT_SIZE_OPTIONS: {
	value: FontSize
	labelKey:
		| "display.fontSize.small"
		| "display.fontSize.medium"
		| "display.fontSize.large"
		| "display.fontSize.extraLarge"
	scale: number
}[] = [
	{ value: "small", labelKey: "display.fontSize.small", scale: 0.9 },
	{ value: "medium", labelKey: "display.fontSize.medium", scale: 1.0 },
	{ value: "large", labelKey: "display.fontSize.large", scale: 1.15 },
	{ value: "extra-large", labelKey: "display.fontSize.extraLarge", scale: 1.3 },
]
