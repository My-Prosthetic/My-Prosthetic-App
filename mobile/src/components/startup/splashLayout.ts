type Insets = { top: number; bottom: number; left: number; right: number }

export function getSplashLayout(width: number, height: number, insets: Insets) {
	const availableWidth = Math.max(0, width - insets.left - insets.right)
	const availableHeight = Math.max(0, height - insets.top - insets.bottom)
	const scale = Math.min(availableWidth / 393, availableHeight / 650, 1.5)
	return {
		logoWidth: 279 * scale,
		logoHeight: (279 * 45 * scale) / 80,
		fontSize: 35 * scale,
		brandGap: 30 * scale,
		dotSize: 20 * scale,
		dotGap: 26 * scale,
		top: insets.top + availableHeight * 0.19,
		dotsTop: insets.top + availableHeight * 0.63,
	}
}

export const DOT_COUNT = 5
export const WAVE_INPUT = Array.from({ length: 41 }, (_, index) => index / 40)

export function getDotOpacity(index: number, highContrast: boolean) {
	const minimum = highContrast ? 0.8 : 0.45
	return WAVE_INPUT.map(
		(phase) =>
			minimum + (1 - minimum) * (0.5 + 0.5 * Math.cos(2 * Math.PI * (phase - index / DOT_COUNT)))
	)
}
