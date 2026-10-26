import { useMemo } from "react"
import { StyleProp, ViewStyle } from "react-native"
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg"
import { useTheme } from "@/context/ThemeContext"
import type { MeasurementLevel } from "@/src/utils/measurementUtils"

interface MeasurementDiagramProps {
	levels: MeasurementLevel[]
	style?: StyleProp<ViewStyle>
}

const MAX_LEVELS = 5

/* Geometria kształtu – wartości wyciągnięte z MeasurementDiagram.svg */
const TOP_Y = 1.196
const STRAIGHT_BOTTOM_Y = 120.804
const TOP_LEFT_X = 29.902
const BOTTOM_LEFT_X = 47.8435
const TOP_RIGHT_X = 125.589
const BOTTOM_RIGHT_X = 107.647
const ARC_RADIUS = (BOTTOM_RIGHT_X - BOTTOM_LEFT_X) / 2
const ARC_CENTER_X = (BOTTOM_LEFT_X + BOTTOM_RIGHT_X) / 2

const STROKE_WIDTH = 2.39216
const MEASUREMENT_LINE_WIDTH = 2.4
const TOP_DASH_WIDTH = 3.5

/* Proporcje nakładki – wszystko wyliczane względem geometrii kształtu */
const TOP_WIDTH = TOP_RIGHT_X - TOP_LEFT_X
const HEIGHT = STRAIGHT_BOTTOM_Y - TOP_Y // prosty odcinek
const BOTTOM_Y = STRAIGHT_BOTTOM_Y + ARC_RADIUS // sam dół kikuta (czubek łuku)
const FULL_HEIGHT = BOTTOM_Y - TOP_Y // cały kikut: prosty odcinek + łuk
const MAX_BADGE_RADIUS = TOP_WIDTH * 0.15
const BADGE_GAP = 2
const LINE_OVERHANG = TOP_WIDTH * 0.15 // o ile kreska wystaje za lewą krawędź
const BADGE_MARGIN = TOP_WIDTH * 0.15 // odstęp kulki od prawej krawędzi
const PADDING = STROKE_WIDTH

/* ViewBox obejmuje najszersze miejsce (górę), cały łuk na dole oraz kulkę leżącą na samym dole (distance ≈ 0) */
const VIEW_MIN_X = TOP_LEFT_X - LINE_OVERHANG - PADDING
const DEFAULT_VIEW_MAX_X = TOP_RIGHT_X + BADGE_MARGIN + 2 * MAX_BADGE_RADIUS + PADDING
const VIEW_MIN_Y = TOP_Y - PADDING
const VIEW_MAX_Y = BOTTOM_Y + MAX_BADGE_RADIUS + PADDING
const VIEW_HEIGHT = VIEW_MAX_Y - VIEW_MIN_Y

/* 1 poziom: kreska na środku zakresu – ułamek PEŁNEJ wysokości kikuta (0 = góra, 1 = czubek łuku) */
const POSITION_MIN = 0.15
const POSITION_MAX = 0.9

/* 2+ poziomy: skala bezwzględna – distance = 0 leży na samym dole schematu,
   największy distance na tym ułamku pełnej wysokości liczonej od dołu */
const MAX_DISTANCE_HEIGHT = 0.9
const MAX_DISTANCE_HEIGHT_TWO_LEVELS = 0.75

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const badgeRadius = (n: number) =>
	Math.min(MAX_BADGE_RADIUS, (HEIGHT - (n - 1) * BADGE_GAP) / (2 * n - 1))

/** Pozycje poziomów (oś Y) na pełnej wysokości kikuta. */
function computeYPositions(distances: number[]): number[] {
	const n = distances.length
	const toY = (normalizedY: number) => TOP_Y + normalizedY * FULL_HEIGHT

	if (n === 1) return [toY(lerp(POSITION_MIN, POSITION_MAX, 1 / 2))]
	// 2+ poziomów: 0 na dole schematu, maxDistance na maxHeight wysokości, reszta proporcjonalnie
	const maxHeight = n === 2 ? MAX_DISTANCE_HEIGHT_TWO_LEVELS : MAX_DISTANCE_HEIGHT
	const maxDistance = Math.max(...distances)

	return distances.map((distance) => {
		const ratio = maxDistance > 0 ? Math.min(Math.max(distance / maxDistance, 0), 1) : 0
		return BOTTOM_Y - ratio * maxHeight * FULL_HEIGHT
	})
}

/** Współrzędna X lewej / prawej krawędzi kształtu na wysokości y (prosty odcinek + łuk). */
const edgeX = (y: number) => {
	if (y <= STRAIGHT_BOTTOM_Y) {
		const t = (y - TOP_Y) / HEIGHT
		return {
			left: lerp(TOP_LEFT_X, BOTTOM_LEFT_X, t),
			right: lerp(TOP_RIGHT_X, BOTTOM_RIGHT_X, t),
		}
	}

	// Półokrąg na dole: x = cx ± sqrt(R² − dy²)
	const dy = Math.min(y - STRAIGHT_BOTTOM_Y, ARC_RADIUS)
	const halfWidth = Math.sqrt(ARC_RADIUS ** 2 - dy ** 2)
	return {
		left: ARC_CENTER_X - halfWidth,
		right: ARC_CENTER_X + halfWidth,
	}
}

export function MeasurementDiagram({ levels, style }: MeasurementDiagramProps) {
	const { colors } = useTheme()
	const { items, viewMaxX } = useMemo(() => {
		const sorted = [...levels].slice(0, MAX_LEVELS).sort((a, b) => b.distance - a.distance)
		if (sorted.length === 0) return { items: [], viewMaxX: DEFAULT_VIEW_MAX_X }

		const radius = badgeRadius(sorted.length)
		const ys = computeYPositions(sorted.map((level) => level.distance))
		const horizontalStep = radius * 2
		const rightEdges = ys.map((y) => edgeX(y).right)
		const firstBadgeX = rightEdges.reduce(
			(maxX, rightEdge, index) =>
				Math.max(maxX, rightEdge + BADGE_MARGIN + radius + index * horizontalStep),
			0
		)

		const items = sorted.map((level, index) => {
			const y = ys[index]
			const { left } = edgeX(y)
			return {
				id: level.level,
				label: `L${index + 1}`,
				y,
				radius,
				lineStartX: left - LINE_OVERHANG,
				badgeX: firstBadgeX - index * horizontalStep,
			}
		})

		return {
			items,
			viewMaxX: firstBadgeX + radius + PADDING,
		}
	}, [levels])
	const viewWidth = viewMaxX - VIEW_MIN_X

	const dashLength = TOP_WIDTH / 20

	const outline = [
		`M${TOP_LEFT_X} ${TOP_Y}`,
		`L${BOTTOM_LEFT_X} ${STRAIGHT_BOTTOM_Y}`,
		`A${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${BOTTOM_RIGHT_X} ${STRAIGHT_BOTTOM_Y}`,
		`L${TOP_RIGHT_X} ${TOP_Y}`,
	].join(" ")

	return (
		<Svg
			width="100%"
			viewBox={`${VIEW_MIN_X} ${VIEW_MIN_Y} ${viewWidth} ${VIEW_HEIGHT}`}
			style={[{ aspectRatio: viewWidth / VIEW_HEIGHT }, style]}
		>
			{/* Kształt */}
			<Path d={outline} fill={colors.blue0} stroke={colors.blue2} strokeWidth={STROKE_WIDTH} />
			<Line
				x1={TOP_LEFT_X}
				y1={TOP_Y}
				x2={TOP_RIGHT_X}
				y2={TOP_Y}
				stroke={colors.blue2}
				strokeWidth={TOP_DASH_WIDTH}
				strokeDasharray={`${dashLength} ${dashLength}`}
			/>

			{/* Poziomy pomiarowe */}
			{items.map((item) => {
				const fontSize = item.radius * 0.9
				return (
					<G key={item.id}>
						<Line
							x1={item.lineStartX}
							y1={item.y}
							x2={item.badgeX}
							y2={item.y}
							stroke={colors.blue2}
							strokeWidth={MEASUREMENT_LINE_WIDTH}
							strokeLinecap="round"
							strokeDasharray={`0.01 ${MEASUREMENT_LINE_WIDTH * 1.4}`}
						/>
						<Circle cx={item.badgeX} cy={item.y} r={item.radius} fill={colors.blue2} />
						<SvgText
							x={item.badgeX}
							y={item.y + fontSize * 0.35}
							fill={colors.bg_0}
							fontSize={fontSize}
							fontWeight="bold"
							textAnchor="middle"
						>
							{item.label}
						</SvgText>
					</G>
				)
			})}
		</Svg>
	)
}
