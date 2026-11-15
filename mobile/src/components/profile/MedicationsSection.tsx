import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import IconTrash from "@/assets/icons/trash-bin.svg"

import type { Medication } from "./types"

const MEDICATION_LIST_VERTICAL_PADDING = 8
const MEDICATION_ROW_HEIGHT = 28
const MEDICATION_LIST_GAP = 8
const MEDICATION_LIST_MAX_HEIGHT =
	MEDICATION_ROW_HEIGHT * 4.5 + MEDICATION_LIST_GAP * 4 + MEDICATION_LIST_VERTICAL_PADDING

type MedicationsSectionProps = {
	medications: Medication[]
	onAddPress: () => void
	onDelete: (id: string) => Promise<void>
}

export function MedicationsSection({ medications, onAddPress, onDelete }: MedicationsSectionProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	const confirmDelete = (medication: Medication) => {
		Alert.alert(
			t("profile.deleteMedicationTitle"),
			t("profile.deleteMedicationMessage", { medication: medication.name }),
			[
				{
					text: t("profile.cancel"),
					style: "cancel",
				},
				{
					text: t("profile.delete"),
					style: "destructive",
					onPress: () => void onDelete(medication.id),
				},
			]
		)
	}

	return (
		<>
			<View style={styles.medicationCardWrapper}>
				<ThemedView colorName="bg_0" borderColor="blue1" style={styles.medicationCard}>
					<ScrollView
						style={[styles.medicationListScroll, { maxHeight: MEDICATION_LIST_MAX_HEIGHT }]}
						contentContainerStyle={styles.medicationScrollContent}
						nestedScrollEnabled
						persistentScrollbar
						showsVerticalScrollIndicator
					>
						{medications.map((medication) => (
							<View key={medication.id} style={styles.medicationRow}>
								<View style={[styles.medicationBullet, { backgroundColor: colors.blue2 }]} />

								<View style={styles.medicationTextRow}>
									<ThemedText
										variant="subTitle2"
										colorName="primary_base"
										style={styles.medicationName}
									>
										{medication.name}
									</ThemedText>

									<ThemedText variant="H2" colorName="blue2">
										{" "}
										({medication.usage})
									</ThemedText>
								</View>

								<Pressable
									onPress={(event) => {
										event.stopPropagation()
										confirmDelete(medication)
									}}
									accessibilityRole="button"
									accessibilityLabel={t("profile.deleteMedication", {
										medication: medication.name,
									})}
									hitSlop={8}
									style={styles.deleteMedicationButton}
								>
									<IconTrash color={colors.false} width={20} />
								</Pressable>
							</View>
						))}
					</ScrollView>
				</ThemedView>
			</View>

			<ThemedView style={styles.actionTag} onPress={onAddPress} accessibilityRole="button">
				<ThemedText
					tx="profile.addMedication"
					variant="H5"
					colorName="blue1"
					style={styles.tagText}
				/>
			</ThemedView>
		</>
	)
}

const styles = StyleSheet.create({
	medicationCardWrapper: {
		width: "100%",
		marginBottom: 12,
	},
	medicationCard: {
		width: "100%",
		minHeight: 76,
		borderWidth: 1,
		borderRadius: 16,
		position: "relative",
	},
	medicationListScroll: {
		flexGrow: 0,
		paddingHorizontal: 12,
	},
	medicationScrollContent: {
		width: "100%",
		gap: MEDICATION_LIST_GAP,
		padding: MEDICATION_LIST_VERTICAL_PADDING,
	},
	medicationRow: {
		minHeight: MEDICATION_ROW_HEIGHT,
		flexDirection: "row",
		alignItems: "center",
	},
	medicationBullet: {
		width: 8,
		height: 8,
		borderRadius: 1000,
		marginRight: 12,
		marginLeft: 6,
	},
	medicationTextRow: {
		flex: 1,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "baseline",
		paddingRight: 8,
	},
	medicationName: {
		fontWeight: "700",
	},
	deleteMedicationButton: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	actionTag: {
		alignSelf: "flex-end",
		marginBottom: 12,
	},
	tagText: {
		marginRight: 16,
	},
})
