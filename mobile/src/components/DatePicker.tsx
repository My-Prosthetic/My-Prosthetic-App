import React, { useMemo, useState } from "react"
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useTheme } from "@/context/ThemeContext"
import i18n from "@/translations/i18n"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import IconChevronLeft from "@/assets/icons/chevron-left.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconX from "@/assets/icons/x.svg"

interface CalendarWeek {
	days: Date[]
}

interface CalendarViewProps {
	month: Date
	selectedDate: Date
	locale: string
	onMonthChange: (month: Date) => void
	onSelect: (date: Date) => void
	onCancel: () => void
	onApply: () => void
}

export interface DatePickerModalProps {
	visible: boolean
	onClose: () => void
	onSave: (selectedDate: Date) => void
	initialDate?: Date
}

function startOfCalendarMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

function shiftCalendarMonth(date: Date, offset: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function shiftCalendarYear(date: Date, offset: number): Date {
	return new Date(date.getFullYear() + offset, date.getMonth(), 1)
}

function getCalendarWeeks(month: Date): CalendarWeek[] {
	const firstDayOfMonth = startOfCalendarMonth(month)
	const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7
	const gridStart = new Date(
		firstDayOfMonth.getFullYear(),
		firstDayOfMonth.getMonth(),
		1 - mondayOffset
	)

	return Array.from({ length: 6 }, (_, weekIndex) => {
		const days = Array.from({ length: 7 }, (_, dayIndex) => {
			const day = new Date(gridStart)
			day.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex)
			return day
		})

		return { days }
	})
}

function isSameCalendarDay(left: Date, right: Date): boolean {
	return (
		left.getFullYear() === right.getFullYear() &&
		left.getMonth() === right.getMonth() &&
		left.getDate() === right.getDate()
	)
}

function CalendarView({
	month,
	selectedDate,
	locale,
	onMonthChange,
	onSelect,
	onCancel,
	onApply,
}: CalendarViewProps) {
	const { colors } = useTheme()
	const weeks = useMemo(() => getCalendarWeeks(month), [month])
	const weekdayLabels = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" })
		return Array.from({ length: 7 }, (_, index) => {
			const monday = new Date(2024, 0, 1)
			monday.setDate(monday.getDate() + index)
			const raw = formatter.format(monday).replace(/\.$/, "")
			return raw.slice(0, 3)
		})
	}, [locale])
	const monthLabel = new Intl.DateTimeFormat(locale, { month: "long" }).format(month)
	const selectedDateLabel = `${String(selectedDate.getDate()).padStart(2, "0")}.${String(
		selectedDate.getMonth() + 1
	).padStart(2, "0")}.${selectedDate.getFullYear()}`

	const renderNavigationButton = (
		icon: "chevron-back" | "chevron-forward",
		onPress: () => void
	) => (
		<Pressable onPress={onPress} style={styles.navigationButton} hitSlop={6}>
			{icon === "chevron-back" ? (
				<IconChevronLeft color={colors.blue2} width={20} height={20} />
			) : (
				<IconChevronRight color={colors.blue2} width={20} height={20} />
			)}
		</Pressable>
	)

	return (
		<ThemedView colorName="bg_1" style={styles.calendarCard}>
			<View style={styles.navigationRow}>
				{renderNavigationButton("chevron-back", () => onMonthChange(shiftCalendarYear(month, -1)))}
				<ThemedText variant="H3" colorName="blue2" style={styles.textDistance}>
					{month.getFullYear()}
				</ThemedText>
				{renderNavigationButton("chevron-forward", () =>
					onMonthChange(shiftCalendarYear(month, 1))
				)}
			</View>

			<View style={styles.navigationRow}>
				{renderNavigationButton("chevron-back", () => onMonthChange(shiftCalendarMonth(month, -1)))}
				<ThemedText variant="H1" colorName="blue2" style={[styles.monthLabel, styles.textDistance]}>
					{monthLabel}
				</ThemedText>
				{renderNavigationButton("chevron-forward", () =>
					onMonthChange(shiftCalendarMonth(month, 1))
				)}
			</View>

			<View style={styles.weekRow}>
				{weekdayLabels.map((label, index) => (
					<View key={`${label}-${index}`} style={styles.dayCell}>
						<ThemedText variant="H1" colorName="blue1" numberOfLines={1}>
							{label}
						</ThemedText>
					</View>
				))}
			</View>

			{weeks.map((week) => (
				<View key={week.days[0].toISOString()} style={styles.weekRow}>
					{week.days.map((day) => {
						const isSelected = isSameCalendarDay(day, selectedDate)
						const isCurrentMonth = day.getMonth() === month.getMonth()

						return (
							<Pressable
								key={day.toISOString()}
								style={[styles.dayCell, !isCurrentMonth && styles.outsideMonth]}
								onPress={() => onSelect(day)}
								accessibilityRole="button"
								accessibilityState={{ selected: isSelected }}
							>
								<View
									style={[
										styles.dayButton,
										isSelected && {
											backgroundColor: colors.blue2,
										},
									]}
								>
									<ThemedText variant="H3" colorName={isSelected ? "bg_0" : "blue2"}>
										{day.getDate()}
									</ThemedText>
								</View>
							</Pressable>
						)
					})}
				</View>
			))}
			<View style={styles.actionsContainer}>
				<ThemedView
					colorName="bg_0"
					style={styles.actionButton}
					borderColor="graphite0"
					onPress={onCancel}
				>
					<View style={styles.cancelButtonContent}>
						<IconX color={colors.graphite0} />
						<ThemedText variant="H3" colorName="graphite0" tx="common.cancel" />
					</View>
				</ThemedView>
				<ThemedView colorName="blue2" style={styles.actionButton} onPress={onApply}>
					<ThemedText
						variant="H2"
						colorName="bg_0"
						tx="common.enterDate"
						txOptions={{ date: selectedDateLabel }}
						numberOfLines={1}
						adjustsFontSizeToFit
					/>
				</ThemedView>
			</View>
		</ThemedView>
	)
}

export function DatePickerModal({ visible, onClose, onSave, initialDate }: DatePickerModalProps) {
	const insets = useSafeAreaInsets()
	const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(
		() => initialDate ?? new Date()
	)
	const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
		startOfCalendarMonth(initialDate ?? new Date())
	)

	const handleOpen = () => {
		const targetDate = initialDate ?? new Date()
		setCalendarSelectedDate(targetDate)
		setCalendarMonth(startOfCalendarMonth(targetDate))
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			navigationBarTranslucent={Platform.OS === "android"}
			onRequestClose={onClose}
			onShow={handleOpen}
		>
			<View
				style={[
					styles.overlay,
					{
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
					},
				]}
			>
				<Pressable style={styles.backdrop} onPress={onClose} />
				<CalendarView
					month={calendarMonth}
					selectedDate={calendarSelectedDate}
					locale={i18n.language}
					onMonthChange={setCalendarMonth}
					onSelect={setCalendarSelectedDate}
					onCancel={onClose}
					onApply={() => {
						onSave(calendarSelectedDate)
						onClose()
					}}
				/>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
		backgroundColor: "rgba(0, 0, 0, 0.4)",
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	calendarCard: {
		width: "100%",
		maxWidth: 360,
		flex: 0,
		alignSelf: "center",
		padding: 16,
		borderRadius: 24,
		gap: 6,
	},
	actionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		gap: 16,
		marginTop: 8,
		paddingVertical: 8,
	},
	actionButton: {
		minHeight: 38,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 14,
		paddingHorizontal: 12,
	},
	cancelButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	navigationRow: {
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	navigationRowYear: {
		justifyContent: "space-between",
	},

	navigationButton: {
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	monthLabel: {
		textTransform: "uppercase",
	},
	textDistance: {
		width: 100,
		textAlign: "center",
	},
	weekRow: {
		width: "100%",
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
	},
	dayCell: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	dayButton: {
		borderRadius: 17.5,
		height: 35,
		width: 35,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	outsideMonth: {
		opacity: 0.4,
	},
})
