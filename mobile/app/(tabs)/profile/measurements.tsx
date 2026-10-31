import React, { useCallback, useRef, useState } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { useFocusEffect, useRouter } from "expo-router"

import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import { useTheme } from "@/context/ThemeContext"
import { formatDate, formatHour } from "@/src/utils/date&timeUtils"
import {
	getMeasuresPage,
	type MeasuresPage,
	type MeasuresPageQuery,
	type MeasureWithLevels,
} from "@/db/repositories/measuresRepository"

import IconRuler from "@/assets/icons/measure-filled.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconChevronLeft from "@/assets/icons/chevron-left.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"

type Side = MeasureWithLevels["side"]
type LimbType = MeasureWithLevels["limbType"]

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

const EMPTY_PAGE: MeasuresPage = { items: [], total: 0 }

//TODO przerzucić do utils i zaimplementować w addMeasurement
const formatValue = (value?: number) =>
	value === undefined ? "–" : value.toFixed(2).replace(".", ",")

const getLevelValue = (measure: MeasureWithLevels, level: number) =>
	measure.levels.find((l) => l.level === level)?.value

function useMeasuresPage(query: MeasuresPageQuery) {
	const { side, limbType, page, pageSize } = query

	const [data, setData] = useState<MeasuresPage>(EMPTY_PAGE)
	const [isLoading, setIsLoading] = useState(true)
	const requestIdRef = useRef(0)

	const load = useCallback(async () => {
		const requestId = ++requestIdRef.current
		setIsLoading(true)

		try {
			const result = await getMeasuresPage({ side, limbType, page, pageSize })
			if (requestId === requestIdRef.current) setData(result)
		} catch (error) {
			console.error("Failed to load measures page:", error)
			if (requestId === requestIdRef.current) setData(EMPTY_PAGE)
		} finally {
			if (requestId === requestIdRef.current) setIsLoading(false)
		}
	}, [side, limbType, page, pageSize])

	useFocusEffect(
		useCallback(() => {
			void load()
		}, [load])
	)

	return { ...data, isLoading }
}

function useMeasureHistory(side: Side, limbType: LimbType) {
	const filterKey = `${side}:${limbType}`
	const [pageState, setPageState] = useState({ filterKey, page: 1 })
	const page = pageState.filterKey === filterKey ? pageState.page : 1
	const setPage = (next: number) => setPageState({ filterKey, page: next })

	const { items, total, isLoading } = useMeasuresPage({
		side,
		limbType,
		page,
		pageSize: PAGE_SIZE,
	})
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

	if (!isLoading && page > totalPages) {
		setPageState({ filterKey, page: totalPages })
	}

	return {
		items,
		isLoading,
		currentPage: page,
		totalPages,
		hasPrev: page > 1,
		hasNext: page < totalPages,
		goPrev: () => setPage(Math.max(1, page - 1)),
		goNext: () => setPage(Math.min(totalPages, page + 1)),
	}
}

type MeasurementsTableProps = {
	measures: MeasureWithLevels[]
	visibleLevels: readonly Level[]
	isLoading: boolean
}

function MeasurementsTable({ measures, visibleLevels, isLoading }: MeasurementsTableProps) {
	const { colors } = useTheme()

	return (
		<>
			<View style={[tableStyles.row, tableStyles.headerRow, { backgroundColor: colors.blue1 }]}>
				<ThemedText
					variant="H5"
					colorName="bg_0"
					style={tableStyles.colData}
					tx="measurements.history.date"
				/>
				{visibleLevels.map((level) => (
					<ThemedText key={level} variant="H5" colorName="bg_0" style={tableStyles.colVal}>
						{`L${level}`}
					</ThemedText>
				))}
			</View>

			{!isLoading && measures.length === 0 && (
				<View style={tableStyles.emptyRow}>
					<ThemedText
						variant="body1Regular"
						colorName="graphite0"
						style={tableStyles.emptyText}
						tx="measurements.history.empty"
					/>
				</View>
			)}

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
							{formatDate(measure.measuredAt, "dotted")}
						</ThemedText>
						<ThemedText variant="H4" colorName="blue2">
							{formatHour(measure.measuredAt)}
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

	const history = useMeasureHistory(side, limbType)
	const visibleLevels = LEVELS.filter((level) => selectedLevels[level])

	const toggleLevel = (level: Level) =>
		setSelectedLevels((prev) => ({ ...prev, [level]: !prev[level] }))

	return (
		<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
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
								selectLeft={() => setSide("left")}
								selectRight={() => setSide("right")}
								initialState={side}
								leftLabelWidth={35}
								rightLabelWidth={45}
							/>
							<ThemedSelectiveSwitch
								leftTx="newProsthesis.upper"
								rightTx="newProsthesis.lower"
								selectLeft={() => setLimbType("upper")}
								selectRight={() => setLimbType("lower")}
								initialState={limbType === "upper" ? "left" : "right"}
								leftLabelWidth={45}
								rightLabelWidth={45}
							/>
						</View>
					</View>

					<View style={styles.checkboxesContainer}>
						<ThemedText variant="H1" colorName="blue2" tx="measurements.history.points" />
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
			<ThemedView colorName="bg_0">
				<MeasurementsTable
					measures={history.items}
					visibleLevels={visibleLevels}
					isLoading={history.isLoading}
				/>
			</ThemedView>
			<ThemedView colorName="bg_0" variant="background" style={{ paddingBottom: 30 }}>
				{/* Pagination */}
				<View style={styles.paginationRow}>
					<ThemedView
						onPress={history.goPrev}
						style={[styles.pageButton, !history.hasPrev && styles.pageButtonDisabled]}
					>
						<IconChevronLeft color={colors.blue1} width={20} height={20} />
					</ThemedView>
					<ThemedText variant="H3" colorName="blue2">
						{`${history.currentPage}/${history.totalPages}`}
					</ThemedText>
					<ThemedView
						onPress={history.goNext}
						style={[styles.pageButton, !history.hasNext && styles.pageButtonDisabled]}
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
	emptyRow: {
		paddingVertical: 24,
		paddingHorizontal: "8%",
	},
	emptyText: {
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
