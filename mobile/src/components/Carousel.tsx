import React, { ReactElement, useCallback, useMemo, useState } from "react"
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, PanResponder } from "react-native"
import { useTheme } from "@/context/ThemeContext"

import IconLeftChevron from "@/assets/icons/chevron-left.svg"
import IconRightChevron from "@/assets/icons/chevron-right.svg"

interface CarouselProps<T> {
	items: T[]
	renderItem: (item: T) => React.ReactNode
	renderPlus?: () => React.ReactNode
	cardStyle?: StyleProp<ViewStyle>
	carouselStyle?: StyleProp<ViewStyle>
	adjustChevronPadding?: number
	chevronScale?: number
	setExternalIndex?: (newIndex: number) => void
	initialIndex?: number
}

export function Carousel<T>({
	items,
	renderItem,
	renderPlus,
	cardStyle,
	carouselStyle,
	adjustChevronPadding = 0,
	chevronScale = 1,
	setExternalIndex,
	initialIndex,
}: CarouselProps<T>): ReactElement | null {
	const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0)
	const { colors } = useTheme()
	const totalLength = renderPlus ? items.length + 1 : items.length
	const hasPrev = currentIndex > 0
	const hasNext = currentIndex < totalLength - 1
	const isPlusCard = renderPlus && currentIndex === items.length
	const changeIndex = useCallback(
		(newIndex: number) => {
			if (newIndex < 0 || newIndex >= totalLength) {
				return
			}

			setCurrentIndex(newIndex)
			setExternalIndex?.(newIndex)
		},
		[setExternalIndex, totalLength]
	)
	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (_, gestureState) =>
					Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
				onPanResponderRelease: (_, gestureState) => {
					if (Math.abs(gestureState.dx) < 50) {
						return
					}

					changeIndex(currentIndex + (gestureState.dx < 0 ? 1 : -1))
				},
			}),
		[changeIndex, currentIndex]
	)

	if (totalLength === 0) {
		return null
	}

	return (
		<View style={[styles.container, carouselStyle]} {...panResponder.panHandlers}>
			{/* Lewa strzałka */}
			<View style={[styles.arrowSlot, { paddingRight: 15 + adjustChevronPadding }]}>
				<Pressable
					disabled={!hasPrev}
					style={({ pressed }) => [{ opacity: !hasPrev ? 0 : pressed ? 0.6 : 1 }]}
					hitSlop={{
						top: 4 + (1 - chevronScale) * 40,
						bottom: 4 + (1 - chevronScale) * 40,
						right: 8 * 2 + (1 - chevronScale) * 22 * 2,
					}}
					onPress={() => {
						changeIndex(currentIndex - 1)
					}}
				>
					<IconLeftChevron
						width={chevronScale * 22}
						height={chevronScale * 40}
						color={colors.blue2}
					/>
				</Pressable>
			</View>

			{/* Środkowa karta */}
			<View style={[styles.card, cardStyle]}>
				{isPlusCard ? renderPlus() : renderItem(items[currentIndex])}
			</View>

			{/* Prawa strzałka */}
			<View style={[styles.arrowSlot, { paddingLeft: 15 + adjustChevronPadding }]}>
				<Pressable
					disabled={!hasNext}
					style={({ pressed }) => [{ opacity: !hasNext ? 0 : pressed ? 0.6 : 1 }]}
					hitSlop={{
						top: 4 + (1 - chevronScale) * 40,
						bottom: 4 + (1 - chevronScale) * 40,
						left: 8 * 2 + (1 - chevronScale) * 22 * 2,
					}}
					onPress={() => {
						changeIndex(currentIndex + 1)
					}}
				>
					<IconRightChevron
						width={chevronScale * 22}
						height={chevronScale * 40}
						color={colors.blue2}
					/>
				</Pressable>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	arrowSlot: {
		alignItems: "center",
		padding: 2,
		zIndex: 10,
		elevation: 10,
	},
	card: {
		zIndex: 1,
		elevation: 1,
	},
})
