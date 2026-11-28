import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Animated, StyleSheet, View } from "react-native"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"

import { useTheme } from "@/context/ThemeContext"
import { ThemedView } from "@/src/components/ThemedView"
import { useReducedMotion } from "@/src/hooks/useReducedMotion"
import { AnimatedSplash } from "./AnimatedSplash"

let nativeSplashHide: Promise<void> | undefined

export function StartupScreen({ ready, children }: { ready: boolean; children: ReactNode }) {
	const { colors, colorMode } = useTheme()
	const reduceMotion = useReducedMotion()
	const mounted = useRef(true)
	const [opacity] = useState(() => new Animated.Value(1))
	const [dismissed, setDismissed] = useState(false)
	const [splashLaidOut, setSplashLaidOut] = useState(false)
	const [contentLaidOut, setContentLaidOut] = useState(false)
	const [wasReady, setWasReady] = useState(ready)
	if (wasReady !== ready) {
		setWasReady(ready)
		if (!ready) {
			if (dismissed) setSplashLaidOut(false)
			setDismissed(false)
			setContentLaidOut(false)
		}
	}
	const showSplash = !ready || !dismissed

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])

	const onSplashLayout = useCallback(() => {
		if (!nativeSplashHide) {
			nativeSplashHide = SplashScreen.hideAsync().catch((error: unknown) => {
				console.warn("Retrying native splash hide:", error)
				return SplashScreen.hideAsync().catch((retryError: unknown) => {
					console.warn("Failed to hide native splash screen after retry:", retryError)
				})
			})
		}
		return nativeSplashHide
			.then(() => {
				if (mounted.current) setSplashLaidOut(true)
			})
			.catch((error: unknown) => {
				console.warn("Failed to hide native splash screen:", error)
			})
	}, [])

	useEffect(() => {
		if (!ready) {
			opacity.setValue(1)
			return
		}
		if (dismissed || !splashLaidOut || !contentLaidOut) return
		let active = true
		const transition = Animated.timing(opacity, {
			toValue: 0,
			duration: reduceMotion ? 0 : 180,
			useNativeDriver: true,
			isInteraction: false,
		})
		transition.start(({ finished }) => {
			if (active && finished) setDismissed(true)
		})
		return () => {
			active = false
			transition.stop()
		}
	}, [ready, splashLaidOut, contentLaidOut, dismissed, reduceMotion, opacity])

	return (
		<ThemedView colorName="bg_0" style={styles.container}>
			<StatusBar style={colorMode === "dark" ? "light" : "dark"} />
			{ready && (
				<View
					style={styles.container}
					onLayout={() => setContentLaidOut(true)}
					pointerEvents={showSplash ? "none" : "auto"}
					accessibilityElementsHidden={showSplash}
					importantForAccessibility={showSplash ? "no-hide-descendants" : "auto"}
				>
					{children}
				</View>
			)}
			{showSplash && (
				<Animated.View
					style={[
						styles.overlay,
						{ backgroundColor: colors.brandBackground, opacity: ready ? opacity : 1 },
					]}
				>
					<AnimatedSplash reduceMotion={reduceMotion} onLayout={onSplashLayout} />
				</Animated.View>
			)}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, borderRadius: 0 },
	overlay: StyleSheet.absoluteFill,
})
