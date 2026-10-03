import React, { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { getProsthesisById } from "@/db/repositories/prosthesisRepository"
import type { Prosthesis } from "@/db/repositories/prosthesisRepository"
import { getComponentsByProsthesisId } from "@/db/repositories/componentRepository"
import type { Component } from "@/db/repositories/componentRepository"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import {
	ComponentFiltersModal,
	DEFAULT_COMPONENT_FILTERS,
	type ComponentFilters,
} from "@/src/components/ComponentFiltersModal"

const AMPUTATION_LEVEL_KEYS: Record<string, string> = {
	hemipelvectomy: "newProsthesis.amputationLevels.lower.hemipelvectomy",
	hip_disarticulation: "newProsthesis.amputationLevels.lower.hipDisarticulation",
	short_thigh: "newProsthesis.amputationLevels.lower.shortThigh",
	medium_thigh: "newProsthesis.amputationLevels.lower.mediumThigh",
	long_thigh: "newProsthesis.amputationLevels.lower.longThigh",
	knee_disarticulation: "newProsthesis.amputationLevels.lower.kneeDisarticulation",
	short_lower_leg: "newProsthesis.amputationLevels.lower.shortLowerLeg",
	medium_lower_leg: "newProsthesis.amputationLevels.lower.mediumLowerLeg",
	long_lower_leg: "newProsthesis.amputationLevels.lower.longLowerLeg",
	syme: "newProsthesis.amputationLevels.lower.syme",
	partial_foot: "newProsthesis.amputationLevels.lower.partialFoot",
	forequarter: "newProsthesis.amputationLevels.upper.forequarter",
	shoulder_disarticulation: "newProsthesis.amputationLevels.upper.shoulderDisarticulation",
	short_upper_arm: "newProsthesis.amputationLevels.upper.shortUpperArm",
	medium_upper_arm: "newProsthesis.amputationLevels.upper.mediumUpperArm",
	long_upper_arm: "newProsthesis.amputationLevels.upper.longUpperArm",
	elbow_disarticulation: "newProsthesis.amputationLevels.upper.elbowDisarticulation",
	short_forearm: "newProsthesis.amputationLevels.upper.shortForearm",
	medium_forearm: "newProsthesis.amputationLevels.upper.mediumForearm",
	long_forearm: "newProsthesis.amputationLevels.upper.longForearm",
	wrist_disarticulation: "newProsthesis.amputationLevels.upper.wristDisarticulation",
	partial_hand: "newProsthesis.amputationLevels.upper.partialHand",
}

export default function ProsthesisDetailsScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { t } = useTranslation()

	const { prosthesisId } = useLocalSearchParams<{
		prosthesisId: string
	}>()
	const hasValidProsthesisId = typeof prosthesisId === "string" && prosthesisId.length > 0

	const [prosthesis, setProsthesis] = useState<Prosthesis | null>(null)
	const [components, setComponents] = useState<Component[]>([])
	const [isLoading, setIsLoading] = useState(hasValidProsthesisId)
	const [areComponentsLoading, setAreComponentsLoading] = useState(hasValidProsthesisId)
	const [areComponentsExpanded, setAreComponentsExpanded] = useState(false)
	const [areFiltersVisible, setAreFiltersVisible] = useState(false)
	const [componentFilters, setComponentFilters] =
		useState<ComponentFilters>(DEFAULT_COMPONENT_FILTERS)

	useEffect(() => {
		let isActive = true

		if (!hasValidProsthesisId) {
			return () => {
				isActive = false
			}
		}

		void getProsthesisById(prosthesisId)
			.then((result) => {
				if (isActive) setProsthesis(result)
			})
			.catch((error) => {
				console.error("Failed to load prosthesis:", error)
				if (isActive) setProsthesis(null)
			})
			.finally(() => {
				if (isActive) setIsLoading(false)
			})

		void getComponentsByProsthesisId(prosthesisId)
			.then((result) => {
				if (isActive) setComponents(result)
			})
			.catch((error) => {
				console.error("Failed to load prosthesis components:", error)
				if (isActive) setComponents([])
			})
			.finally(() => {
				if (isActive) setAreComponentsLoading(false)
			})

		return () => {
			isActive = false
		}
		}, [hasValidProsthesisId, prosthesisId])

	const visibleComponents = useMemo(() => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const expiringSoonLimit = new Date(today)
		expiringSoonLimit.setDate(expiringSoonLimit.getDate() + 30)
		expiringSoonLimit.setHours(23, 59, 59, 999)

		return components.filter((component) => {
			if (componentFilters.status === "active" && component.isHistorical) return false
			if (componentFilters.status === "historical" && !component.isHistorical) return false
			if (componentFilters.types.length > 0 && !componentFilters.types.includes(component.type)) {
				return false
			}

			const assemblyTime = component.assemblyDate ? Date.parse(component.assemblyDate) : NaN
			if (componentFilters.assemblyFrom) {
				const from = new Date(componentFilters.assemblyFrom)
				from.setHours(0, 0, 0, 0)
				if (!Number.isFinite(assemblyTime) || assemblyTime < from.getTime()) return false
			}
			if (componentFilters.assemblyTo) {
				const to = new Date(componentFilters.assemblyTo)
				to.setHours(23, 59, 59, 999)
				if (!Number.isFinite(assemblyTime) || assemblyTime > to.getTime()) return false
			}

			const warrantyTime = component.warrantyEndDate
				? Date.parse(component.warrantyEndDate)
				: NaN
			const hasWarrantyDate = Number.isFinite(warrantyTime)
			if (componentFilters.warranty === "noDate" && hasWarrantyDate) return false
			if (componentFilters.warranty === "expired" && (!hasWarrantyDate || warrantyTime >= today.getTime())) {
				return false
			}
			if (
				componentFilters.warranty === "endingSoon" &&
				(!hasWarrantyDate ||
					warrantyTime < today.getTime() ||
					warrantyTime > expiringSoonLimit.getTime())
			) {
				return false
			}

			return true
		})
	}, [componentFilters, components])

	const handleOnFiltersPress = () => setAreFiltersVisible(true)

	const handleApplyFilters = (filters: ComponentFilters) => {
		setComponentFilters(filters)
		setAreFiltersVisible(false)
	}

	const amputationLevelKey = prosthesis
		? AMPUTATION_LEVEL_KEYS[prosthesis.amputationLevel]
		: undefined

	const amputationLevelLabel = prosthesis
		? amputationLevelKey
			? t(amputationLevelKey as any)
			: prosthesis.amputationLevel
		: ""

	return (
		<ThemedView colorName="tertiary_base_1" variant="background">
			<ThemedHeader tx="prosthesisDetails.title" variant="transparent" onBack={()=>router.back()}/>
			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={colors.primary_base} />
				</View>
			) : !prosthesis ? (
				<View style={styles.centered}>
					<ThemedText
						tx="prosthesisDetails.notFound"
						variant="subTitle2"
						colorName="primary_base"
					/>
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<ThemedView colorName="primary_base" style={styles.iconCard}>
						<Ionicons name="body-outline" size={64} color={colors.accent_base} />
					</ThemedView>

					<ThemedText variant="title" colorName="primary_base" style={styles.name}>
						{prosthesis.name}
					</ThemedText>

					<ThemedView
						colorName="tertiary_base_3"
						borderColor="secondary_base_0c"
						style={styles.infoCard}
					>
						<InfoRow
							label={t("prosthesisDetails.side")}
							value={
								prosthesis.side === "left" ? t("newProsthesis.left") : t("newProsthesis.right")
							}
						/>

						<InfoRow
							label={t("prosthesisDetails.limb")}
							value={
								prosthesis.limbType === "upper"
									? t("newProsthesis.upper")
									: t("newProsthesis.lower")
							}
						/>

						<InfoRow
							label={t("prosthesisDetails.amputationLevel")}
							value={amputationLevelLabel}
							isLast
						/>
					</ThemedView>

					<ThemedView
						colorName="secondary_base_3"
                        borderColor="primary_base"
						style={styles.componentsSection}
					>
						<ThemedView
							colorName="secondary_base_3"
							variant="wide"
							style={styles.componentsHeader}
							onPress={() => setAreComponentsExpanded((expanded) => !expanded)}
							accessibilityRole="button"
							accessibilityState={{ expanded: areComponentsExpanded }}
						>
							<Pressable
								style={[
									styles.filterIconBox,
									{
										backgroundColor: colors.accent_base_1,
										borderColor: colors.primary_base_2,
									},
								]}
								onPress={(event) => {
									event.stopPropagation()
									handleOnFiltersPress()
								}}
								accessibilityRole="button"
								accessibilityLabel={t("prosthesisDetails.filters.title")}
							>
								<Ionicons name="filter-outline" size={25} color={colors.primary_base_1} />
							</Pressable>
							<ThemedText
								tx="prosthesisDetails.components"
								variant="main1Button"
								colorName="primary_base"
								style={styles.componentsHeaderText}
							/>
							<Ionicons
								name={areComponentsExpanded ? "chevron-up" : "chevron-down"}
								size={28}
								color={colors.primary_base}
							/>
						</ThemedView>

						{areComponentsExpanded && (
							<View style={styles.componentsContent}>
								<ThemedView
									colorName="primary_base"
									variant="wide"
									style={styles.addComponentButton}
									onPress={() =>
										router.push(`/prosthesis/${prosthesisId}/components/new`)
									}
									accessibilityRole="button"
								>
									<Ionicons name="add-circle" size={38} color={colors.accent_base} />
									<ThemedText
										tx="prosthesisDetails.addComponent"
										variant="main1Button"
										colorName="accent_base"
										style={styles.addComponentText}
									/>
								</ThemedView>

								{areComponentsLoading ? (
									<View style={styles.componentsMessage}>
										<ActivityIndicator size="small" color={colors.primary_base} />
										<ThemedText
											tx="prosthesisDetails.loadingComponents"
											variant="body1Regular"
											colorName="primary_base"
										/>
									</View>
								) : components.length === 0 ? (
									<ThemedText
										tx="prosthesisDetails.noComponents"
										variant="body1Regular"
										colorName="primary_base_1"
										style={styles.componentsEmpty}
									/>
								) : visibleComponents.length === 0 ? (
									<ThemedText
										tx="prosthesisDetails.noFilterResults"
										variant="body1Regular"
										colorName="primary_base_1"
										style={styles.componentsEmpty}
									/>
								) : (
						<ScrollView
							style={styles.componentListViewport}
							contentContainerStyle={styles.componentList}
							nestedScrollEnabled
							showsVerticalScrollIndicator
						>
										{visibleComponents.map((component) => {
											const title = component.model?.trim() || component.type
											const description =
												[component.brand, component.description].filter(Boolean).join(" | ") ||
												component.type

											return (
											<ThemedView
												key={component.id}
												colorName="secondary_base_3"
												style={styles.componentRow}
												accessibilityRole="button"
											>
												<View
													style={[styles.componentIconBox, { backgroundColor: colors.primary_base }]}
												>
													<Image
                                                        source={require("@/assets/mp_logo_accent.png")}
                                                        style={styles.logoImage}
                                                        resizeMode="contain"
                                                    />
												</View>
												<View style={styles.componentCopy}>
													<ThemedText
														variant="tab1Category"
														colorName="primary_base"
														numberOfLines={1}
														ellipsizeMode="tail"
													>
														{title}
													</ThemedText>
													<ThemedText
														variant="body1Regular"
														colorName="primary_base"
														numberOfLines={2}
													>
														{description}
													</ThemedText>
												</View>
												<View style={styles.componentChevronSlot}>
													<Ionicons
														name="chevron-forward"
														size={26}
														color={colors.primary_base}
													/>
												</View>
											</ThemedView>
										)
									})}
								</ScrollView>
								)}
							</View>
						)}
					</ThemedView>
				</ScrollView>
			)}
			{areFiltersVisible && (
				<ComponentFiltersModal
					visible
					filters={componentFilters}
					onClose={() => setAreFiltersVisible(false)}
					onApply={handleApplyFilters}
				/>
			)}
		</ThemedView>
	)
}

interface InfoRowProps {
	label: string
	value: string
	isLast?: boolean
}

function InfoRow({ label, value, isLast = false }: InfoRowProps) {
	return (
		<View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
			<ThemedText variant="subTitle2" colorName="secondary_base_0c" style={styles.infoLabel}>
				{label}
			</ThemedText>

			<ThemedText variant="body1Regular" colorName="primary_base" style={styles.infoValue}>
				{value}
			</ThemedText>
		</View>
	)
}

const styles = StyleSheet.create({

	logoImage: {
		width: "80%",
		height: "80%",
	},

	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},

	content: {
		paddingTop: 28,
		paddingBottom: 48,
		alignItems: "center",
	},

	iconCard: {
		width: 120,
		height: 120,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",

		shadowColor: "#052D8F",
		shadowOffset: {
			width: 0,
			height: 3,
		},
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
	},

	name: {
		marginTop: 20,
		marginBottom: 20,
		textAlign: "center",
	},

	infoCard: {
		width: "100%",
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 16,
	},

	infoRow: {
		paddingVertical: 16,
	},

	infoRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: "#CBD5E1",
	},

	infoLabel: {
		marginBottom: 4,
	},

	infoValue: {
		fontSize: 15,
	},

	componentsSection: {
		width: "100%",
		marginTop: 22,
		padding: 16,
		borderRadius: 24,
        borderWidth: 1
	},

	componentsHeader: {
		minHeight: 58,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},

	filterIconBox: {
		width: 48,
		height: 48,
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
        flex: 0
	},

	componentsHeaderText: {
		flex: 1,
		textAlign: "left",
	},

	componentsContent: {
		marginTop: 18,
		gap: 14,
	},

	addComponentButton: {
		minHeight: 64,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: 12,
	},

	addComponentText: {
		flex: 1,
		textAlign: "left",
	},

	componentsMessage: {
		minHeight: 76,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},

	componentsEmpty: {
		paddingHorizontal: 12,
		paddingVertical: 22,
		textAlign: "center",
	},

	componentListViewport: {
		height: 360,
		flexGrow: 0,
	},

	componentList: {
		gap: 8,
	},

	componentRow: {
		width: "100%",
		height: 84,
		paddingVertical: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},

	componentCopy: {
		flex: 1,
		minWidth: 0,
	},

	componentChevronSlot: {
		width: 26,
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "center",
	},

	componentIconBox: {
		width: 60,
		height: 60,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
})
