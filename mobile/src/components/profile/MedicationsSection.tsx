import { Alert, Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import type { Medication } from "./types"

type MedicationsSectionProps = {
	medications: Medication[]
	isExpanded: boolean
	onExpandedChange: (expanded: boolean) => void
	onAddPress: () => void
	onDelete: (id: string) => Promise<void>
}

export function MedicationsSection({
	medications,
	isExpanded,
	onExpandedChange,
	onAddPress,
	onDelete,
}: MedicationsSectionProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	const visibleMedications = isExpanded ? medications : medications.slice(0, 3)

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
				<ThemedView
					colorName="tertiary_base_3"
					borderColor="primary_base_3"
					style={styles.medicationCard}
				>
					{medications.length > 3 && (
						<Pressable
							onPress={(event) => {
								event.stopPropagation()
								onExpandedChange(!isExpanded)
							}}
							style={styles.medicationToggle}
							accessibilityRole="button"
							accessibilityState={{ expanded: isExpanded }}
						>
							<Ionicons
								name={isExpanded ? "chevron-up" : "chevron-down"}
								size={18}
								color={colors.primary_base}
							/>
						</Pressable>
					)}

					<View
						style={[
							styles.medicationList,
							medications.length > 3 && styles.medicationListWithToggle,
						]}
					>
						{visibleMedications.map((medication) => (
							<View key={medication.id} style={styles.medicationRow}>
								<View style={[styles.medicationBullet, { backgroundColor: colors.primary_base }]} />

								<View style={styles.medicationTextRow}>
									<ThemedText
										variant="subTitle2"
										colorName="primary_base"
										style={styles.medicationName}
									>
										{medication.name}
									</ThemedText>

									<ThemedText variant="subTitle2" colorName="secondary_base_0c">
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
									<Ionicons name="trash-outline" size={17} color={colors.primary_base} />
								</Pressable>
							</View>
						))}
					</View>
				</ThemedView>
			</View>

			<ThemedView
				variant="tag"
				colorName="tertiary_base_3"
				borderColor="primary_base"
				style={styles.actionTag}
				onPress={onAddPress}
				accessibilityRole="button"
			>
				<ThemedText
					tx="profile.addMedication"
					variant="subTitle2"
					colorName="primary_base"
					style={styles.tagText}
				/>

				<Ionicons name="add-outline" size={20} color={colors.primary_base} />
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
		paddingHorizontal: 12,
		paddingVertical: 10,
		position: "relative",
	},
	medicationToggle: {
		position: "absolute",
		left: 8,
		top: 7,
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 2,
	},
	medicationList: {
		width: "100%",
		gap: 8,
	},
	medicationListWithToggle: {
		paddingLeft: 20,
	},
	medicationRow: {
		minHeight: 22,
		flexDirection: "row",
		alignItems: "center",
	},
	medicationBullet: {
		width: 5,
		height: 5,
		borderRadius: 3,
		marginRight: 8,
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
		marginTop: 8,
		marginBottom: 12,
		borderWidth: 1,
	},
	tagText: {
		marginRight: 6,
	},
})
