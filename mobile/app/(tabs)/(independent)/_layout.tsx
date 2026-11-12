import { Stack, useIsFocused } from "expo-router"

export default function IndependentLayout() {
	const isFocused = useIsFocused()

	if (!isFocused) return null

	return <Stack screenOptions={{ headerShown: false }} />
}
