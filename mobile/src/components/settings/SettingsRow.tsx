import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { ThemedText } from "@/src/components/ThemedText"
import { useTheme } from "@/context/ThemeContext"

interface SettingsRowProps {
	title: string
	description?: string
	right: ReactNode
}

export function SettingsRow({ title, description, right }: SettingsRowProps) {
	const { colors } = useTheme()
	return (
		<View style={[styles.row, { borderBottomColor: colors.blue1 }]}>
			<View style={styles.content}>
				<ThemedText variant="H2" colorName="blue2" style={styles.title}>
					{title}
				</ThemedText>
				{description ? (
					<ThemedText variant="H4" colorName="blue2" style={styles.description}>
						{description}
					</ThemedText>
				) : null}
			</View>
			<View style={styles.action}>{right}</View>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 46,
		paddingVertical: 6,
		borderBottomWidth: 1,
		marginBottom: 6,
		gap: 10,
	},
	content: { flex: 1, justifyContent: "center" },
	title: { fontSize: 15, lineHeight: 20 },
	description: { marginTop: 6, fontSize: 12, lineHeight: 16, maxWidth: "90%" },
	action: { justifyContent: "center", alignItems: "flex-end" },
})
