import { StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ThemedText } from "@/src/components/ThemedText"
import { useTheme } from "@/context/ThemeContext"

export function GuestBanner() {
	const { colors } = useTheme()
	const insets = useSafeAreaInsets()

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.accent_base_2,
					borderLeftColor: colors.warning,
					paddingTop: insets.top + 6,
				},
			]}
		>
			<Ionicons name="warning-outline" size={22} color={colors.warning} />
			<View style={styles.messages}>
				<ThemedText tx="login.noCopy" variant="tab1Category" colorName="primary_base" />
				<ThemedText tx="login.cosntraints" variant="body1Regular" colorName="primary_base" />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingBottom: 6,
		borderLeftWidth: 6,
	},
	messages: {
		flex: 1,
		gap: 4,
	},
})
