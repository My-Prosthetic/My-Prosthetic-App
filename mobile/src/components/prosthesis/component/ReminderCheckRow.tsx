import { StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import { ThemedText } from "@/src/components/ThemedText"

type ReminderCheckRowProps = {
	label: string
	emailValue: boolean
	appValue: boolean
	pushValue: boolean
	onEmailChange: () => void
	onAppChange: () => void
	onPushChange: () => void
}

export function ReminderCheckRow({
	label,
	emailValue,
	appValue,
	pushValue,
	onEmailChange,
	onAppChange,
	onPushChange,
}: ReminderCheckRowProps) {
	const { t } = useTranslation()

	return (
		<View style={styles.container}>
			<View style={styles.labelContainer}>
				<ThemedText variant="H4" colorName="blue2">
					{label}
				</ThemedText>
			</View>
			<View style={styles.checkboxes}>
				<ThemedCheckbox
					label={t("newComponent.reminderChannels.email")}
					checked={emailValue}
					onPress={onEmailChange}
				/>
				<ThemedCheckbox
					label={t("newComponent.reminderChannels.app")}
					checked={appValue}
					onPress={onAppChange}
				/>
				<ThemedCheckbox
					label={t("newComponent.reminderChannels.push")}
					checked={pushValue}
					onPress={onPushChange}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginTop: 10,
	},
	labelContainer: {
		width: "36%",
		paddingRight: 4,
	},
	checkboxes: {
		flexDirection: "column",
		gap: 10,
	},
})
