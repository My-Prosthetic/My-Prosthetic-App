import { StyleSheet } from "react-native"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

export function Initials({
	initials,
	circumference = 56,
}: {
	initials: string
	circumference?: number
}) {
	return (
		<ThemedView
			colorName="blue1"
			style={[
				styles.circle,
				{ width: circumference, height: circumference, borderRadius: circumference / 2 },
			]}
		>
			<ThemedText variant="H3" colorName="bg_0">
				{initials}
			</ThemedText>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	circle: {
		alignItems: "center",
		justifyContent: "center",
	},
})
