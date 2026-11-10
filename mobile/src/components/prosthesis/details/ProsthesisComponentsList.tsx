import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import type { ComponentWithRelations } from "@/db/repositories/componentRepository"
import {
	ComponentFiltersModal,
	DEFAULT_COMPONENT_FILTERS,
	type ComponentFilters,
} from "@/src/components/ComponentFiltersModal"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import ThemedSearch from "@/src/components/ThemedSearch"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { filterComponents } from "@/src/utils/filterComponents"
import { formatDate } from "@/src/utils/dateTimeUtils"

import IconGear from "@/assets/icons/gear.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconSliders from "@/assets/icons/sliders.svg"
import IconChevronLeft from "@/assets/icons/chevron-left.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"

export const COMPONENTS_PAGE_SIZE = 3

type ProsthesisComponentsListProps = {
	components: ComponentWithRelations[]
	onAddComponent: () => void
	onOpenComponent: (componentId: string) => void
}

export function ProsthesisComponentsList({
	components,
	onAddComponent,
	onOpenComponent,
}: ProsthesisComponentsListProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const [showActive, setShowActive] = useState(true)
	const [showHistorical, setShowHistorical] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [filtersVisible, setFiltersVisible] = useState(false)
	const [filters, setFilters] = useState<ComponentFilters>(DEFAULT_COMPONENT_FILTERS)
	const [pageState, setPageState] = useState({ filterKey: "", page: 1 })

	const visibleComponents = useMemo(() => {
		const query = searchQuery.trim().toLocaleLowerCase()
		const statusFiltered = components.filter(
			(component) =>
				(component.isHistorical ? showHistorical : showActive) &&
				`${component.model.name} ${component.model.brand.name} ${component.model.type} ${component.description ?? ""}`
					.toLocaleLowerCase()
					.includes(query)
		)
		return filterComponents(statusFiltered, { ...filters, status: "all" })
	}, [components, filters, searchQuery, showActive, showHistorical])
	const filterKey = useMemo(() => visibleComponents.map((c) => c.id).join(","), [visibleComponents])
	const currentPage = pageState.filterKey === filterKey ? pageState.page : 1
	const totalPages = Math.max(1, Math.ceil(visibleComponents.length / COMPONENTS_PAGE_SIZE))
	const page = Math.min(currentPage, totalPages)
	const paginatedComponents = visibleComponents.slice(
		(page - 1) * COMPONENTS_PAGE_SIZE,
		page * COMPONENTS_PAGE_SIZE
	)
	const goToPage = (nextPage: number) => setPageState({ filterKey, page: nextPage })
	const hasPreviousPage = page > 1
	const hasNextPage = page < totalPages

	return (
		<>
			<ThemedText
				tx="prosthesisDetails.components"
				variant="H3"
				colorName="blue2"
				style={styles.title}
			/>

			<ThemedSearch
				value={searchQuery}
				onChangeText={setSearchQuery}
				placeholder={t("prosthesisDetails.searchComponents")}
			/>

			<View style={styles.filtersRow}>
				<ThemedCheckbox
					label={t("prosthesisDetails.activeFilter")}
					checked={showActive}
					onPress={() => setShowActive((visible) => !visible)}
				/>
				<ThemedCheckbox
					label={t("prosthesisDetails.historicalFilter")}
					checked={showHistorical}
					onPress={() => setShowHistorical((visible) => !visible)}
				/>
				<ThemedView
					style={styles.filtersRowElement}
					onPress={() => setFiltersVisible(true)}
					accessibilityRole="button"
					accessibilityLabel={t("prosthesisDetails.filter")}
				>
					<ThemedText tx="prosthesisDetails.filter" variant="H2" colorName="blue1" />
					<IconSliders color={colors.blue1} width={24} height={24} />
				</ThemedView>
			</View>

			<ThemedView
				variant="wide"
				colorName="blue2"
				onPress={onAddComponent}
				style={styles.addButton}
				centerChild={
					<ThemedText
						tx="prosthesisDetails.addComponent"
						variant="H1"
						colorName="bg_0"
						style={styles.addButtonText}
					/>
				}
				rightChild={<IconPlus color={colors.bg_0} width={20} height={20} />}
			/>

			<View style={styles.componentsList}>
				{paginatedComponents.length ? (
					paginatedComponents.map((component) => (
						<ComponentCard
							key={component.id}
							component={component}
							onOpen={() => onOpenComponent(component.id)}
						/>
					))
				) : (
					<ThemedText
						tx={
							components.length
								? "prosthesisDetails.noFilterResults"
								: "prosthesisDetails.noComponents"
						}
						variant="H2"
						colorName="blue2"
						style={styles.emptyState}
					/>
				)}
			</View>

			{visibleComponents.length > COMPONENTS_PAGE_SIZE && (
				<View style={styles.paginationRow}>
					<ThemedView
						onPress={() => {
							if (hasPreviousPage) goToPage(page - 1)
						}}
						style={[styles.pageButton, !hasPreviousPage && styles.pageButtonDisabled]}
						accessibilityRole="button"
						accessibilityState={{ disabled: !hasPreviousPage }}
					>
						<IconChevronLeft color={colors.blue1} width={20} height={20} />
					</ThemedView>
					<ThemedText variant="H3" colorName="blue2">
						{`${page}/${totalPages}`}
					</ThemedText>
					<ThemedView
						onPress={() => {
							if (hasNextPage) goToPage(page + 1)
						}}
						style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
						accessibilityRole="button"
						accessibilityState={{ disabled: !hasNextPage }}
					>
						<IconChevronRight color={colors.blue1} width={20} height={20} />
					</ThemedView>
				</View>
			)}

			{filtersVisible && (
				<ComponentFiltersModal
					visible
					filters={filters}
					onClose={() => setFiltersVisible(false)}
					onApply={(nextFilters) => {
						setFilters(nextFilters)
						setShowActive(nextFilters.status !== "historical")
						setShowHistorical(nextFilters.status !== "active")
						setFiltersVisible(false)
					}}
				/>
			)}
		</>
	)
}

function ComponentCard({
	component,
	onOpen,
}: {
	component: ComponentWithRelations
	onOpen: () => void
}) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	return (
		<ThemedView
			colorName={component.isHistorical ? "bg_1" : "bg_0"}
			borderColor={component.isHistorical ? "blue0" : "blue1"}
			style={styles.componentCard}
		>
			<View style={styles.componentCardHeader}>
				<ThemedView
					colorName={component.isHistorical ? "blue0" : "blue1"}
					style={styles.componentIconCircle}
				>
					<IconGear
						width={28}
						height={28}
						color={component.isHistorical ? colors.blue1 : colors.bg_0}
					/>
				</ThemedView>
				<View style={styles.componentMainInfo}>
					<ThemedText variant="H3" colorName="blue2">
						{t(`prosthesisDetails.filters.types.${component.model.type}` as any)}
					</ThemedText>
					{component.model.brand.name ? (
						<ThemedText variant="H4" colorName="blue2">
							{component.model.brand.name}
						</ThemedText>
					) : null}
					{component.model.name ? (
						<ThemedText variant="H4" colorName="blue2">
							{component.model.name}
						</ThemedText>
					) : null}
					<View style={styles.warrantyRow}>
						<ThemedText variant="H4" colorName="blue2">
							{t("prosthesisDetails.warranty")}:
						</ThemedText>
						<ThemedText variant="H2" colorName="blue2">
							{component.warrantyEndDate ? formatDate(component.warrantyEndDate) : " -"}
						</ThemedText>
					</View>
				</View>
				<ThemedView
					colorName="blue2"
					onPress={onOpen}
					variant="tag"
					accessibilityLabel={t("prosthesisDetails.moreDetails")}
					style={{ paddingHorizontal: 10 }}
				>
					<ThemedText tx="prosthesisDetails.moreDetails" variant="H5" colorName="bg_0" />
				</ThemedView>
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	title: {
		marginBottom: 12,
		alignSelf: "flex-start",
	},
	filtersRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		marginVertical: 8,
	},
	filtersRowElement: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	addButton: {
		borderRadius: 20,
		height: 50,
		marginVertical: 16,
	},
	addButtonText: {
		alignSelf: "center",
	},
	componentsList: {
		gap: 12,
		width: "100%",
	},
	paginationRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 20,
		marginTop: 20,
	},
	pageButton: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	pageButtonDisabled: {
		opacity: 0.3,
	},
	emptyState: {
		textAlign: "center",
		padding: 16,
	},
	componentCard: {
		padding: 14,
	},
	componentCardHeader: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	componentIconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	componentMainInfo: {
		flex: 1,
	},
	warrantyRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
})
