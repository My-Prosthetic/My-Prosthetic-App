import { useCallback, useMemo, useState } from "react"
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native"
import { useFocusEffect, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { useJournalFilters } from "@/context/JournalFilterContext"
import { getJournalEvents, type JournalEvent } from "@/db/repositories/journalRepository"
import { getAllProstheses, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedInput } from "@/src/components/ThemedInput"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import Check from "@/assets/icons/check.svg"
import Left from "@/assets/icons/chevron-left.svg"
import Right from "@/assets/icons/chevron-right.svg"
import EventIcon from "@/assets/icons/incident-event-outline.svg"
import FilterIcon from "@/assets/icons/filter-sliders.svg"
import Pencil from "@/assets/icons/edit-outline-rounded.svg"
import Plus from "@/assets/icons/plus.svg"
import Search from "@/assets/icons/search.svg"

const INCIDENT_TYPE_KEYS = {
	pain: "newIncident.types.pain",
	abrasion: "newIncident.types.abrasion",
	poor_fit: "newIncident.types.poorFit",
	phantom_pain: "newIncident.types.phantomPain",
	mechanical_failure: "newIncident.types.mechanicalFailure",
} as const
const ACTIVITY_TYPE_KEYS = {
	walking: "newIncident.activities.walking",
	running: "newIncident.activities.running",
	sitting: "newIncident.activities.sitting",
	standing: "newIncident.activities.standing",
	sport: "newIncident.activities.sport",
} as const

const keyOf = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const startOfGrid = (month: Date) => {
	const date = new Date(month.getFullYear(), month.getMonth(), 1)
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
	return date
}

export default function JournalScreen() {
	const router = useRouter()
	const { colors, highContrast, colorMode } = useTheme()
	const incidentColorName = highContrast && colorMode === "light" ? "false" : "magenta0"
	const incidentColor = colors[incidentColorName]
	const { width } = useWindowDimensions()
	const { t, i18n } = useTranslation()
	const today = useMemo(() => new Date(), [])
	const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
	const [selectedDay, setSelectedDay] = useState(() => keyOf(today))
	const {
		search,
		setSearch,
		showIncidents,
		setShowIncidents,
		showComponents,
		setShowComponents,
		prosthesisId,
		setProsthesisId,
	} = useJournalFilters()
	const [filterOpen, setFilterOpen] = useState(false)
	const [prostheses, setProstheses] = useState<Prosthesis[]>([])
	const [events, setEvents] = useState<JournalEvent[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(false)
	const start = useMemo(() => startOfGrid(month), [month])
	const end = useMemo(() => {
		const date = new Date(start)
		date.setDate(date.getDate() + 42)
		return date
	}, [start])
	const days = useMemo(
		() =>
			Array.from({ length: 42 }, (_, index) => {
				const date = new Date(start)
				date.setDate(date.getDate() + index)
				return date
			}),
		[start]
	)
	const mapToIncidentType = useCallback(
		(value: string) => {
			const key = INCIDENT_TYPE_KEYS[value as keyof typeof INCIDENT_TYPE_KEYS]
			return key ? t(key) : value
		},
		[t]
	)
	const mapToActivityType = useCallback(
		(value: string) => {
			const key = ACTIVITY_TYPE_KEYS[value as keyof typeof ACTIVITY_TYPE_KEYS]
			return key ? t(key) : value
		},
		[t]
	)
	const searchAliases = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase(i18n.language)
		const matching = (values: string[], mapToType: (value: string) => string) =>
			needle
				? values.filter((value) =>
						mapToType(value).toLocaleLowerCase(i18n.language).includes(needle)
					)
				: []
		return {
			incidentTypeMatches: matching(Object.keys(INCIDENT_TYPE_KEYS), mapToIncidentType),
			activityMatches: matching(Object.keys(ACTIVITY_TYPE_KEYS), mapToActivityType),
		}
	}, [search, i18n.language, mapToIncidentType, mapToActivityType])

	useFocusEffect(
		useCallback(() => {
			let active = true
			setLoading(true)
			setError(false)
			setEvents([])
			void Promise.all([
				getJournalEvents(start, end, {
					search,
					incidents: showIncidents,
					components: showComponents,
					prosthesisId,
					...searchAliases,
				}),
				getAllProstheses(),
			])
				.then(([rows, items]) => {
					if (active) {
						setEvents(rows)
						setProstheses(items)
					}
				})
				.catch((reason: unknown) => {
					console.error("Failed to load journal:", reason)
					if (active) setError(true)
				})
				.finally(() => {
					if (active) setLoading(false)
				})
			return () => {
				active = false
			}
		}, [start, end, search, showIncidents, showComponents, prosthesisId, searchAliases])
	)

	const marks = useMemo(() => {
		const result = new Map<string, { incident: boolean; component: boolean }>()
		for (const event of events) {
			const mark = result.get(event.dateKey) ?? { incident: false, component: false }
			mark[event.kind] = true
			result.set(event.dateKey, mark)
		}
		return result
	}, [events])
	const selectedEvents = events.filter((event) => event.dateKey === selectedDay)
	const title = new Intl.DateTimeFormat(i18n.language, { month: "long" })
		.format(month)
		.toLocaleUpperCase(i18n.language)
	const shiftMonth = (step: number) => {
		const next = new Date(month.getFullYear(), month.getMonth() + step, 1)
		setMonth(next)
		setSelectedDay(keyOf(next))
	}
	const chooseDay = (date: Date) => {
		setSelectedDay(keyOf(date))
		if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear())
			setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
	}
	const detail = (label: string, value: string | null | undefined) =>
		value ? (
			<View key={label} style={styles.detailRow}>
				<ThemedText variant="H4" colorName="blue2" style={styles.detailLabel}>
					{label}
				</ThemedText>
				<ThemedText variant="H5" colorName="blue2" style={styles.detailValue}>
					{value}
				</ThemedText>
			</View>
		) : null

	return (
		<ThemedView colorName="bg_1" style={styles.screen}>
			<ThemedHeader
				tx="journal.title"
				style={styles.header}
				backButtonStyle={styles.headerBackButton}
				onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/(home)/home"))}
			/>
			<ScrollView
				contentContainerStyle={styles.scroll}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<ThemedView
					colorName="bg_0"
					shadow
					style={[styles.filters, { shadowColor: colors.graphite0 }]}
				>
					<View style={styles.searchWrap}>
						<ThemedInput
							variant="search"
							value={search}
							onChangeText={setSearch}
							placeholder={t("journal.search")}
							placeholderTextColor={colors.blue1}
							accessibilityLabel={t("journal.search")}
							viewStyle={styles.searchInput}
							textStyle={styles.searchText}
							autoCorrect={false}
						/>
						<Search color={colors.blue1} width={21} height={21} style={styles.searchIcon} />
					</View>
					<View style={[styles.filterRow, width < 360 && styles.smallFilterRow]}>
						<ThemedView
							onPress={() => setShowIncidents(!showIncidents)}
							style={styles.checkControl}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: showIncidents }}
							accessibilityLabel={t("journal.incidents")}
						>
							<View
								style={[
									styles.checkBox,
									{
										borderColor: incidentColor,
										backgroundColor: showIncidents ? incidentColor : colors.bg_0,
									},
								]}
							>
								{showIncidents && <Check color={colors.bg_0} width={18} height={18} />}
							</View>
							<ThemedText
								tx="journal.incidents"
								variant="H2"
								colorName={incidentColorName}
								style={styles.checkLabel}
							/>
						</ThemedView>
						<ThemedView
							onPress={() => setShowComponents(!showComponents)}
							style={styles.checkControl}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: showComponents }}
							accessibilityLabel={t("journal.components")}
						>
							<View
								style={[
									styles.checkBox,
									{
										borderColor: colors.blue2,
										backgroundColor: showComponents ? colors.blue2 : colors.bg_0,
									},
								]}
							>
								{showComponents && <Check color={colors.bg_0} width={18} height={18} />}
							</View>
							<ThemedText
								tx="journal.components"
								variant="H2"
								colorName="blue2"
								style={styles.checkLabel}
							/>
						</ThemedView>
						<ThemedView
							onPress={() => setFilterOpen(true)}
							style={styles.filterButton}
							accessibilityLabel={t("journal.filter")}
							accessibilityState={{ selected: Boolean(prosthesisId) }}
						>
							<ThemedText tx="journal.filter" variant="H2" colorName="blue1" />
							<FilterIcon color={colors.blue1} width={25} height={25} />
						</ThemedView>
					</View>
				</ThemedView>
				<ThemedView
					colorName="blue2"
					onPress={() => router.push("/(tabs)/(home)/incident/new")}
					style={styles.addButton}
					accessibilityLabel={t("home.addIncident")}
				>
					<EventIcon color={colors.bg_0} width={30} height={30} />
					<ThemedText tx="home.addIncident" variant="H1" colorName="bg_0" style={styles.addText} />
					<Plus color={colors.bg_0} width={20} height={20} />
				</ThemedView>
				<View style={[styles.calendar, width < 360 && styles.smallCalendar]}>
					<View style={styles.monthRow}>
						<ThemedView
							onPress={() => shiftMonth(-1)}
							style={styles.monthArrow}
							accessibilityLabel={t("journal.previousMonth")}
						>
							<Left color={colors.blue2} width={12} height={22} />
						</ThemedView>
						<ThemedText variant="H1" colorName="blue2" style={styles.monthTitle}>
							{title}
						</ThemedText>
						<ThemedView
							onPress={() => shiftMonth(1)}
							style={styles.monthArrow}
							accessibilityLabel={t("journal.nextMonth")}
						>
							<Right color={colors.blue2} width={12} height={22} />
						</ThemedView>
					</View>
					<View style={styles.weekRow}>
						{["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day, index) => (
							<ThemedText key={day} variant="H1" colorName="blue1" style={styles.weekday}>
								{
									[
										t("newIncident.weekdays.mon"),
										t("newIncident.weekdays.tue"),
										t("newIncident.weekdays.wed"),
										t("newIncident.weekdays.thu"),
										t("newIncident.weekdays.fri"),
										t("newIncident.weekdays.sat"),
										t("newIncident.weekdays.sun"),
									][index]
								}
							</ThemedText>
						))}
					</View>
					<View style={styles.days}>
						{days.map((date) => {
							const key = keyOf(date),
								mark = marks.get(key),
								selected = selectedDay === key
							const outside = date.getMonth() !== month.getMonth()
							return (
								<View key={key} style={styles.dayCell}>
									<ThemedView
										onPress={() => chooseDay(date)}
										style={[styles.dayTouch, selected && { backgroundColor: colors.bg_2 }]}
										accessibilityRole="button"
										accessibilityLabel={`${date.toLocaleDateString(i18n.language, { dateStyle: "full" })}${mark?.incident ? `, ${t("journal.incidents")}` : ""}${mark?.component ? `, ${t("journal.components")}` : ""}`}
										accessibilityState={{ selected }}
									>
										<View
											style={[
												styles.dayCircle,
												{
													borderColor: mark?.incident ? incidentColor : colors.blue2,
													borderWidth: mark?.incident || mark?.component ? 2 : 0,
													backgroundColor:
														selected && mark?.incident
															? incidentColor
															: selected && !mark?.incident && !mark?.component
																? colors.bg_2
																: colors.bg_1,
												},
											]}
										>
											<ThemedText
												variant="H3"
												colorName={
													selected && mark?.incident ? "bg_0" : outside ? "blue1" : "blue2"
												}
												style={styles.dayNumber}
											>
												{date.getDate()}
											</ThemedText>
											{mark?.incident && mark.component && (
												<View style={[styles.bothDot, { backgroundColor: colors.blue2 }]} />
											)}
										</View>
									</ThemedView>
								</View>
							)
						})}
					</View>
				</View>
				<ThemedView
					colorName="bg_0"
					shadow
					style={[styles.cards, { shadowColor: colors.graphite0 }]}
				>
					{loading ? (
						<ActivityIndicator color={colors.blue2} />
					) : error ? (
						<ThemedText tx="journal.loadError" variant="H3" colorName="blue2" />
					) : selectedEvents.length === 0 ? (
						<ThemedText tx="journal.emptyDay" variant="H3" colorName="blue2" />
					) : (
						selectedEvents.map((event, index) => (
							<View
								key={`${event.kind}-${event.id}`}
								style={[
									styles.eventCard,
									index < selectedEvents.length - 1 && {
										borderBottomWidth: StyleSheet.hairlineWidth,
										borderBottomColor: colors.bg_2,
									},
								]}
							>
								<View style={styles.eventTitleRow}>
									<ThemedView borderColor={incidentColorName} style={styles.datePill}>
										<ThemedText variant="H1" colorName={incidentColorName}>
											{event.dateKey.split("-").reverse().join(".")}
										</ThemedText>
									</ThemedView>
									<ThemedText variant="H1" colorName="blue2" style={styles.eventTitle}>
										{(event.kind === "incident"
											? mapToIncidentType(event.title)
											: t("journal.componentAssembly", { name: event.title })
										).toLocaleUpperCase(i18n.language)}
									</ThemedText>
								</View>
								{detail(t("journal.time"), event.time)}
								{event.kind === "incident" &&
									detail(t("journal.painScale"), event.intensity ? `${event.intensity}/10` : null)}
								{event.kind === "incident" &&
									detail(
										t("journal.circumstances"),
										event.activity ? mapToActivityType(event.activity) : null
									)}
								{detail(t("journal.prosthesis"), event.prosthesis)}
								{detail(t("journal.component"), event.component)}
								{detail(t("journal.description"), event.description)}
								<ThemedView
									colorName="blue2"
									style={styles.editButton}
									hitSlop={10}
									accessibilityRole="button"
									accessibilityLabel={t("journal.edit")}
									onPress={() =>
										event.kind === "incident"
											? router.push({
													pathname: "/(tabs)/(home)/incident/new",
													params: { incidentId: event.id },
												})
											: router.push({
													pathname: "/(tabs)/(home)/component/[componentId]",
													params: { componentId: event.id },
												})
									}
								>
									<Pencil color={colors.bg_0} width={17} height={17} />
									<ThemedText tx="journal.edit" variant="H5" colorName="bg_0" />
								</ThemedView>
							</View>
						))
					)}
				</ThemedView>
			</ScrollView>
			<Modal
				visible={filterOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setFilterOpen(false)}
			>
				<View style={[styles.modalBackdrop, { backgroundColor: colors.bg_2 }]}>
					<ThemedView colorName="bg_0" style={styles.modalCard}>
						<ThemedText
							tx="journal.prosthesisFilter"
							variant="H2"
							colorName="blue2"
							style={styles.modalTitle}
						/>
						<ScrollView style={styles.modalList}>
							{[{ id: "", name: t("journal.allProstheses") }, ...prostheses].map((item) => (
								<ThemedView
									key={item.id}
									onPress={() => {
										setProsthesisId(item.id || undefined)
										setFilterOpen(false)
									}}
									style={styles.modalOption}
									accessibilityLabel={item.name}
									accessibilityState={{ selected: (prosthesisId ?? "") === item.id }}
								>
									<ThemedText variant="H3" colorName="blue2">
										{item.name}
									</ThemedText>
								</ThemedView>
							))}
						</ScrollView>
						<ThemedView
							onPress={() => setFilterOpen(false)}
							style={styles.modalClose}
							accessibilityLabel={t("common.cancel")}
						>
							<ThemedText tx="common.cancel" variant="H3" colorName="blue2" />
						</ThemedView>
					</ThemedView>
				</View>
			</Modal>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, borderRadius: 0 },
	header: { width: "100%", alignSelf: "stretch" },
	headerBackButton: { minWidth: 44, minHeight: 44 },
	scroll: { paddingBottom: 24 },
	filters: {
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
		paddingHorizontal: "8%",
		paddingTop: 25,
		paddingBottom: 18,
		marginBottom: 22,
	},
	searchWrap: { position: "relative", justifyContent: "center" },
	searchInput: { minHeight: 44, borderRadius: 15 },
	searchText: { paddingLeft: 44 },
	searchIcon: { position: "absolute", left: 15 },
	filterRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 14,
		gap: 4,
	},
	smallFilterRow: { flexWrap: "wrap", justifyContent: "flex-start", columnGap: 10 },
	checkControl: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		flexShrink: 1,
	},
	checkBox: {
		width: 24,
		height: 24,
		borderWidth: 1.5,
		borderRadius: 7,
		alignItems: "center",
		justifyContent: "center",
	},
	checkLabel: { fontSize: 13 },
	filterButton: {
		minHeight: 44,
		minWidth: 69,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: 6,
	},
	addButton: {
		marginHorizontal: "8%",
		minHeight: 50,
		borderRadius: 18,
		paddingHorizontal: 22,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	addText: { flex: 1, fontSize: 14 },
	calendar: { marginHorizontal: "8%", marginTop: 28, marginBottom: 24 },
	smallCalendar: { marginHorizontal: 6 },
	monthRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	monthArrow: { width: 48, height: 44, alignItems: "center" },
	monthTitle: { minWidth: 105, textAlign: "center", fontSize: 14 },
	weekRow: { flexDirection: "row", marginBottom: 8 },
	weekday: { width: "14.2857%", textAlign: "center", fontSize: 12 },
	days: { flexDirection: "row", flexWrap: "wrap" },
	dayCell: { width: "14.2857%", alignItems: "center" },
	dayTouch: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	dayCircle: {
		width: 33,
		height: 33,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
	},
	dayNumber: { fontSize: 15, lineHeight: 20 },
	bothDot: { width: 5, height: 5, borderRadius: 3, position: "absolute", bottom: 1 },
	cards: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		paddingHorizontal: "8%",
		paddingTop: 24,
		paddingBottom: 22,
		minHeight: 115,
	},
	eventCard: { paddingBottom: 20, marginBottom: 14 },
	eventTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 15,
		flexWrap: "wrap",
	},
	datePill: { paddingHorizontal: 10, minHeight: 34, borderRadius: 20, borderWidth: 3 },
	eventTitle: { flexShrink: 1, fontSize: 14 },
	detailRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 12,
		marginBottom: 5,
	},
	detailLabel: { width: "39%" },
	detailValue: { flex: 1 },
	editButton: {
		alignSelf: "flex-end",
		marginTop: 15,
		marginBottom: 10,
		height: 25,
		minWidth: 91,
		borderRadius: 22,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 7,
		paddingHorizontal: 12,
	},
	modalBackdrop: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
	modalCard: { padding: 20, maxHeight: "70%" },
	modalTitle: { marginBottom: 12 },
	modalList: { flexGrow: 0 },
	modalOption: { minHeight: 48, justifyContent: "center" },
	modalClose: { alignSelf: "flex-end", minHeight: 44, minWidth: 64, alignItems: "center" },
})
