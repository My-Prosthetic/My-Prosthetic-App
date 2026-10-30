import React, { useState } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import { useTheme } from "@/context/ThemeContext"
import { MeasureWithLevels } from "@/db/repositories/measuresRepository"

import IconRuler from "@/assets/icons/measure-filled.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconChevronLeft from "@/assets/icons/chevron-left.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import { useRouter } from "expo-router"

/* ────────────────────────────────────────────────────────────────────────────
 * types & constants   (→ później np. measureHistory.constants.ts)
 * ──────────────────────────────────────────────────────────────────────────── */

type Side = MeasureWithLevels["side"] // "left" | "right"
type LimbType = MeasureWithLevels["limbType"] // "upper" | "lower"

const LEVELS = [1, 2, 3, 4, 5] as const
type Level = (typeof LEVELS)[number]

const INITIAL_SELECTED_LEVELS: Record<Level, boolean> = {
	1: true,
	2: true,
	3: true,
	4: false,
	5: false,
}

const PAGE_SIZE = 10

/* ────────────────────────────────────────────────────────────────────────────
 * mock   (→ do usunięcia, zastąpi go repozytorium)
 * ──────────────────────────────────────────────────────────────────────────── */

//TODO MOCK
const mockMeasure = (
	id: string,
	date: string,
	time: string,
	values: number[],
	side: Side,
	limbType: LimbType
): MeasureWithLevels => ({
	id,
	date,
	time,
	side,
	limbType,
	isDirty: false,
	deletedAt: null,
	updatedAt: "2026-10-04T10:00:00.000Z",
	levels: values.map((value, i) => ({
		measureId: id,
		level: i + 1,
		distance: (i + 1) * 10,
		value,
	})),
})

//TODO MOCK
const MOCK_MEASUREMENTS: MeasureWithLevels[] = [
	mockMeasure("ll-1", "04.10.2026", "10:00", [40.5, 38.2, 42.1, 35.0, 28.4], "left", "lower"),
	mockMeasure("ll-2", "03.10.2026", "12:40", [39.8, 37.9, 41.5, 34.8, 27.9], "left", "lower"),
	mockMeasure("ll-3", "02.10.2026", "18:45", [41.1, 38.6, 42.8, 35.6, 28.8], "left", "lower"),
	mockMeasure("ll-4", "01.10.2026", "09:10", [40.2, 38.0, 41.9, 35.1, 28.1], "left", "lower"),
	mockMeasure("ll-5", "30.09.2026", "11:30", [39.5, 37.4, 41.2, 34.6, 27.5], "left", "lower"),
	mockMeasure("ll-6", "29.09.2026", "08:15", [40.0, 37.8, 41.6, 34.9, 28.0], "left", "lower"),
	mockMeasure("ll-7", "28.09.2026", "17:20", [39.2, 37.1, 40.9, 34.2, 27.3], "left", "lower"),
	mockMeasure("ll-8", "27.09.2026", "14:05", [39.9, 37.6, 41.4, 34.7, 27.8], "left", "lower"),
	mockMeasure("ll-9", "04.10.2026", "10:00", [40.5, 38.2, 42.1, 35.0, 28.4], "left", "lower"),
	mockMeasure("ll-10", "03.10.2026", "12:40", [39.8, 37.9, 41.5, 34.8, 27.9], "left", "lower"),
	mockMeasure("ll-11", "02.10.2026", "18:45", [41.1, 38.6, 42.8, 35.6, 28.8], "left", "lower"),
	mockMeasure("ll-12", "01.10.2026", "09:10", [40.2, 38.0, 41.9, 35.1, 28.1], "left", "lower"),
	mockMeasure("ll-13", "30.09.2026", "11:30", [39.5, 37.4, 41.2, 34.6, 27.5], "left", "lower"),
	mockMeasure("ll-14", "29.09.2026", "08:15", [40.0, 37.8, 41.6, 34.9, 28.0], "left", "lower"),
	mockMeasure("ll-15", "28.09.2026", "17:20", [39.2, 37.1, 40.9, 34.2, 27.3], "left", "lower"),
	mockMeasure("ll-16", "27.09.2026", "14:05", [39.9, 37.6, 41.4, 34.7, 27.8], "left", "lower"),

	mockMeasure("lu-1", "04.10.2026", "09:30", [30.2, 28.6, 26.4, 24.1, 21.8], "left", "upper"),
	mockMeasure("lu-2", "02.10.2026", "16:10", [30.0, 28.4, 26.1, 23.9, 21.5], "left", "upper"),
	mockMeasure("lu-3", "29.09.2026", "10:45", [30.5, 28.9, 26.7, 24.4, 22.0], "left", "upper"),

	mockMeasure("rl-1", "04.10.2026", "11:15", [41.0, 38.8, 42.5, 35.4, 28.9], "right", "lower"),
	mockMeasure("rl-2", "03.10.2026", "13:20", [40.6, 38.4, 42.0, 35.1, 28.5], "right", "lower"),
	mockMeasure("rl-3", "02.10.2026", "19:00", [41.3, 39.0, 43.0, 35.8, 29.1], "right", "lower"),
	mockMeasure("rl-4", "01.10.2026", "08:40", [40.4, 38.1, 41.8, 35.0, 28.3], "right", "lower"),
	mockMeasure("rl-5", "30.09.2026", "12:10", [40.8, 38.5, 42.3, 35.3, 28.7], "right", "lower"),
	mockMeasure("rl-6", "28.09.2026", "15:50", [40.1, 37.9, 41.7, 34.9, 28.2], "right", "lower"),

	mockMeasure("ru-1", "03.10.2026", "10:20", [31.0, 29.3, 27.0, 24.8, 22.4], "right", "upper"),
	mockMeasure("ru-2", "01.10.2026", "15:35", [30.7, 29.0, 26.8, 24.5, 22.1], "right", "upper"),
	mockMeasure("ru-3", "29.09.2026", "09:05", [31.2, 29.5, 27.2, 25.0, 22.6], "right", "upper"),
	mockMeasure("ru-4", "27.09.2026", "18:30", [30.9, 29.2, 26.9, 24.7, 22.3], "right", "upper"),
]

/* ────────────────────────────────────────────────────────────────────────────
 * helpers   (→ measureHistory.utils.ts)
 * ──────────────────────────────────────────────────────────────────────────── */

//TODO sprawdzę czy takiej funkcji gdzieś już nie mamy w utils
const formatValue = (value?: number) =>
	value === undefined ? "–" : value.toFixed(2).replace(".", ",")

const getLevelValue = (measure: MeasureWithLevels, level: number) =>
	measure.levels.find((l) => l.level === level)?.value

/* ────────────────────────────────────────────────────────────────────────────
 * usePagination   (→ hooks/usePagination.ts)
 *
 * Generyczny, nie zna typu pomiaru. Po podpięciu bazy paginację można
 * przenieść do zapytania (limit/offset + count) i zostawić tylko stan "page".
 * ──────────────────────────────────────────────────────────────────────────── */

function usePagination<T>(items: T[], pageSize: number) {
	const [page, setPage] = useState(1)

	const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
	const currentPage = Math.min(page, totalPages) // zabezpieczenie, gdy lista się skróci
	const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)

	return {
		pageItems,
		currentPage,
		totalPages,
		hasPrev: currentPage > 1,
		hasNext: currentPage < totalPages,
		goPrev: () => setPage(Math.max(1, currentPage - 1)),
		goNext: () => setPage(Math.min(totalPages, currentPage + 1)),
		reset: () => setPage(1),
	}
}

/* ────────────────────────────────────────────────────────────────────────────
 * MeasurementsTable   (→ components/MeasurementsTable.tsx)
 *
 * Tabela jest "głupia": dostaje listę pomiarów, które MA wyświetlić.
 * Filtrowanie po stronie/typie kończyny odbywa się poza nią (ekran → docelowo
 * zapytanie do repozytorium – pod to jest indeks measures_latest_lookup_idx).
 * visibleLevels to wyłącznie parametr prezentacji (które kolumny pokazać).
 * ──────────────────────────────────────────────────────────────────────────── */

type MeasurementsTableProps = {
	measures: MeasureWithLevels[]
	visibleLevels: readonly Level[]
}

function MeasurementsTable({ measures, visibleLevels }: MeasurementsTableProps) {
	const { colors } = useTheme()

	return (
		<>
			<View style={[tableStyles.row, tableStyles.headerRow, { backgroundColor: colors.blue1 }]}>
				<ThemedText variant="H5" colorName="bg_0" style={tableStyles.colData} tx="measurements.history.date"/>
				{visibleLevels.map((level) => (
					<ThemedText key={level} variant="H5" colorName="bg_0" style={tableStyles.colVal}>
						{`L${level}`}
					</ThemedText>
				))}
			</View>

			{measures.map((measure, index) => (
				<View
					key={measure.id}
					style={[
						tableStyles.row,
						{ backgroundColor: index % 2 === 0 ? colors.bg_0 : colors.blue0 },
					]}
				>
					<View style={tableStyles.colData}>
						<ThemedText variant="H5" colorName="blue2" numberOfLines={1}>
							{measure.date}
						</ThemedText>
						<ThemedText variant="H4" colorName="blue2">
							{measure.time}
						</ThemedText>
					</View>
					{visibleLevels.map((level) => (
						<ThemedText key={level} variant="H4" colorName="graphite0" style={tableStyles.colVal}>
							{formatValue(getLevelValue(measure, level))}
						</ThemedText>
					))}
				</View>
			))}
		</>
	)
}

export default function MeasurementHistoryScreen() {
	const { colors } = useTheme()
	const router = useRouter()

	const [side, setSide] = useState<Side>("left")
	const [limbType, setLimbType] = useState<LimbType>("lower")
	const [selectedLevels, setSelectedLevels] = useState(INITIAL_SELECTED_LEVELS)

	//TODO zastąpić zapytaniem do repozytorium, np. useMeasures(side, limbType)
	const measures = MOCK_MEASUREMENTS.filter((m) => m.side === side && m.limbType === limbType)
	const visibleLevels = LEVELS.filter((level) => selectedLevels[level])
	const pagination = usePagination(measures, PAGE_SIZE)

	const toggleLevel = (level: Level) =>
		setSelectedLevels((prev) => ({ ...prev, [level]: !prev[level] }))

	// zmiana filtra = powrót na pierwszą stronę
	const selectSide = (value: Side) => {
		setSide(value)
		pagination.reset()
	}
	const selectLimbType = (value: LimbType) => {
		setLimbType(value)
		pagination.reset()
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<ThemedView colorName="bg_0" variant="background" style={{ paddingBottom: 30 }}>
				<ThemedHeader tx="measurements.history.title" />
				<View style={{ gap: 30, paddingTop: 20 }}>
					{/* Controls */}
					<View style={styles.selectorsSection}>
						<View>
							<ThemedText tx="measurements.selectLimb" variant="H1" colorName="blue2" />
						</View>
						<View style={styles.switchesGroup}>
							<ThemedSelectiveSwitch
								leftTx="newProsthesis.left"
								rightTx="newProsthesis.right"
								selectLeft={() => selectSide("left")}
								selectRight={() => selectSide("right")}
								initialState={side}
								leftLabelWidth={35}
								rightLabelWidth={45}
							/>
							<ThemedSelectiveSwitch
								leftTx="newProsthesis.upper"
								rightTx="newProsthesis.lower"
								selectLeft={() => selectLimbType("upper")}
								selectRight={() => selectLimbType("lower")}
								initialState={limbType === "upper" ? "left" : "right"}
								leftLabelWidth={45}
								rightLabelWidth={45}
							/>
						</View>
					</View>

					<View style={styles.checkboxesContainer}>
						<ThemedText variant="H1" colorName="blue2" numberOfLines={2} tx="measurements.history.points"/>
						<View style={styles.checkboxesList}>
							{LEVELS.map((level) => (
								<ThemedCheckbox
									key={level}
									label={`L${level}`}
									checked={selectedLevels[level]}
									onPress={() => toggleLevel(level)}
								/>
							))}
						</View>
					</View>

					<ThemedView
						colorName="blue2"
						variant="wide"
						onPress={() => router.push("/measure")}
						leftChild={<IconRuler color={colors.bg_0} width={20} height={20} />}
						centerChild={<ThemedText tx="home.addMeasure" variant="H1" colorName="bg_0" />}
						rightChild={<IconPlus color={colors.bg_0} width={20} height={20} />}
					/>
				</View>
			</ThemedView>

			<MeasurementsTable measures={pagination.pageItems} visibleLevels={visibleLevels} />

			<ThemedView colorName="bg_0" variant="background" style={{ paddingBottom: 30 }}>
				{/* Pagination */}
				<View style={styles.paginationRow}>
					<ThemedView
						onPress={pagination.goPrev}
						style={[styles.pageButton, !pagination.hasPrev && styles.pageButtonDisabled]}
					>
						<IconChevronLeft color={colors.blue1} width={20} height={20} />
					</ThemedView>
					<ThemedText variant="H3" colorName="blue2">
						{`${pagination.currentPage}/${pagination.totalPages}`}
					</ThemedText>
					<ThemedView
						onPress={pagination.goNext}
						style={[styles.pageButton, !pagination.hasNext && styles.pageButtonDisabled]}
					>
						<IconChevronRight color={colors.blue1} width={20} height={20} />
					</ThemedView>
				</View>
			</ThemedView>
		</ScrollView>
	)
}

/* ────────────────────────────────────────────────────────────────────────────
 * styles   (tableStyles → razem z MeasurementsTable)
 * ──────────────────────────────────────────────────────────────────────────── */

const tableStyles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingTop: 10,
		paddingBottom: 5,
		paddingHorizontal: "8%",
	},
	headerRow: {
		paddingVertical: 12,
	},
	colData: {
		width: 70,
	},
	colVal: {
		flex: 1,
		textAlign: "center",
	},
})

const styles = StyleSheet.create({
	selectorsSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	switchesGroup: {
		gap: 12,
		alignItems: "flex-end",
	},
	checkboxesContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 10,
	},
	checkboxesList: {
		flexDirection: "row",
		justifyContent: "space-between",
		flex: 1,
	},
	addButton: {
		flexDirection: "row",
		height: 50,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		marginVertical: 6,
	},
	paginationRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 20,
		marginTop: 20,
	},
	pageButton: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	pageButtonDisabled: {
		opacity: 0.3,
	},
})
