import { useState } from "react"
import { Modal, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useTheme } from "@/context/ThemeContext"
import { DatePickerModal } from "@/src/components/DatePicker"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { formatDate } from "@/src/utils/dateTimeUtils"

import { COMPONENT_TYPES, ComponentType } from "../../constants/componentTypes"

import IconX from "@/assets/icons/x.svg"
import IconCheck from "@/assets/icons/check.svg"

export type ComponentFilters = {
	status: "all" | "active" | "historical"
	types: ComponentType[]
	assemblyFrom: Date | null
	assemblyTo: Date | null
	warranty: "all" | "endingSoon" | "expired" | "noDate"
}

export const DEFAULT_COMPONENT_FILTERS: ComponentFilters = {
	status: "all",
	types: [],
	assemblyFrom: null,
	assemblyTo: null,
	warranty: "all",
}

type DateFilterTarget = "assemblyFrom" | "assemblyTo"

interface ComponentFiltersModalProps {
	visible: boolean
	filters: ComponentFilters
	onClose: () => void
	onApply: (filters: ComponentFilters) => void
}

export function ComponentFiltersModal({
	visible,
	filters,
	onClose,
	onApply,
}: ComponentFiltersModalProps) {
	const insets = useSafeAreaInsets()
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [draftFilters, setDraftFilters] = useState<ComponentFilters>(() => ({
		...filters,
		types: [...filters.types],
	}))
	const [datePickerTarget, setDatePickerTarget] = useState<DateFilterTarget | null>(null)

	const toggleType = (type: ComponentType) => {
		setDraftFilters((current) => ({
			...current,
			types: current.types.includes(type)
				? current.types.filter((selectedType) => selectedType !== type)
				: [...current.types, type],
		}))
	}

	const renderChoice = (label: string, selected: boolean, onPress: () => void) => (
		<ThemedView
			key={label}
			onPress={onPress}
			style={styles.choice}
			colorName={selected ? "blue2" : "blue0"}
			accessibilityState={{ selected }}
		>
			{selected && <IconCheck color={colors.bg_0} width={14} height={14} />}
			<ThemedText variant="H4" colorName={selected ? "bg_0" : "blue2"} numberOfLines={1}>
				{label}
			</ThemedText>
		</ThemedView>
	)

	const datePickerValue = datePickerTarget
		? (draftFilters[datePickerTarget] ?? new Date())
		: undefined

	return (
		<>
			<Modal
				visible={visible && datePickerTarget === null}
				transparent
				animationType="slide"
				statusBarTranslucent
				onRequestClose={onClose}
			>
				<View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
					<ThemedView style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
					<View style={[styles.sheet, { backgroundColor: colors.bg_1 }]}>
						<View style={styles.sheetHeader}>
							<ThemedText tx="prosthesisDetails.filters.title" variant="H0" colorName="blue2" />
							<ThemedView onPress={onClose} hitSlop={10} accessibilityLabel={t("common.cancel")}>
								<IconX color={colors.false} width={26} height={26} />
							</ThemedView>
						</View>

						<ScrollView
							contentContainerStyle={styles.filterContent}
							showsVerticalScrollIndicator={false}
						>
							<ThemedText tx="prosthesisDetails.filters.category" variant="H1" colorName="blue2" />
							<View style={styles.choiceWrap}>
								{COMPONENT_TYPES.map((type) =>
									renderChoice(
										t(`prosthesisDetails.filters.types.${type}`),
										draftFilters.types.includes(type),
										() => toggleType(type)
									)
								)}
							</View>

							<ThemedText
								tx="prosthesisDetails.filters.assemblyDate"
								variant="H1"
								colorName="blue2"
							/>
							<View style={styles.dateFields}>
								{(["assemblyFrom", "assemblyTo"] as const).map((target) => {
									const selectedDate = draftFilters[target]
									const label = t(`prosthesisDetails.filters.${target}`)

									return (
										<View key={target} style={styles.dateField}>
											<ThemedView
												onPress={() => setDatePickerTarget(target)}
												style={styles.dateButton}
												borderColor="blue0"
											>
												<ThemedText variant="H5" colorName="blue2">
													{label}
												</ThemedText>
												<ThemedText variant="H3" colorName="blue2" numberOfLines={1}>
													{selectedDate
														? formatDate(selectedDate, "numeric")
														: t("prosthesisDetails.filters.chooseDate")}
												</ThemedText>
											</ThemedView>
											{selectedDate && (
												<ThemedView
													onPress={() =>
														setDraftFilters((current) => ({ ...current, [target]: null }))
													}
													accessibilityLabel={t("prosthesisDetails.filters.clearDate")}
													hitSlop={8}
													style={styles.circleX}
													colorName="false"
												>
													<IconX color={colors.bg_0} width={15} height={15} />
												</ThemedView>
											)}
										</View>
									)
								})}
							</View>

							<ThemedText tx="prosthesisDetails.filters.warranty" variant="H1" colorName="blue2" />
							<View style={styles.choiceWrap}>
								{(["all", "endingSoon", "expired", "noDate"] as const).map((warranty) =>
									renderChoice(
										t(`prosthesisDetails.filters.warrantyOptions.${warranty}`),
										draftFilters.warranty === warranty,
										() => setDraftFilters((current) => ({ ...current, warranty }))
									)
								)}
							</View>
						</ScrollView>

						<View style={styles.actions}>
							<ThemedView
								onPress={() => setDraftFilters({ ...DEFAULT_COMPONENT_FILTERS, types: [] })}
								style={styles.actionButton}
								borderColor="false"
							>
								<ThemedText colorName="false" tx="prosthesisDetails.filters.reset" variant="H3" />
							</ThemedView>
							<ThemedView onPress={onClose} style={styles.actionButton} borderColor="blue1">
								<ThemedText tx="common.cancel" variant="H3" colorName="graphite0" />
							</ThemedView>
							<ThemedView
								onPress={() => onApply(draftFilters)}
								style={styles.actionButton}
								colorName="blue2"
							>
								<ThemedText tx="prosthesisDetails.filters.apply" variant="H3" colorName="bg_0" />
							</ThemedView>
						</View>
					</View>
				</View>
			</Modal>
			<DatePickerModal
				visible={visible && datePickerTarget !== null}
				initialDate={datePickerValue}
				onClose={() => setDatePickerTarget(null)}
				onSave={(selectedDate) => {
					if (datePickerTarget) {
						setDraftFilters((current) => ({ ...current, [datePickerTarget]: selectedDate }))
					}
				}}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.35)",
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	sheet: {
		maxHeight: "88%",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
	},
	sheetHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingBottom: 14,
	},
	filterContent: {
		gap: 12,
		paddingBottom: 18,
	},
	choiceWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 4,
	},
	choice: {
		minHeight: 38,
		maxWidth: "100%",
		paddingHorizontal: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},
	dateFields: {
		flexDirection: "row",
		gap: 8,
	},
	dateField: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	dateButton: {
		flex: 1,
		minHeight: 58,
		paddingHorizontal: 10,
		paddingVertical: 7,
		justifyContent: "center",
		gap: 3,
	},
	circleX: {
		width: 20,
		height: 20,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	actions: {
		flexDirection: "row",
		gap: 8,
		paddingTop: 12,
	},
	actionButton: {
		flex: 1,
		minHeight: 44,
		paddingHorizontal: 8,
		alignItems: "center",
		justifyContent: "center",
	},
})
