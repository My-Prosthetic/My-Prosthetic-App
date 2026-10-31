import type { DateFormat, Language } from "@/context/SettingsContext"

export const LANGUAGE_OPTIONS: {
	value: Language
	label: string
}[] = [
	{ value: "pl", label: "Polski" },
	{ value: "en", label: "English" },
]

export const DATE_FORMAT_OPTIONS: {
	value: DateFormat
	label: string
}[] = [
	{ value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
	{ value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
	{ value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
]
