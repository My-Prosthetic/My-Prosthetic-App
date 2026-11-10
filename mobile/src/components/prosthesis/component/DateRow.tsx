import { StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { formatDate } from "@/src/utils/dateTimeUtils"

type DateRowProps = {
	value: Date | null
	onPress: () => void
	onClear?: () => void
}

export function DateRow({ value, onPress, onClear }: DateRowProps) {
	const { t } = useTranslation()

	return (
		<View style={styles.container}>
			<ThemedView
				borderColor="blue1"
				colorName="bg_0"
				variant="wide"
				onPress={onPress}
				style={styles.dateField}
			>
				<ThemedText variant="H3" colorName="graphite0">
					{value ? formatDate(value, "numeric") : t("prosthesisDetails.filters.chooseDate")}
				</ThemedText>
			</ThemedView>
			{value && onClear && (
				<ThemedView onPress={onClear} style={styles.clearButton}>
					<ThemedText tx="common.delete" variant="H4" colorName="false" />
				</ThemedView>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		gap: 6,
	},
	dateField: {
		minHeight: 44,
		alignItems: "flex-start",
		paddingHorizontal: 10,
		borderRadius: 15,
	},
	clearButton: {
		alignSelf: "flex-start",
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
})
