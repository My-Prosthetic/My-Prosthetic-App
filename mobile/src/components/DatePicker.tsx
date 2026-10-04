import React, { useMemo, useRef, useState } from "react"
import {
	FlatList,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useTheme } from "@/context/ThemeContext"
import i18n from "@/translations/i18n"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { formatDate } from "@/src/utils/dateFormatter"

const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 5
const DAYS_RANGE = 365 //TODO aktualnie umożliwia przeglądanie tylko +/- rok

interface DateOption {
	id: string
	label: string
	date: Date
}

interface CalendarWeek {
	weekNumber: number
	days: Date[]
}

interface CalendarViewProps {
	month: Date
	selectedDate: Date
	locale: string
	onMonthChange: (month: Date) => void
	onSelect: (date: Date) => void
}

export interface DatePickerModalProps {
	visible: boolean
	onClose: () => void
	onSave: (selectedDate: Date) => void
	initialDate?: Date
	variant?: "list" | "calendar"
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

		return {
			weekNumber: getIsoWeekNumber(days[0]),
			days,
		}
	})
}

function getIsoWeekNumber(date: Date): number {
	const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const isoDay = utcDate.getUTCDay() || 7
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - isoDay)

	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
	return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

function isSameCalendarDay(left: Date, right: Date): boolean {
	return (
		left.getFullYear() === right.getFullYear() &&
		left.getMonth() === right.getMonth() &&
		left.getDate() === right.getDate()
	)
}

function CalendarView({ month, selectedDate, locale, onMonthChange, onSelect }: CalendarViewProps) {
	const { colors } = useTheme()
	const weeks = useMemo(() => getCalendarWeeks(month), [month])
	const weekdayLabels = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" })
		return Array.from({ length: 7 }, (_, index) => {
			const monday = new Date(2024, 0, 1)
			monday.setDate(monday.getDate() + index)
			return formatter.format(monday)
		})
	}, [locale])
	const monthLabel = new Intl.DateTimeFormat(locale, { month: "long" }).format(month)

	const renderNavigationButton = (
		icon: "chevron-back" | "chevron-forward",
		onPress: () => void
	) => (
		<Pressable onPress={onPress} style={styles.navigationButton} hitSlop={6}>
			<Ionicons name={icon} size={20} color={colors.primary_base} />
		</Pressable>
	)

	return (
		<ThemedView colorName="tertiary_base_3" style={styles.calendarCard}>
			<View style={styles.navigationRow}>
				{renderNavigationButton("chevron-back", () => onMonthChange(shiftCalendarYear(month, -1)))}
				<ThemedText variant="subTitle1" colorName="primary_base">
					{month.getFullYear()}
				</ThemedText>
				{renderNavigationButton("chevron-forward", () =>
					onMonthChange(shiftCalendarYear(month, 1))
				)}
			</View>

			<View style={styles.navigationRow}>
				{renderNavigationButton("chevron-back", () => onMonthChange(shiftCalendarMonth(month, -1)))}
				<ThemedText variant="subTitle1" colorName="primary_base" style={styles.monthLabel}>
					{monthLabel}
				</ThemedText>
				{renderNavigationButton("chevron-forward", () =>
					onMonthChange(shiftCalendarMonth(month, 1))
				)}
			</View>

			<View style={styles.weekRow}>
				<View style={styles.weekNumberCell} />
				{weekdayLabels.map((label, index) => (
					<View key={`${label}-${index}`} style={styles.dayCell}>
						<ThemedText variant="body1Regular" colorName="secondary_base_0c" numberOfLines={1}>
							{label}
						</ThemedText>
					</View>
				))}
			</View>

			{weeks.map((week) => (
				<View key={week.days[0].toISOString()} style={styles.weekRow}>
					<View style={styles.weekNumberCell}>
						<ThemedText variant="body1Regular" colorName="primary_base_2">
							{week.weekNumber}
						</ThemedText>
					</View>
					{week.days.map((day) => {
						const isSelected = isSameCalendarDay(day, selectedDate)
						const isCurrentMonth = day.getMonth() === month.getMonth()

						return (
							<Pressable
								key={day.toISOString()}
								style={[
									styles.dayCell,
									styles.dayButton,
									isSelected && {
										backgroundColor: colors.accent_base,
										borderColor: colors.primary_base,
										borderWidth: 1,
									},
									!isCurrentMonth && styles.outsideMonth,
								]}
								onPress={() => onSelect(day)}
								accessibilityRole="button"
								accessibilityState={{ selected: isSelected }}
							>
								<ThemedText variant="body1Regular" colorName="primary_base">
									{day.getDate()}
								</ThemedText>
							</Pressable>
						)
					})}
				</View>
			))}
		</ThemedView>
	)
}

export function DatePickerModal({
	visible,
	onClose,
	onSave,
	initialDate,
	variant = "list",
}: DatePickerModalProps) {
	const insets = useSafeAreaInsets()
	const { colors } = useTheme()
	const flatListRef = useRef<FlatList<DateOption>>(null)

	const dateOptions = useMemo<DateOption[]>(() => {
		const options: DateOption[] = []
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		for (let offset = -DAYS_RANGE; offset <= DAYS_RANGE; offset++) {
			const date = new Date(today)
			date.setDate(today.getDate() + offset)
			options.push({
				id: date.toDateString(),
				label: formatDate(date, "label", today),
				date,
			})
		}

		return options
	}, [])

	const [selectedId, setSelectedId] = useState<string>(() =>
		initialDate ? initialDate.toDateString() : dateOptions[DAYS_RANGE].id
	)
	const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(
		() => initialDate ?? new Date()
	)
	const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
		startOfCalendarMonth(initialDate ?? new Date())
	)

	const handleOpen = () => {
		const targetDate = initialDate ?? new Date()
		const targetIndex = dateOptions.findIndex((option) => option.id === targetDate.toDateString())
		const safeIndex = targetIndex !== -1 ? targetIndex : DAYS_RANGE

		setSelectedId(dateOptions[safeIndex].id)
		setCalendarSelectedDate(targetDate)
		setCalendarMonth(startOfCalendarMonth(targetDate))

		requestAnimationFrame(() => {
			flatListRef.current?.scrollToIndex({
				index: Math.max(0, safeIndex - 2),
				animated: false,
			})
		})
	}

	const handleSave = () => {
		const selected = dateOptions.find((option) => option.id === selectedId)
		if (selected) onSave(selected.date)
		onClose()
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
					variant === "calendar" && styles.calendarOverlay,
					variant === "calendar" && {
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
					},
				]}
			>
				<Pressable
					style={[styles.backdrop, variant === "calendar" && styles.calendarBackdrop]}
					onPress={onClose}
				/>

				{variant === "calendar" ? (
					<CalendarView
						month={calendarMonth}
						selectedDate={calendarSelectedDate}
						locale={i18n.language}
						onMonthChange={setCalendarMonth}
						onSelect={(date) => {
							setCalendarSelectedDate(date)
							onSave(date)
							onClose()
						}}
					/>
				) : (
					<ThemedView
						colorName="tertiary_base_3"
						style={[
							styles.sheetContainer,
							{
								paddingBottom: insets.bottom + 10,
								paddingHorizontal: 0,
							},
						]}
					>
						<View style={styles.listContainer}>
							<FlatList
								ref={flatListRef}
								data={dateOptions}
								keyExtractor={(item) => item.id}
								showsVerticalScrollIndicator={false}
								getItemLayout={(_, index) => ({
									length: ITEM_HEIGHT,
									offset: ITEM_HEIGHT * index,
									index,
								})}
								initialScrollIndex={DAYS_RANGE - 2}
								renderItem={({ item }) => {
									const isSelected = item.id === selectedId
									return (
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() => setSelectedId(item.id)}
											style={[
												styles.dateRow,
												isSelected && {
													backgroundColor: colors.primary_base_1,
													opacity: 0.5,
												},
											]}
										>
											<ThemedText
												colorName="primary_base"
												variant="title"
												style={[styles.dateText, isSelected && styles.selectedDateText]}
											>
												{item.label}
											</ThemedText>
										</TouchableOpacity>
									)
								}}
							/>
						</View>

						<View style={styles.actionsContainer}>
							<ThemedView
								variant="narrow"
								colorName="primary_base"
								borderColor="accent_base"
								onPress={handleSave}
								shadow
							>
								<ThemedText variant="main1Button" colorName="accent_base" tx="common.save" />
							</ThemedView>
							<ThemedView variant="narrow" colorName="accent_base_1" onPress={onClose} shadow>
								<ThemedText variant="main1Button" colorName="primary_base" tx="common.cancel" />
							</ThemedView>
						</View>
					</ThemedView>
				)}
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.4)",
	},
	backdrop: {
		flex: 1,
	},
	calendarOverlay: {
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	calendarBackdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	sheetContainer: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingTop: 0,
		paddingHorizontal: 20,
		width: "100%",
	},
	listContainer: {
		height: ITEM_HEIGHT * VISIBLE_ITEMS,
	},
	dateRow: {
		height: ITEM_HEIGHT,
		paddingLeft: 30,
		alignItems: "flex-start",
		justifyContent: "center",
	},
	dateText: {
		opacity: 0.8,
		fontSize: 24,
	},
	selectedDateText: {
		opacity: 1,
	},
	actionsContainer: {
		marginTop: 8,
		gap: 10,
		alignItems: "center",
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
	navigationRow: {
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	navigationButton: {
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	monthLabel: {
		textTransform: "capitalize",
	},
	weekRow: {
		width: "100%",
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
	},
	weekNumberCell: {
		width: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	dayCell: {
		minHeight: 36,
		minWidth: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	dayButton: {
		borderRadius: 1000,
	},
	outsideMonth: {
		opacity: 0.4,
	},
})
