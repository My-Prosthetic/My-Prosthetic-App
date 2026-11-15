import { useMemo, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import type { ComponentWithRelations } from "@/db/repositories/componentRepository"
import {
	ComponentFiltersModal,
	DEFAULT_COMPONENT_FILTERS,
	type ComponentFilters,
} from "@/src/components/ComponentFiltersModal"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

type ComponentsPanelProps = {
	components: ComponentWithRelations[]
	onAddComponent: () => void
	onOpenComponent: (componentId: string) => void
}

export function ComponentsPanel({
	components,
	onOpenComponent,
	onAddComponent,
}: ComponentsPanelProps) {
	const { colors } = useTheme()
	const [expanded, setExpanded] = useState(true)
	const [filtersVisible, setFiltersVisible] = useState(false)
	const [filters, setFilters] = useState<ComponentFilters>(DEFAULT_COMPONENT_FILTERS)

	const filteredComponents = useMemo(() => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const endingSoon = new Date(today)
		endingSoon.setDate(endingSoon.getDate() + 30)
		endingSoon.setHours(23, 59, 59, 999)

		return components.filter((component) => {
			if (filters.status === "active" && component.isHistorical) return false
			if (filters.status === "historical" && !component.isHistorical) return false
			if (filters.types.length > 0 && !filters.types.includes(component.model.type)) return false

			const assemblyDate = component.assemblyDate ? Date.parse(component.assemblyDate) : NaN
			if (filters.assemblyFrom) {
				const from = new Date(filters.assemblyFrom)
				from.setHours(0, 0, 0, 0)
				if (!Number.isFinite(assemblyDate) || assemblyDate < from.getTime()) return false
			}
			if (filters.assemblyTo) {
				const to = new Date(filters.assemblyTo)
				to.setHours(23, 59, 59, 999)
				if (!Number.isFinite(assemblyDate) || assemblyDate > to.getTime()) return false
			}

			const warrantyDate = component.warrantyEndDate ? Date.parse(component.warrantyEndDate) : NaN
			const hasWarranty = Number.isFinite(warrantyDate)
			if (filters.warranty === "noDate" && hasWarranty) return false
			if (filters.warranty === "expired" && (!hasWarranty || warrantyDate >= today.getTime()))
				return false
			if (
				filters.warranty === "endingSoon" &&
				(!hasWarranty || warrantyDate < today.getTime() || warrantyDate > endingSoon.getTime())
			)
				return false
			return true
		})
	}, [components, filters])

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
							onPress={onAddComponent}
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
											? "prosthesisDetails.noFilterResults"
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

			{filtersVisible && (
				<ComponentFiltersModal
					visible
					filters={filters}
					onClose={() => setFiltersVisible(false)}
					onApply={(nextFilters) => {
						setFilters(nextFilters)
						setFiltersVisible(false)
					}}
				/>
			)}
		</>
	)
}

function ComponentListItem({
	component,
	onOpen,
}: {
	component: ComponentWithRelations
	onOpen: () => void
}) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const warning = isWarrantyWarning(component.warrantyEndDate)

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
					{t(`prosthesisDetails.filters.types.${component.model.type}` as any).toUpperCase()}
				</ThemedText>
				<ThemedText
					variant="body1Regular"
					colorName="secondary_base_0c"
					style={styles.componentDescription}
					numberOfLines={2}
				>
					{[component.model.brand.name, component.description || component.model.name]
						.filter(Boolean)
						.join(" | ")}
				</ThemedText>
				<ThemedText
					variant="body1Regular"
					colorName="secondary_base_0c"
					style={[styles.warranty, warning && { color: colors.warning }]}
					numberOfLines={1}
				>
					{t("prosthesisDetails.warranty")}: {formatDate(component.warrantyEndDate)}
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
})
