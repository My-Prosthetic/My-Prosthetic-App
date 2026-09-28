import { View, StyleSheet } from "react-native"
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

	const styles = getStyles(colors, insets)

	return (
		<View style={styles.container}>
			<View style={[styles.rightBulge, { flex: variant === "index" ? 2 : 1 }]}>
				<View
					style={[
						styles.topSection,
						variant === "index"
							? {}
							: {
									justifyContent: "flex-end",
									alignItems: "flex-end",
									paddingBottom: 30,
									paddingRight: 40,
								},
					]}
				>
					{topSectionRender()}
				</View>
			</View>
			<View style={[styles.bottomSection, { flex: variant === "index" ? 1 : 2 }]}>
				{bottomSectionRender()}
			</View>
		</View>
	)
}

const getStyles = (colors: ThemeColors, insets: EdgeInsets) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary_base,
		},
		rightBulge: {
			backgroundColor: colors.tertiary_base_2,
			justifyContent: "flex-end",
		},
		topSection: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: colors.primary_base,
			borderBottomRightRadius: 70,
		},
		bottomSection: {
			backgroundColor: colors.tertiary_base_2,
			borderTopLeftRadius: 70,
			paddingBottom: insets.bottom,
			overflow: "hidden",
		},
	})
