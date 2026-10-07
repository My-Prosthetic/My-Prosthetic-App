import React, { useRef } from "react"
import {
	View,
	Pressable,
	PressableProps,
	StyleSheet,
	ViewStyle,
	StyleProp,
	Platform,
} from "react-native"
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme, ThemeColors } from "@/context/ThemeContext"

export type ThemedViewSize =
	| "none"
	| "background"
	| "divider"
	| "old_wide"
	| "old_narrow"
	| "old_tag"
	| "wide"
	| "narrow"
	| "tag"

export interface ThemedViewProps extends Omit<PressableProps, "style"> {
	colorName?: keyof ThemeColors
	borderColor?: keyof ThemeColors
	variant?: ThemedViewSize
	shadow?: boolean
	onPress?: () => void | Promise<unknown>
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
	style,
	children,
	leftChild,
	centerChild,
	rightChild,
	childrenContainerStyle,
	...props
}: ThemedViewProps) => {
	const { colors } = useTheme()
	const insets = useSafeAreaInsets()
	const sizes = getSizes(insets)

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
			<Pressable onPress={handlePress} style={({ pressed }) => getElementStyle(pressed)} {...props}>
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
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
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

const getSizes = (insets: EdgeInsets) =>
	StyleSheet.create({
		none: {},
		old_tag: {
			alignSelf: "flex-start",
			borderRadius: 9999,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
		},
		old_narrow: {
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
		old_wide: {
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
			paddingHorizontal: "8%",
			flexDirection: "column",
			alignItems: "center",
		},
		divider: {
			height: 1,
			width: "100%",
			alignSelf: "stretch",
		},
		wide: {
			width: "100%",
			minHeight: 50,
		},
		narrow: {
			width: "75%",
			minHeight: 50,
		},
		tag: {
			height: 22,
		},
	})
