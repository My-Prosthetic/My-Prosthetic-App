import i18n from "@/translations/i18n"
import type { DateFormat } from "@/context/SettingsContext"

export type DateFormatMode =
	| "numeric" // YYYY-MM-DD
	| "label" // Today/dayname monthName YYYY

export interface FormattedDateBadge {
	day: string
	month: string
	accessibilityLabel: string
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

export const formatDate = (
    date: Date,
    mode: DateFormatMode = "numeric",
    referenceDate: Date = new Date(),
    dateFormat: DateFormat = "YYYY-MM-DD"
): string => {
    const locale = i18n.language

    const isToday = date.toDateString() === referenceDate.toDateString()
    const year = date.getFullYear()
    const monthNum = String(date.getMonth() + 1).padStart(2, "0")
    const dayNum = String(date.getDate()).padStart(2, "0")

    let numericDate: string

    switch (dateFormat) {
        case "DD-MM-YYYY":
            numericDate = `${dayNum}-${monthNum}-${year}`
            break

        case "MM-DD-YYYY":
            numericDate = `${monthNum}-${dayNum}-${year}`
            break

        case "YYYY-MM-DD":
        default:
            numericDate = `${year}-${monthNum}-${dayNum}`
            break
    }

    const todayLabel = i18n.t("common.today")

    switch (mode) {
        case "numeric":
            return isToday
                ? `${todayLabel} (${numericDate})`
                : numericDate

        case "label": {
            const formatter = new Intl.DateTimeFormat(locale, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            })

            const formattedLabel = formatter.format(date)

            return isToday
                ? `${todayLabel} (${formattedLabel})`
                : formattedLabel
        }
    }
}