import React, { useRef } from "react"
import {
	View,
	ViewProps,
	Pressable,
	PressableProps,
	StyleSheet,
	ViewStyle,
	StyleProp,
	Platform,
} from "react-native"
import { useTheme, ThemeColors } from "@/context/ThemeContext"

export type ThemedViewSize =
	"none" | "wide" | "narrow" | "background" | "tag" | "divider" | "header"

export interface ThemedViewProps extends Omit<PressableProps, "style"> {
	colorName?: keyof ThemeColors
	borderColor?: keyof ThemeColors
	variant?: ThemedViewSize
	shadow?: boolean
	onPress?: () => void
	style?: StyleProp<ViewStyle>
	children?: React.ReactNode
}

const getShadowStyle = (enabled: boolean): ViewStyle => {
	if (!enabled) {
		return {}
	}

	return Platform.select({
		ios: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.15,
			shadowRadius: 10,
		},
		android: {
			elevation: 5,
		},
		default: {
			elevation: 5,
		},
	}) as ViewStyle
}

const PRESS_GUARD_MS = 500

export const ThemedView = ({
	colorName = "primary_base",
	borderColor,
	variant: size = "none",
	shadow = false,
	onPress,
	style,
	children,
	...props
}: ThemedViewProps) => {
	const { colors } = useTheme()

	// Zamiast timera przechowujemy tylko znacznik czasu ostatniego kliknięcia w ms
	const lastPressRef = useRef(0)

	const handlePress = () => {
		const now = Date.now()

		// Jeśli od poprzedniego kliknięcia minęło mniej niż 500 ms – ignorujemy
		if (now - lastPressRef.current < PRESS_GUARD_MS) {
			return
		}

		lastPressRef.current = now
		onPress?.()
	}

	const getElementStyle = (pressed = false): StyleProp<ViewStyle> => [
		styles.base,
		borderColor && {
			borderWidth: 3,
			borderColor: colors[borderColor],
		},
		sizes[size],
		{ backgroundColor: colors[colorName] },
		getShadowStyle(shadow),
		pressed && styles.pressed,
		style,
	]

	if (onPress) {
		return (
			<Pressable onPress={handlePress} style={({ pressed }) => getElementStyle(pressed)} {...props}>
				{children}
			</Pressable>
		)
	}

	return (
		<View style={getElementStyle()} {...(props as ViewProps)}>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	base: {
		flexDirection: "column",
	},
	pressed: {
		opacity: 0.75,
	},
})

const sizes = StyleSheet.create({
	none: {},
	tag: {
		alignSelf: "flex-start",
		borderRadius: 9999,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	narrow: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		height: 60,
		width: "70%",
		borderRadius: 12,
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "center",
		justifyContent: "center",
	},
	wide: {
		paddingVertical: 14,
		paddingHorizontal: 16,
		minHeight: 60,
		borderRadius: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	background: {
		flex: 1,
		paddingHorizontal: 32,
		paddingVertical: 0,
		margin: 0,
	},
	divider: {
		height: 1,
		width: "100%",
		alignSelf: "stretch",
	},
	header: {
		width: "100%",
		minHeight: 54,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 0,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
})
