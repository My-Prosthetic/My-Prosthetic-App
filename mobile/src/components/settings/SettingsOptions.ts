import type { DateFormat, Language } from "@/context/SettingsContext"

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
