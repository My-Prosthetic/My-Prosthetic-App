import { useMemo } from "react"
import { StyleSheet, View, type GestureResponderEvent } from "react-native"
import Svg, { Path } from "react-native-svg"
import { useTranslation } from "react-i18next"

import { ThemeColors, useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

export type IncidentBodyView = "side" | "top_inside" | "front_back"

export type IncidentBodyPoint = {
	x: number
	y: number
	view: IncidentBodyView
}

type Props = {
	view: IncidentBodyView
	value?: IncidentBodyPoint
	onChange: (point: IncidentBodyPoint) => void
}

const DIAGRAM_WIDTH = 210
const DIAGRAM_HEIGHT = 190

const VIEWBOX_OFFSET_X = 14
const VIEWBOX_OFFSET_Y = 14
const VIEWBOX_HEIGHT_PADDING = 4

const VIEWBOX = `${VIEWBOX_OFFSET_X} ${VIEWBOX_OFFSET_Y} ${DIAGRAM_WIDTH} ${
	DIAGRAM_HEIGHT + VIEWBOX_HEIGHT_PADDING
}`

const MARKER_OUTER_SIZE = 23
const MARKER_INNER_SIZE = 6

export function IncidentBodyMap({ view, value, onChange }: Props) {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const styles = useMemo(() => getStyles(colors), [colors])

	const handlePress = (event: GestureResponderEvent) => {
		const { locationX, locationY } = event.nativeEvent

		onChange({
			x: Math.min(1, Math.max(0, locationX / DIAGRAM_WIDTH)),
			y: Math.min(1, Math.max(0, locationY / DIAGRAM_HEIGHT)),
			view,
		})
	}

	const markerVisible = value?.view === view

	return (
		<ThemedView colorName="secondary_base_2" style={styles.card}>
			<View style={styles.diagram}>
				<Svg width={DIAGRAM_WIDTH} height={DIAGRAM_HEIGHT} viewBox={VIEWBOX}>
					{view === "side" ? (
						<>
							{/* Główny obszar klikalny */}
							<Path
								d="M76 25C100.037 44.2296 128.881 53.8444 162.533 53.8444L140.9 183.644C121.67 207.681 102.441 207.681 83.2111 183.644L76 25Z"
								fill={colors.tertiary_base_2}
								stroke={colors.primary_base_1}
								strokeWidth={2.88444}
								strokeLinejoin="round"
								onPress={handlePress}
							/>

							{/* Element dekoracyjny - nie przechwytuje kliknięcia */}
							<Path
								d="M76 25C90.4222 73.0741 97.6333 113.937 97.6333 147.589"
								fill="none"
								stroke={colors.primary_base_2}
								strokeWidth={1.44222}
								strokeLinejoin="round"
								pointerEvents="none"
							/>
						</>
					) : view === "top_inside" ? (
						<>
							{/* Główny obszar klikalny */}
							<Path
								d="M113.376 44C167.459 44 185.487 118.287 113.376 177.716C41.265 118.287 59.2928 44 113.376 44Z"
								fill={colors.tertiary_base_3}
								stroke={colors.primary_base_1}
								strokeWidth={2.88444}
								strokeLinejoin="round"
								onPress={handlePress}
							/>

							{/* Wewnętrzny obrys */}
							<Path
								d="M113.376 58.8574C153.037 58.8574 167.459 110.858 113.376 155.43C59.2928 110.858 73.715 58.8574 113.376 58.8574Z"
								fill={colors.tertiary_base_2}
								stroke={colors.primary_base_3}
								strokeWidth={2.16333}
								pointerEvents="none"
							/>
						</>
					) : (
						<>
							{/* Główny obszar klikalny */}
							<Path
								d="M65 40.2112C101.056 49.826 137.111 49.826 173.167 40.2112L151.533 184.433C129.9 208.47 108.267 208.47 86.6333 184.433L65 40.2112Z"
								fill={colors.tertiary_base_2}
								stroke={colors.primary_base_1}
								strokeWidth={2.88444}
								strokeLinejoin="round"
								onPress={handlePress}
							/>

							{/* Linia dekoracyjna */}
							<Path
								d="M65 40.2111C101.056 30.5963 137.111 30.5963 173.167 40.2111"
								fill="none"
								stroke={colors.primary_base_2}
								strokeWidth={1.44222}
								strokeLinejoin="round"
								strokeDasharray="4.33 4.33"
								pointerEvents="none"
							/>
						</>
					)}
				</Svg>

				{markerVisible && value && (
					<View
						pointerEvents="none"
						style={[
							styles.markerContainer,
							{
								left: value.x * DIAGRAM_WIDTH - MARKER_OUTER_SIZE / 2,
								top: value.y * DIAGRAM_HEIGHT - MARKER_OUTER_SIZE / 2,
							},
						]}
					>
						<ThemedView colorName="false_2" style={styles.markerOuter} />
						<ThemedView colorName="false_1" style={styles.markerInner} />
					</View>
				)}
			</View>

			<ThemedText variant="subTitle1" colorName="primary_base" style={styles.caption}>
				{view === "side"
					? t("newIncident.schemaViews.side")
					: view === "top_inside"
						? t("newIncident.schemaViews.topInside")
						: t("newIncident.schemaViews.frontBack")}
			</ThemedText>
		</ThemedView>
	)
}

const getStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		card: {
			width: 220,
			height: 220,
			borderRadius: 20,
			alignItems: "center",
			paddingTop: 0,
			paddingBottom: 8,
			shadowColor: colors.primary_base,
			shadowOffset: {
				width: 0,
				height: 0,
			},
			shadowOpacity: 0.15,
			shadowRadius: 10,
			elevation: 5,
		},

		diagram: {
			width: DIAGRAM_WIDTH,
			height: DIAGRAM_HEIGHT,
			position: "relative",
		},

		markerContainer: {
			position: "absolute",
			width: MARKER_OUTER_SIZE,
			height: MARKER_OUTER_SIZE,
			alignItems: "center",
			justifyContent: "center",
		},

		markerOuter: {
			position: "absolute",
			width: MARKER_OUTER_SIZE,
			height: MARKER_OUTER_SIZE,
			borderRadius: MARKER_OUTER_SIZE / 2,
			opacity: 0.6,
		},

		markerInner: {
			position: "absolute",
			width: MARKER_INNER_SIZE,
			height: MARKER_INNER_SIZE,
			borderRadius: MARKER_INNER_SIZE / 2,
		},

		caption: {
			textAlign: "center",
			marginTop: 4,
			fontSize: 12,
			fontFamily: "Inter-Bold",
		},
	})
