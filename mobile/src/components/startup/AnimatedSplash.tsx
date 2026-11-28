import { useEffect, useState } from "react"
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native"
import type { LayoutChangeEvent } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"

import Logo from "@/assets/branding/mp-mark.svg"
import { useTheme } from "@/context/ThemeContext"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { DOT_COUNT, getDotOpacity, getSplashLayout, WAVE_INPUT } from "./splashLayout"

interface Props {
	reduceMotion: boolean
	onLayout: (event: LayoutChangeEvent) => void
}

export function AnimatedSplash({ reduceMotion, onLayout }: Props) {
	const { width, height } = useWindowDimensions()
	const insets = useSafeAreaInsets()
	const { colors, highContrast } = useTheme()
	const { t } = useTranslation()
	const [phase] = useState(() => new Animated.Value(0))
	const layout = getSplashLayout(width, height, insets)

	useEffect(() => {
		if (reduceMotion) return
		phase.setValue(0)
		const animation = Animated.loop(
			Animated.timing(phase, {
				toValue: 1,
				duration: 1400,
				easing: Easing.linear,
				useNativeDriver: true,
				isInteraction: false,
			})
		)
		animation.start()
		return () => animation.stop()
	}, [phase, reduceMotion])

	return (
		<ThemedView
			colorName="brandBackground"
			style={styles.screen}
			onLayout={onLayout}
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel={t("startup.loading")}
			accessibilityState={{ busy: true }}
		>
			<StatusBar style="light" />
			<View style={[styles.brand, { top: layout.top, left: insets.left, right: insets.right }]}>
				<Logo
					width={layout.logoWidth}
					height={layout.logoHeight}
					color={colors.brandForeground}
					accessible={false}
				/>
				<ThemedText
					colorName="brandForeground"
					variant="H4"
					allowFontScaling={false}
					style={[
						styles.wordmark,
						{
							fontSize: layout.fontSize,
							letterSpacing: layout.fontSize * 0.04,
							marginTop: layout.brandGap,
						},
					]}
				>
					MY PROSTHETIC
				</ThemedText>
			</View>
			<View
				style={[
					styles.dots,
					{ top: layout.dotsTop, gap: layout.dotGap, left: insets.left, right: insets.right },
				]}
			>
				{Array.from({ length: DOT_COUNT }, (_, index) => (
					<Animated.View
						key={index}
						style={[
							{
								backgroundColor: colors.brandIndicator,
								width: layout.dotSize,
								height: layout.dotSize,
								borderRadius: layout.dotSize / 2,
								opacity: reduceMotion
									? 1
									: phase.interpolate({
											inputRange: WAVE_INPUT,
											outputRange: getDotOpacity(index, highContrast),
										}),
							},
						]}
					/>
				))}
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, borderRadius: 0 },
	brand: { position: "absolute", alignItems: "center" },
	wordmark: {
		fontFamily: undefined,
		lineHeight: undefined,
		paddingHorizontal: 0,
		fontWeight: "500",
		textAlign: "center",
	},
	dots: { position: "absolute", flexDirection: "row", justifyContent: "center" },
})
