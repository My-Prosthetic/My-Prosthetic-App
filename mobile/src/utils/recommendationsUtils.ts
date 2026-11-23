import { formatDate, formatHour, type DateInput } from "@/src/utils/dateTimeUtils"

export function getSpecialistDisplayName(specialist: {
	name: string
	surname?: string | null
}): string {
	const name = specialist.name.trim().replace(/\s+/g, " ")
	const surname = specialist.surname?.trim().replace(/\s+/g, " ")
	if (!surname) return name

	const normalizedName = name.toLocaleLowerCase()
	const normalizedSurname = surname.toLocaleLowerCase()
	if (normalizedName === normalizedSurname || normalizedName.endsWith(` ${normalizedSurname}`)) {
		return name
	}

	return name ? `${name} ${surname}` : surname
}

export function getSpecialistInitials(displayName: string): string {
	const parts = displayName.split(/\s+/).filter(Boolean)
	const first = parts[0]?.charAt(0) ?? ""
	const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : ""
	return (first + last).toUpperCase()
}

function isSameLocalDay(first: Date, second: Date): boolean {
	return first.toDateString() === second.toDateString()
}

function toDate(value: DateInput): Date {
	return value instanceof Date ? value : new Date(value)
}

export function formatMessageDay(
	value: DateInput,
	todayLabel: string,
	yesterdayLabel: string,
	referenceDate: Date = new Date()
): string {
	const date = toDate(value)
	if (Number.isNaN(date.getTime())) return ""
	if (isSameLocalDay(date, referenceDate)) return todayLabel

	const yesterday = new Date(referenceDate)
	yesterday.setDate(yesterday.getDate() - 1)
	return isSameLocalDay(date, yesterday) ? yesterdayLabel : formatDate(date)
}

export function formatLastMessageTime(
	value: DateInput,
	yesterdayLabel: string,
	referenceDate: Date = new Date()
): string {
	const date = toDate(value)
	if (Number.isNaN(date.getTime())) return ""
	if (isSameLocalDay(date, referenceDate)) return formatHour(date)
	return formatMessageDay(date, "", yesterdayLabel, referenceDate)
}
