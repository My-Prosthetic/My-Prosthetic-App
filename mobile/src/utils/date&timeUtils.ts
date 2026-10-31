import i18n from "@/translations/i18n"

export type DateInput = Date | string

export type DateFormatMode =
	| "numeric" // DD-MM-YYYY (+ "(today)")
	| "label" // weekday, day, month, year (+ "(today)")
	| "dotted" // DD.MM.YYYY

export interface FormattedDateBadge {
	day: string
	month: string
	accessibilityLabel: string
}

export interface FormatHourOptions {
	hour: number
	minute: number
}

const pad2 = (value: number) => String(value).padStart(2, "0")

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value))

const toTimeOfDay = (value: DateInput | FormatHourOptions): FormatHourOptions => {
	if (typeof value === "object" && "hour" in value) return value

	const date = toDate(value)
	return { hour: date.getHours(), minute: date.getMinutes() }
}

const markIfToday = (text: string, date: Date, referenceDate: Date) =>
	date.toDateString() === referenceDate.toDateString()
		? `${text} (${i18n.t("common.today")})`
		: text

export const formatHour = (value: DateInput | FormatHourOptions = new Date()): string => {
	const { hour, minute } = toTimeOfDay(value)
	return `${pad2(hour)}:${pad2(minute)}`
}

export const formatDate = (
	value: DateInput,
	mode: DateFormatMode = "numeric",
	referenceDate: Date = new Date()
): string => {
	const date = toDate(value)
	const year = date.getFullYear()
	const month = pad2(date.getMonth() + 1)
	const day = pad2(date.getDate())

	switch (mode) {
		case "dotted":
			return `${day}.${month}.${year}`

		case "numeric":
			return markIfToday(`${day}-${month}-${year}`, date, referenceDate)

		case "label": {
			const label = new Intl.DateTimeFormat(i18n.language, {
				weekday: "short",
				day: "numeric",
				month: "short",
				year: "numeric",
			}).format(date)

			return markIfToday(label, date, referenceDate)
		}
	}
}

export const formatDateBadge = (
	date: Date = new Date(),
	locale: string = "pl"
): FormattedDateBadge => {
	const day = date.toLocaleDateString(locale, { day: "2-digit" })

	const month = date.toLocaleDateString(locale, { month: "short" }).replace(".", "").toUpperCase()

	const accessibilityLabel = date.toLocaleDateString(locale, {
		dateStyle: "full",
	})

	return {
		day,
		month,
		accessibilityLabel,
	}
}

export const combineDateAndTime = (date: Date, { hour, minute }: FormatHourOptions): Date => {
	const result = new Date(date)
	result.setHours(hour, minute, 0, 0)
	return result
}
