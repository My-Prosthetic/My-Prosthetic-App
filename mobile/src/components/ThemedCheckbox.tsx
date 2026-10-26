import { StyleSheet, TouchableOpacity, View } from "react-native"
import { ThemedText } from "./ThemedText"
import { useTheme } from "@/context/ThemeContext"

import IconCheck from "@/assets/icons/check.svg"

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
						? { backgroundColor: colors.blue2 }
						: { backgroundColor: colors.bg_0, borderColor: colors.blue1 },
				]}
			>
				{checked && <IconCheck color={colors.bg_0} width={14} height={12} />}
			</View>
			<ThemedText variant="H2" colorName="blue2" style={styles.checkboxLabel}>
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
