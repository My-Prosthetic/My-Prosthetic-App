import { useEffect, useState } from "react"
import { AccessibilityInfo } from "react-native"

export function useReducedMotion() {
	const [reduceMotion, setReduceMotion] = useState(true)

	useEffect(() => {
		let active = true
		let changed = false
		const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
			changed = true
			setReduceMotion(enabled)
		})
		AccessibilityInfo.isReduceMotionEnabled()
			.then((enabled) => {
				if (active && !changed) setReduceMotion(enabled)
			})
			.catch((error: unknown) => console.warn("Could not read Reduce Motion:", error))
		return () => {
			active = false
			subscription.remove()
		}
	}, [])

	return reduceMotion
}
