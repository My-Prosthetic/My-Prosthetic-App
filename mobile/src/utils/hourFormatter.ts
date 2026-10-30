export interface FormatHourOptions {
	hour: number
	minute: number
}

export const formatHour = (timeOrDate: Date | FormatHourOptions = new Date()): string => {
	const hour = timeOrDate instanceof Date ? timeOrDate.getHours() : timeOrDate.hour
	const minute = timeOrDate instanceof Date ? timeOrDate.getMinutes() : timeOrDate.minute

	const formattedMinute = String(minute).padStart(2, "0")

	return `${hour}:${formattedMinute}`
}
