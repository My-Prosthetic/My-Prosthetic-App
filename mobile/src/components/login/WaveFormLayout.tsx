import { ScrollView, useWindowDimensions, View, StyleSheet } from "react-native"
import { useState } from "react"
import { ThemeColors, useTheme } from "@/context/ThemeContext"
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context"

interface WaveFormLayoutProps {
	topSectionRender: () => React.ReactNode
	bottomSectionRender: () => React.ReactNode
	variant: "index" | "forms"
}

export function WaveFormLayout({
	topSectionRender,
	bottomSectionRender,
	variant,
}: WaveFormLayoutProps) {
	const { colors } = useTheme()
	const insets = useSafeAreaInsets()
	const { height: windowHeight } = useWindowDimensions()
	const [viewportHeight, setViewportHeight] = useState(windowHeight)

	const styles = getStyles(colors, insets)

	const layout = (
		<View
			style={[
				styles.container,
				variant === "forms" && {
					flexGrow: 1,
					minHeight: viewportHeight,
				},
			]}
		>
			<View
				style={[
					styles.rightBulge,
					variant === "index" ? { flex: 1.5 } : { height: viewportHeight * 0.25 },
				]}
			>
				<View
					style={[
						styles.topSection,
						variant === "index"
							? {}
							: {
									justifyContent: "flex-end",
									alignItems: "flex-end",
									paddingBottom: 30,
									paddingRight: 50,
								},
					]}
				>
					{topSectionRender()}
				</View>
			</View>
			<View
				style={[
					styles.bottomSection,
					variant === "index"
						? { flex: 1 }
						: {
								flexGrow: 1,
								flexShrink: 0,
								flexBasis: "auto",
								minHeight: viewportHeight * 0.7,
								overflow: "visible",
							},
				]}
			>
				{bottomSectionRender()}
			</View>
		</View>
	)

	if (variant === "index") return layout

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
		>
			{layout}
		</ScrollView>
	)
}

const getStyles = (colors: ThemeColors, insets: EdgeInsets) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.blue2,
		},
		scrollView: {
			flex: 1,
			backgroundColor: colors.blue2,
		},
		scrollContent: {
			flexGrow: 1,
		},
		rightBulge: {
			backgroundColor: colors.bg_0,
			justifyContent: "flex-end",
		},
		topSection: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: colors.blue2,
			borderBottomRightRadius: 70,
		},
		bottomSection: {
			backgroundColor: colors.bg_0,
			borderTopLeftRadius: 70,
			paddingBottom: insets.bottom,
			overflow: "hidden",
		},
	})
