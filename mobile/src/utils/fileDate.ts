import { formatDate } from "./dateTimeUtils"
import type { DateFormat } from "@/context/SettingsContext"
import i18n from "@/translations/i18n"

export function formatFileDate(value: string | Date, dateFormat: DateFormat): string {
	let date: Date
	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split("-").map(Number)
		date = new Date(year, month - 1, day)
		if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
			return i18n.t("files.unknownDate")
	} else date = value instanceof Date ? value : new Date(value)
	return Number.isNaN(date.getTime())
		? i18n.t("files.unknownDate")
		: formatDate(date, "numeric", new Date(), dateFormat)
}
