import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { ThemedText } from "./ThemedText"
import { useTheme } from "@/context/ThemeContext"

export default function ThemedCheckbox({
	label,
	checked,
	onPress,
}: {
	label: string
	checked: boolean
	onPress: () => void
}) {
	const { colors } = useTheme()

	return (
		<TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.checkboxItem}>
			<View
				style={[
					styles.checkboxBox,
					checked
						? { backgroundColor: colors.primary_base, borderColor: colors.primary_base }
						: { backgroundColor: colors.tertiary_base_3, borderColor: colors.primary_base },
				]}
			>
				{checked && <Ionicons name="checkmark" size={18} color={colors.tertiary_base_1} />}
			</View>
			<ThemedText variant="subTitle2" colorName="primary_base" style={styles.checkboxLabel}>
				{label}
			</ThemedText>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	checkboxItem: {
		alignItems: "center",
		width: 68,
	},
	checkboxBox: {
		width: 28,
		height: 28,
		borderRadius: 8,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	checkboxLabel: {
		textAlign: "center",
		fontSize: 11,
		lineHeight: 13,
	},
})
