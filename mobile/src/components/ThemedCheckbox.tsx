import { StyleSheet, Pressable, View } from "react-native"
import { ThemedText } from "./ThemedText"
import { useTheme } from "@/context/ThemeContext"

import IconCheck from "@/assets/icons/check.svg"

export default function ThemedCheckbox({
	label,
	checked,
	onPress,
}: {
	label?: string
	checked: boolean
	onPress?: () => void
}) {
	const { colors } = useTheme()

	return (
		<Pressable hitSlop={8} onPress={onPress} style={styles.checkboxItem}>
			<View
				style={[
					styles.checkboxBox,
					checked
						? { backgroundColor: colors.blue2 }
						: { backgroundColor: colors.bg_0, borderColor: colors.blue2, borderWidth: 1.2 },
				]}
			>
				{checked && <IconCheck color={colors.bg_0} width={18} height={18} />}
			</View>
			{label && (
				<ThemedText variant="H2" colorName="blue2" style={styles.checkboxLabel}>
					{label}
				</ThemedText>
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	checkboxItem: {
		alignItems: "center",
	},
	checkboxBox: {
		width: 28,
		height: 28,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	checkboxLabel: {
		textAlign: "center",
	},
})
