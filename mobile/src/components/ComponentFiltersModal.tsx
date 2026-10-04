import { useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { Component } from "@/db/repositories/componentRepository"
import { useTheme } from "@/context/ThemeContext"
import { DatePickerModal } from "@/src/components/DatePicker"
import { ThemedText } from "@/src/components/ThemedText"
import { formatDate } from "@/src/utils/dateFormatter"

import { COMPONENT_TYPES, ComponentType } from "../constants/componentTypes"

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
		<Pressable
			key={label}
			onPress={onPress}
			style={[
				styles.choice,
				{
					backgroundColor: selected ? colors.primary_base : colors.tertiary_base_1,
					borderColor: selected ? colors.primary_base : colors.primary_base_3,
				},
			]}
			accessibilityRole="button"
			accessibilityState={{ selected }}
		>
			{selected && <Ionicons name="checkmark" size={16} color={colors.accent_base} />}
			<ThemedText
				variant="subTitle2"
				colorName={selected ? "accent_base" : "primary_base"}
				numberOfLines={1}
			>
				{label}
			</ThemedText>
		</Pressable>
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
					<Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
					<View style={[styles.sheet, { backgroundColor: colors.tertiary_base_3 }]}>
						<View style={styles.sheetHeader}>
							<ThemedText
								tx="prosthesisDetails.filters.title"
								variant="subTitle1"
								colorName="primary_base"
							/>
							<Pressable onPress={onClose} hitSlop={10} accessibilityLabel={t("common.cancel")}>
								<Ionicons name="close" size={26} color={colors.primary_base} />
							</Pressable>
						</View>

						<ScrollView
							contentContainerStyle={styles.filterContent}
							showsVerticalScrollIndicator={false}
						>
							<ThemedText tx="prosthesisDetails.filters.status" variant="tab1Category" />
							<View style={styles.choiceWrap}>
								{(["all", "active", "historical"] as const).map((status) =>
									renderChoice(
										t(`prosthesisDetails.filters.${status}`),
										draftFilters.status === status,
										() => setDraftFilters((current) => ({ ...current, status }))
									)
								)}
							</View>

							<ThemedText tx="prosthesisDetails.filters.category" variant="tab1Category" />
							<View style={styles.choiceWrap}>
								{COMPONENT_TYPES.map((type) =>
									renderChoice(
										t(`prosthesisDetails.filters.types.${type}`),
										draftFilters.types.includes(type),
										() => toggleType(type)
									)
								)}
							</View>

							<ThemedText tx="prosthesisDetails.filters.assemblyDate" variant="tab1Category" />
							<View style={styles.dateFields}>
								{(["assemblyFrom", "assemblyTo"] as const).map((target) => {
									const selectedDate = draftFilters[target]
									const label = t(`prosthesisDetails.filters.${target}`)

									return (
										<View key={target} style={styles.dateField}>
											<Pressable
												onPress={() => setDatePickerTarget(target)}
												style={[styles.dateButton, { borderColor: colors.primary_base_3 }]}
											>
												<ThemedText variant="subTitle2" colorName="secondary_base_0c">
													{label}
												</ThemedText>
												<ThemedText
													variant="body1Regular"
													colorName="primary_base"
													numberOfLines={1}
												>
													{selectedDate
														? formatDate(selectedDate, "numeric")
														: t("prosthesisDetails.filters.chooseDate")}
												</ThemedText>
											</Pressable>
											{selectedDate && (
												<Pressable
													onPress={() =>
														setDraftFilters((current) => ({ ...current, [target]: null }))
													}
													accessibilityLabel={t("prosthesisDetails.filters.clearDate")}
													hitSlop={8}
												>
													<Ionicons name="close-circle" size={20} color={colors.primary_base_2} />
												</Pressable>
											)}
										</View>
									)
								})}
							</View>

							<ThemedText tx="prosthesisDetails.filters.warranty" variant="tab1Category" />
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
							<Pressable
								onPress={() => setDraftFilters({ ...DEFAULT_COMPONENT_FILTERS, types: [] })}
								style={[styles.actionButton, { borderColor: colors.primary_base }]}
							>
								<ThemedText tx="prosthesisDetails.filters.reset" variant="subTitle2" />
							</Pressable>
							<Pressable
								onPress={onClose}
								style={[styles.actionButton, { borderColor: colors.primary_base_2 }]}
							>
								<ThemedText tx="common.cancel" variant="subTitle2" />
							</Pressable>
							<Pressable
								onPress={() => onApply(draftFilters)}
								style={[styles.actionButton, { backgroundColor: colors.primary_base }]}
							>
								<ThemedText
									tx="prosthesisDetails.filters.apply"
									variant="subTitle2"
									colorName="accent_base"
								/>
							</Pressable>
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
		borderWidth: 1,
		borderRadius: 12,
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
		minWidth: 0,
		minHeight: 58,
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderWidth: 1,
		borderRadius: 12,
		justifyContent: "center",
		gap: 3,
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
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
})
