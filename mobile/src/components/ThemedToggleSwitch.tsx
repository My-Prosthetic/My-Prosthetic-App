import { StyleSheet } from "react-native"
import { ThemedView } from "./ThemedView"

interface ThemedToggleSwitchProps {
	value: boolean
	onValueChange: (value: boolean) => void
}

export function ThemedToggleSwitch({ value, onValueChange }: ThemedToggleSwitchProps) {
	const handleToggle = () => {
		onValueChange(!value)
	}

	return (
		<ThemedView
			onPress={handleToggle}
			hitSlop={{
				top: 10,
				bottom: 10,
				left: 0,
				right: 0,
			}}
			borderColor={value ? "blue2" : "blue1"}
			colorName={value ? "blue2" : "blue1"}
			style={[
				styles.track,
				{
					justifyContent: value ? "flex-end" : "flex-start",
				},
			]}
		>
			<ThemedView colorName="bg_0" style={styles.thumb} />
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	track: {
		flexDirection: "row",
		alignItems: "center",
		width: 46,
		height: 24,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 2,
	},

	thumb: {
		width: 20,
		height: 20,
		borderRadius: 1200,
	},
})
