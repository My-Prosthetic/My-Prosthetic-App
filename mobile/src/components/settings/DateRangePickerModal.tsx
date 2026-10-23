import { useMemo, useRef, useState } from "react"
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

const ITEM_HEIGHT = 48
const DAYS_RANGE = 365

type ActiveDate = "from" | "to"

interface DateOption {
	id: string
	date: Date
}

interface DateRangePickerModalProps {
	visible: boolean
	initialFromDate: Date | null
	initialToDate: Date | null
	onClose: () => void
	onSave: (fromDate: Date, toDate: Date) => void
}

function normalizeDate(value: Date) {
	const date = new Date(value)
	date.setHours(0, 0, 0, 0)
	return date
}

function today() {
	return normalizeDate(new Date())
}

function clampToToday(value: Date) {
	const normalized = normalizeDate(value)
	const currentDay = today()

	return normalized.getTime() > currentDay.getTime() ? currentDay : normalized
}

function defaultFromDate() {
	const date = today()
	date.setDate(date.getDate() - 30)
	return date
}

export function DateRangePickerModal({
	visible,
	initialFromDate,
	initialToDate,
	onClose,
	onSave,
}: DateRangePickerModalProps) {
	const { colors } = useTheme()
	const { i18n } = useTranslation()
	const listRef = useRef<FlatList<DateOption>>(null)

	const locale = i18n.language.startsWith("pl") ? "pl-PL" : "en-US"

	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				weekday: "short",
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			}),
		[locale]
	)

	const dateOptions = useMemo<DateOption[]>(() => {
		const currentDay = today()
		const options: DateOption[] = []

		// Tylko dni, które już wystąpiły: od roku wstecz do dzisiaj.
		for (let offset = -DAYS_RANGE; offset <= 0; offset++) {
			const date = new Date(currentDay)
			date.setDate(currentDay.getDate() + offset)

			options.push({
				id: date.toISOString().slice(0, 10),
				date,
			})
		}

		return options
	}, [])

	const [activeDate, setActiveDate] = useState<ActiveDate>("from")
	const [fromDate, setFromDate] = useState(defaultFromDate)
	const [toDate, setToDate] = useState(today)

	const initializePicker = () => {
		const nextFrom = clampToToday(initialFromDate ?? defaultFromDate())
		const nextTo = clampToToday(initialToDate ?? today())
		const resolvedFrom = nextFrom.getTime() > nextTo.getTime() ? nextTo : nextFrom

		setFromDate(resolvedFrom)
		setToDate(nextTo)
		setActiveDate("from")

		const targetId = resolvedFrom.toISOString().slice(0, 10)
		const targetIndex = dateOptions.findIndex((item) => item.id === targetId)

		requestAnimationFrame(() => {
			if (targetIndex >= 0) {
				listRef.current?.scrollToIndex({
					index: Math.max(0, targetIndex - 3),
					animated: false,
				})
			}
		})
	}

	const selectedDate = activeDate === "from" ? fromDate : toDate

	const handleSelectDate = (date: Date) => {
		const normalized = clampToToday(date)

		if (activeDate === "from") {
			setFromDate(normalized)

			if (normalized.getTime() > toDate.getTime()) {
				setToDate(normalized)
			}
		} else {
			setToDate(normalized)

			if (normalized.getTime() < fromDate.getTime()) {
				setFromDate(normalized)
			}
		}
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onShow={initializePicker}
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<Pressable style={styles.backdrop} onPress={onClose} />

				<View style={[styles.sheet, { backgroundColor: colors.bg_0 }]}>
					<ThemedText
						tx="settings.export.datePickerTitle"
						variant="H0"
						colorName="blue2"
						style={styles.title}
					/>

					<View style={styles.rangeTabs}>
						<ThemedView
							variant="wide"
							colorName={activeDate === "from" ? "blue2" : "bg_1"}
							borderColor="blue1"
							onPress={() => setActiveDate("from")}
							style={styles.rangeTab}
							centerChild={
								<View style={styles.rangeTabContent}>
									<ThemedText
										tx="settings.export.fromDate"
										variant="H5"
										colorName={activeDate === "from" ? "bg_0" : "blue2"}
									/>
									<ThemedText
										variant="H4"
										colorName={activeDate === "from" ? "bg_0" : "blue2"}
										numberOfLines={1}
										adjustsFontSizeToFit
										minimumFontScale={0.78}
										style={styles.rangeTabDate}
									>
										{dateFormatter.format(fromDate)}
									</ThemedText>
								</View>
							}
						/>

						<ThemedView
							variant="wide"
							colorName={activeDate === "to" ? "blue2" : "bg_1"}
							borderColor="blue1"
							onPress={() => setActiveDate("to")}
							style={styles.rangeTab}
							centerChild={
								<View style={styles.rangeTabContent}>
									<ThemedText
										tx="settings.export.toDate"
										variant="H5"
										colorName={activeDate === "to" ? "bg_0" : "blue2"}
									/>
									<ThemedText
										variant="H4"
										colorName={activeDate === "to" ? "bg_0" : "blue2"}
										numberOfLines={1}
										adjustsFontSizeToFit
										minimumFontScale={0.78}
										style={styles.rangeTabDate}
									>
										{dateFormatter.format(toDate)}
									</ThemedText>
								</View>
							}
						/>
					</View>

					<FlatList
						ref={listRef}
						data={dateOptions}
						keyExtractor={(item) => item.id}
						style={styles.list}
						showsVerticalScrollIndicator={false}
						getItemLayout={(_, index) => ({
							length: ITEM_HEIGHT,
							offset: ITEM_HEIGHT * index,
							index,
						})}
						onScrollToIndexFailed={({ index }) => {
							setTimeout(() => {
								listRef.current?.scrollToOffset({
									offset: Math.max(0, index - 3) * ITEM_HEIGHT,
									animated: false,
								})
							}, 50)
						}}
						renderItem={({ item }) => {
							const selected = item.date.toDateString() === selectedDate.toDateString()

							return (
								<Pressable
									onPress={() => handleSelectDate(item.date)}
									style={[styles.dateRow, selected && { backgroundColor: colors.blue0 }]}
									accessibilityRole="button"
								>
									<ThemedText variant={selected ? "H3" : "H4"} colorName="blue2" numberOfLines={1}>
										{dateFormatter.format(item.date)}
									</ThemedText>
								</Pressable>
							)
						}}
					/>

					<View style={styles.actions}>
						<ThemedView
							variant="narrow"
							colorName="blue2"
							onPress={() => onSave(fromDate, toDate)}
							centerChild={<ThemedText tx="common.save" variant="H2" colorName="bg_0" />}
						/>

						<ThemedView
							variant="narrow"
							colorName="bg_1"
							borderColor="blue1"
							onPress={onClose}
							centerChild={<ThemedText tx="common.cancel" variant="H2" colorName="blue2" />}
						/>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.35)",
	},
	backdrop: {
		flex: 1,
	},
	sheet: {
		maxHeight: "76%",
		paddingTop: 22,
		paddingBottom: 28,
		paddingHorizontal: "8%",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},
	title: {
		marginBottom: 18,
		textAlign: "center",
	},
	rangeTabs: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 14,
	},
	rangeTab: {
		flex: 1,
		minHeight: 58,
		borderRadius: 16,
	},
	rangeTabContent: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		gap: 2,
		paddingHorizontal: 6,
	},
	rangeTabDate: {
		width: "100%",
		textAlign: "center",
	},
	list: {
		height: ITEM_HEIGHT * 5,
		marginBottom: 18,
	},
	dateRow: {
		minHeight: ITEM_HEIGHT,
		paddingHorizontal: 14,
		justifyContent: "center",
		borderRadius: 10,
	},
	actions: {
		alignItems: "center",
		gap: 10,
	},
})
