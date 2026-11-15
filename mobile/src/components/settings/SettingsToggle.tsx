import { Pressable, StyleSheet, View } from "react-native"
import { useTheme } from "@/context/ThemeContext"

interface SettingsToggleProps {
	value: boolean
	onValueChange: (value: boolean) => void
	label: string
	disabled?: boolean
}

export function SettingsToggle({
	value,
	onValueChange,
	label,
	disabled = false,
}: SettingsToggleProps) {
	const { colors } = useTheme()
	return (
		<Pressable
			accessibilityRole="switch"
			accessibilityLabel={label}
			accessibilityState={{ checked: value, disabled }}
			disabled={disabled}
			onPress={() => onValueChange(!value)}
			style={styles.pressArea}
		>
			<View style={[styles.track, { backgroundColor: value ? colors.blue2 : colors.blue1 }]}>
				<View
					style={[
						styles.thumb,
						{ backgroundColor: colors.bg_0, alignSelf: value ? "flex-end" : "flex-start" },
					]}
				/>
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	pressArea: {
		width: 48,
		minHeight: 44,
		justifyContent: "center",
		alignItems: "center",
	},
	track: {
		width: 44,
		height: 24,
		borderRadius: 14,
		padding: 2,
		justifyContent: "center",
	},
	thumb: {
		width: 20,
		height: 20,
		borderRadius: 10,
	},
})
