import { useMemo, useState } from "react"
import { Modal, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import type { Component } from "@/db/repositories/componentRepository"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

const COMPONENT_TYPES = ["socket", "knee", "foot", "liner", "adapter", "other"] as const

type ComponentType = (typeof COMPONENT_TYPES)[number]
type ComponentStatus = "all" | "active" | "historical"

type ComponentsPanelProps = {
	components: Component[]
	onOpenComponent: (componentId: string) => void
}

export function ComponentsPanel({ components, onOpenComponent }: ComponentsPanelProps) {
	const { colors } = useTheme()
	const [expanded, setExpanded] = useState(true)
	const [filtersVisible, setFiltersVisible] = useState(false)
	const [addComponentVisible, setAddComponentVisible] = useState(false)
	const [status, setStatus] = useState<ComponentStatus>("active")
	const [type, setType] = useState<ComponentType | "all">("all")
	const [installedFrom, setInstalledFrom] = useState("")
	const [installedTo, setInstalledTo] = useState("")
	const [warrantyFrom, setWarrantyFrom] = useState("")
	const [warrantyTo, setWarrantyTo] = useState("")

	const filteredComponents = useMemo(
		() =>
			components.filter((component) => {
				const statusMatches =
					status === "all" ||
					(status === "active" && !component.deletedAt) ||
					(status === "historical" && !!component.deletedAt)

				return (
					statusMatches &&
					(type === "all" || component.type === type) &&
					isInRange(component.installedAt, installedFrom, installedTo) &&
					isInRange(component.warrantyUntil, warrantyFrom, warrantyTo)
				)
			}),
		[components, status, type, installedFrom, installedTo, warrantyFrom, warrantyTo]
	)

	return (
		<>
			<ThemedView
				colorName="secondary_base_3"
				style={[styles.componentsCard, { shadowColor: colors.primary_base }]}
			>
				<View style={styles.componentsHeader}>
					<ThemedView
						colorName="accent_base"
						onPress={() => setFiltersVisible(true)}
						style={[styles.filterButton, { borderColor: colors.primary_base_2 }]}
					>
						<Ionicons name="filter" size={18} color={colors.primary_base_2} />
					</ThemedView>

					<ThemedText
						tx="prosthesisDetails.components"
						variant="title"
						colorName="primary_base"
						style={styles.componentsTitle}
					/>

					<ThemedView
						colorName="secondary_base_3"
						onPress={() => setExpanded((value) => !value)}
						style={styles.headerChevronButton}
					>
						<Ionicons
							name={expanded ? "chevron-down" : "chevron-forward"}
							size={24}
							color={colors.primary_base}
						/>
					</ThemedView>
				</View>

				{expanded && (
					<>
						<ThemedView
							colorName="secondary_base_3"
							onPress={() => setAddComponentVisible(true)}
							style={styles.addComponentRow}
						>
							<View style={[styles.addCircle, { backgroundColor: colors.primary_base }]}>
								<Ionicons name="add" size={30} color={colors.accent_base} />
							</View>
							<ThemedText
								tx="prosthesisDetails.addComponent"
								variant="main1Button"
								colorName="primary_base"
								style={styles.addComponentText}
							/>
						</ThemedView>

						{filteredComponents.length === 0 ? (
							<View style={styles.emptyState}>
								<ThemedText
									tx={
										components.length > 0
											? "prosthesisDetails.noMatchingComponents"
											: "prosthesisDetails.noComponents"
									}
									variant="body1Regular"
									colorName="secondary_base_0c"
									style={styles.emptyText}
								/>
							</View>
						) : (
							<ScrollView
								style={styles.componentScroll}
								nestedScrollEnabled
								showsVerticalScrollIndicator={false}
							>
								{filteredComponents.map((component) => (
									<ComponentListItem
										key={component.id}
										component={component}
										onOpen={() => onOpenComponent(component.id)}
									/>
								))}
							</ScrollView>
						)}
					</>
				)}
			</ThemedView>

			<ComponentsFilterModal
				visible={filtersVisible}
				status={status}
				type={type}
				installedFrom={installedFrom}
				installedTo={installedTo}
				warrantyFrom={warrantyFrom}
				warrantyTo={warrantyTo}
				onStatusChange={setStatus}
				onTypeChange={setType}
				onInstalledFromChange={setInstalledFrom}
				onInstalledToChange={setInstalledTo}
				onWarrantyFromChange={setWarrantyFrom}
				onWarrantyToChange={setWarrantyTo}
				onClose={() => setFiltersVisible(false)}
			/>

			<AddComponentModal
				visible={addComponentVisible}
				onClose={() => setAddComponentVisible(false)}
			/>
		</>
	)
}

function ComponentListItem({ component, onOpen }: { component: Component; onOpen: () => void }) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const warning = isWarrantyWarning(component.warrantyUntil)

	return (
		<ThemedView colorName="tertiary_base_2" style={styles.componentItem} onPress={onOpen}>
			<View style={[styles.componentIcon, { backgroundColor: colors.primary_base }]}>
				<Ionicons name="body-outline" size={32} color={colors.accent_base} />
			</View>

			<View style={styles.componentContent}>
				<ThemedText
					variant="subTitle2"
					colorName="primary_base"
					style={styles.componentName}
					numberOfLines={1}
				>
					{(
						component.name || t(`prosthesisDetails.componentTypes.${component.type}` as any)
					).toUpperCase()}
				</ThemedText>
				<ThemedText
					variant="body1Regular"
					colorName="secondary_base_0c"
					style={styles.componentDescription}
					numberOfLines={2}
				>
					{component.manufacturer || component.model || component.type}
				</ThemedText>
				<ThemedText
					variant="body1Regular"
					colorName="secondary_base_0c"
					style={[styles.warranty, warning && { color: colors.warning }]}
					numberOfLines={1}
				>
					{t("prosthesisDetails.warranty")}: {formatDate(component.warrantyUntil)}
				</ThemedText>
			</View>

			<Ionicons
				name="chevron-forward"
				size={18}
				color={colors.primary_base}
				style={styles.componentChevron}
			/>
		</ThemedView>
	)
}

function ComponentsFilterModal({
	visible,
	status,
	type,
	installedFrom,
	installedTo,
	warrantyFrom,
	warrantyTo,
	onStatusChange,
	onTypeChange,
	onInstalledFromChange,
	onInstalledToChange,
	onWarrantyFromChange,
	onWarrantyToChange,
	onClose,
}: {
	visible: boolean
	status: ComponentStatus
	type: ComponentType | "all"
	installedFrom: string
	installedTo: string
	warrantyFrom: string
	warrantyTo: string
	onStatusChange: (value: ComponentStatus) => void
	onTypeChange: (value: ComponentType | "all") => void
	onInstalledFromChange: (value: string) => void
	onInstalledToChange: (value: string) => void
	onWarrantyFromChange: (value: string) => void
	onWarrantyToChange: (value: string) => void
	onClose: () => void
}) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.modalBackdrop}>
				<View
					pointerEvents="none"
					style={[styles.modalBackdropOverlay, { backgroundColor: colors.primary_base }]}
				/>
				<ThemedView colorName="tertiary_base_1" style={styles.filterModal}>
					<View style={styles.modalHeader}>
						<ThemedText tx="prosthesisDetails.filters" variant="title" colorName="primary_base" />
						<ThemedView colorName="tertiary_base_1" onPress={onClose}>
							<Ionicons name="close" size={26} color={colors.primary_base} />
						</ThemedView>
					</View>

					<ScrollView showsVerticalScrollIndicator={false}>
						<FilterLabel text={t("prosthesisDetails.status")} />
						<View style={styles.chips}>
							{(["all", "active", "historical"] as ComponentStatus[]).map((item) => (
								<FilterChip
									key={item}
									selected={status === item}
									label={t(`prosthesisDetails.${item}` as any)}
									onPress={() => onStatusChange(item)}
								/>
							))}
						</View>

						<FilterLabel text={t("prosthesisDetails.category")} />
						<View style={styles.chips}>
							<FilterChip
								selected={type === "all"}
								label={t("prosthesisDetails.all")}
								onPress={() => onTypeChange("all")}
							/>
							{COMPONENT_TYPES.map((item) => (
								<FilterChip
									key={item}
									selected={type === item}
									label={t(`prosthesisDetails.componentTypes.${item}` as any)}
									onPress={() => onTypeChange(item)}
								/>
							))}
						</View>

						<DateRange
							label={t("prosthesisDetails.installationDate")}
							from={installedFrom}
							to={installedTo}
							onFrom={onInstalledFromChange}
							onTo={onInstalledToChange}
						/>
						<DateRange
							label={t("prosthesisDetails.warrantyDate")}
							from={warrantyFrom}
							to={warrantyTo}
							onFrom={onWarrantyFromChange}
							onTo={onWarrantyToChange}
						/>
					</ScrollView>
				</ThemedView>
			</View>
		</Modal>
	)
}

function FilterLabel({ text }: { text: string }) {
	return (
		<ThemedText variant="subTitle2" colorName="primary_base" style={styles.filterLabel}>
			{text}
		</ThemedText>
	)
}

function FilterChip({
	label,
	selected,
	onPress,
}: {
	label: string
	selected: boolean
	onPress: () => void
}) {
	return (
		<ThemedView
			colorName={selected ? "primary_base" : "tertiary_base_3"}
			style={styles.chip}
			onPress={onPress}
		>
			<ThemedText variant="body1Regular" colorName={selected ? "accent_base" : "primary_base"}>
				{label}
			</ThemedText>
		</ThemedView>
	)
}

function DateRange({
	label,
	from,
	to,
	onFrom,
	onTo,
}: {
	label: string
	from: string
	to: string
	onFrom: (value: string) => void
	onTo: (value: string) => void
}) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	return (
		<View>
			<FilterLabel text={label} />
			<View style={styles.dateRow}>
				<TextInput
					value={from}
					onChangeText={onFrom}
					placeholder={t("prosthesisDetails.from")}
					placeholderTextColor={colors.secondary_base_0c}
					style={[
						styles.dateInput,
						{ color: colors.primary_base, borderColor: colors.secondary_base },
					]}
				/>
				<TextInput
					value={to}
					onChangeText={onTo}
					placeholder={t("prosthesisDetails.to")}
					placeholderTextColor={colors.secondary_base_0c}
					style={[
						styles.dateInput,
						{ color: colors.primary_base, borderColor: colors.secondary_base },
					]}
				/>
			</View>
		</View>
	)
}

function AddComponentModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
	const { colors } = useTheme()

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.modalBackdrop}>
				<View
					pointerEvents="none"
					style={[styles.modalBackdropOverlay, { backgroundColor: colors.primary_base }]}
				/>
				<ThemedView colorName="tertiary_base_1" style={styles.addModal}>
					<View style={styles.modalHeader}>
						<ThemedText
							tx="prosthesisDetails.addComponent"
							variant="title"
							colorName="primary_base"
						/>
						<ThemedView colorName="tertiary_base_1" onPress={onClose}>
							<Ionicons name="close" size={26} color={colors.primary_base} />
						</ThemedView>
					</View>
					<ThemedText
						tx="prosthesisDetails.addComponentQuestion"
						variant="body1Regular"
						colorName="secondary_base_0c"
					/>
					<View style={styles.addOptions}>
						<ThemedView colorName="tertiary_base_3" style={styles.addOption}>
							<Ionicons name="create-outline" size={26} color={colors.primary_base} />
							<ThemedText
								tx="prosthesisDetails.fromCreator"
								variant="body1Regular"
								colorName="primary_base"
							/>
						</ThemedView>
						<ThemedView colorName="tertiary_base_3" style={styles.addOption}>
							<Ionicons name="document-outline" size={26} color={colors.primary_base} />
							<ThemedText
								tx="prosthesisDetails.fromFile"
								variant="body1Regular"
								colorName="primary_base"
							/>
						</ThemedView>
					</View>
				</ThemedView>
			</View>
		</Modal>
	)
}

const isWarrantyWarning = (warrantyUntil: string | null) => {
	if (!warrantyUntil) return false

	const warrantyDate = new Date(warrantyUntil)
	if (Number.isNaN(warrantyDate.getTime())) return false

	const warningDate = new Date()
	warningDate.setHours(0, 0, 0, 0)
	warningDate.setDate(warningDate.getDate() + 30)

	return warrantyDate <= warningDate
}

const formatDate = (date: string | null | undefined) => {
	if (!date) return "-"

	const parsedDate = new Date(date)
	return Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString()
}

const isInRange = (value: string | null, from: string, to: string) => {
	if (!from && !to) return true
	if (!value) return false

	const date = value.slice(0, 10)
	return (!from || date >= from) && (!to || date <= to)
}

const styles = StyleSheet.create({
	componentsCard: {
		width: "83%",
		alignSelf: "center",
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingTop: 8,
		paddingBottom: 10,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.17,
		shadowRadius: 6,
		elevation: 4,
	},
	componentsHeader: {
		minHeight: 38,
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
	},
	filterButton: {
		width: 38,
		height: 38,
		borderRadius: 7,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 20,
	},
	componentsTitle: {
		fontFamily: "Roboto_500Medium",
		fontSize: 18,
		lineHeight: 20,
		letterSpacing: 0.04,
		textTransform: "uppercase",
	},
	headerChevronButton: {
		width: 34,
		height: 34,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: "auto",
	},
	addComponentRow: {
		minHeight: 43,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		marginTop: 16,
		marginBottom: 8,
		paddingHorizontal: 25,
	},
	addCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	addComponentText: {
		fontSize: 18,
		letterSpacing: 0.04,
	},
	componentScroll: {
		maxHeight: 220,
	},
	componentItem: {
		minHeight: 72,
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 5,
		paddingHorizontal: 5,
	},
	componentIcon: {
		width: 56,
		height: 56,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	componentContent: {
		flex: 1,
		minWidth: 0,
	},
	componentName: {
		fontSize: 10,
		lineHeight: 12,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
	componentDescription: {
		fontSize: 7,
		lineHeight: 9,
		marginTop: 1,
	},
	warranty: {
		fontSize: 7,
		lineHeight: 9,
		marginTop: 1,
	},
	componentChevron: {
		marginLeft: 5,
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
	},
	emptyText: {
		marginTop: 6,
		textAlign: "center",
	},
	modalBackdrop: {
		flex: 1,
		justifyContent: "center",
		padding: 20,
	},
	modalBackdropOverlay: {
		...StyleSheet.absoluteFill,
		opacity: 0.45,
	},
	filterModal: {
		maxHeight: "80%",
		borderRadius: 18,
		padding: 18,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	filterLabel: {
		marginTop: 14,
		marginBottom: 8,
	},
	chips: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	chip: {
		borderRadius: 18,
		paddingHorizontal: 12,
		paddingVertical: 7,
	},
	dateRow: {
		flexDirection: "row",
		gap: 10,
	},
	dateInput: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 9,
	},
	addModal: {
		borderRadius: 18,
		padding: 18,
	},
	addOptions: {
		flexDirection: "row",
		gap: 10,
		marginTop: 14,
	},
	addOption: {
		flex: 1,
		minHeight: 86,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},
})
