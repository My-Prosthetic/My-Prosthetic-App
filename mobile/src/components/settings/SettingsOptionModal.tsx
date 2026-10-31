import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

type SettingsOption<T extends string> = {
	value: T
	label: string
}

interface SettingsOptionModalProps<T extends string> {
	visible: boolean
	title: string
	options: SettingsOption<T>[]
	selectedValue: T
	onSelect: (value: T) => void
	onClose: () => void
}

export function SettingsOptionModal<T extends string>({
	visible,
	title,
	options,
	selectedValue,
	onSelect,
	onClose,
}: SettingsOptionModalProps<T>) {
	const { colors } = useTheme()

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			navigationBarTranslucent
			onRequestClose={onClose}
		>
			<Pressable style={styles.modalBackdrop} onPress={onClose}>
				<View
					pointerEvents="none"
					style={[StyleSheet.absoluteFill, styles.modalOverlay, { backgroundColor: colors.blue2 }]}
				/>

				<Pressable
					style={[styles.modalCard, { backgroundColor: colors.tertiary_base_3 }]}
					onPress={(event) => event.stopPropagation()}
				>
					<ThemedText variant="H3" colorName="blue2" style={styles.modalTitle}>
						{title}
					</ThemedText>

					<ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
						{options.map((option) => (
							<ThemedView
								key={option.value}
								onPress={() => onSelect(option.value)}
								style={styles.option}
							>
								<ThemedText variant="H3" colorName="neutral_text">
									{option.label}
								</ThemedText>

								<ThemedView variant="divider" colorName="neutral_text" style={styles.divider} />
							</ThemedView>
						))}
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const styles = StyleSheet.create({
	modalBackdrop: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
	},

	modalOverlay: {
		opacity: 0.35,
	},

	modalCard: {
		width: "100%",
		borderRadius: 18,
		padding: 18,
		gap: 8,
	},

	modalTitle: {
		marginBottom: 14,
	},

	optionsList: {
		flexGrow: 0,
		maxHeight: 300,
	},

	option: {
		minHeight: 44,
		justifyContent: "center",
		paddingHorizontal: 12,
	},
	divider: {
		marginTop: 10,
		opacity: 0.35,
	},
})
