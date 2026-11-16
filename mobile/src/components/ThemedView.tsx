import React, { useRef } from "react"
import {
	View,
	Pressable,
	PressableProps,
	StyleSheet,
	ViewStyle,
	StyleProp,
	Platform,
	Insets,
} from "react-native"
import { useTheme, ThemeColors } from "@/context/ThemeContext"

export type ThemedViewSize = "none" | "background" | "divider" | "wide" | "narrow" | "tag"

export interface ThemedViewProps extends Omit<PressableProps, "style"> {
	colorName?: keyof ThemeColors
	borderColor?: keyof ThemeColors
	variant?: ThemedViewSize
	shadow?: boolean
	onPress?: () => void | Promise<unknown>
	hitslop?: Insets | number
	style?: StyleProp<ViewStyle>
	children?: React.ReactNode
	leftChild?: React.ReactNode
	centerChild?: React.ReactNode
	rightChild?: React.ReactNode
	childrenContainerStyle?: StyleProp<ViewStyle>
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
	colorName,
	borderColor,
	variant: size = "none",
	shadow = false,
	onPress,
	hitslop,
	style,
	children,
	leftChild,
	centerChild,
	rightChild,
	childrenContainerStyle,
	...props
}: ThemedViewProps) => {
	const { colors } = useTheme()

	const isProcessingRef = useRef(false)
	const lastPressRef = useRef(0)

	const handlePress = async () => {
		const now = Date.now()

		if (isProcessingRef.current || now - lastPressRef.current < PRESS_GUARD_MS) {
			return
		}

		lastPressRef.current = now
		isProcessingRef.current = true

		try {
			await onPress?.()
		} finally {
			isProcessingRef.current = false
		}
	}

	const getElementStyle = (pressed = false): StyleProp<ViewStyle> => [
		styles.base,
		borderColor && {
			borderWidth: 1,
			borderColor: colors[borderColor],
		},
		sizes[size],
		{ backgroundColor: colorName ? colors[colorName] : "transparent" },
		getShadowStyle(shadow),
		pressed && styles.pressed,
		style,
	]

	const renderContent = () => {
		const hasSlotContent = Boolean(leftChild || centerChild || rightChild)
		const onlyCenter = !Boolean(leftChild || rightChild)

		if (!hasSlotContent) {
			return children
		}

		return (
			<View style={[styles.slotRow, childrenContainerStyle]}>
				<View style={styles.slotSide}>{leftChild}</View>
				<View style={[styles.slotCenter, { alignItems: onlyCenter ? "center" : "flex-start" }]}>
					{centerChild}
				</View>
				<View style={styles.slotSide}>{rightChild}</View>
			</View>
		)
	}

	if (onPress) {
		return (
			<Pressable
				onPress={handlePress}
				style={({ pressed }) => getElementStyle(pressed)}
				accessibilityRole="button"
				hitSlop={hitslop}
				{...props}
			>
				{renderContent()}
			</Pressable>
		)
	}

	return (
		<View style={getElementStyle()} {...props}>
			{renderContent()}
		</View>
	)
}

const styles = StyleSheet.create({
	base: {
		justifyContent: "center",
		borderRadius: 20,
	},
	pressed: {
		opacity: 0.75,
	},
	slotRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		width: "100%",
		gap: 15,
		paddingHorizontal: 18,
	},
	slotSide: {
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	slotCenter: {
		flex: 1,
		justifyContent: "flex-start",
	},
})

/* eslint-disable react-native/no-unused-styles -- keys are picked at runtime via sizes[size] */
const sizes = StyleSheet.create({
	none: {},
	background: {
		flex: 1,
		width: "100%",
		paddingHorizontal: "8%",
		flexDirection: "column",
		borderRadius: 0,
		justifyContent: "flex-start",
	},
	divider: {
		height: 1,
		width: "100%",
	},
	wide: {
		width: "100%",
		minHeight: 50,
	},
	narrow: {
		width: "73%",
		minHeight: 50,
		alignSelf: "center",
		alignItems: "center",
	},
	tag: {
		height: 24,
		flexDirection: "row",
		alignItems: "center",
	},
})
/* eslint-enable react-native/no-unused-styles */
