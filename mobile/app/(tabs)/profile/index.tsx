import React, { useEffect, useMemo, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import {
	addMedicalCondition,
	addMedicalMedication,
	getMedicalProfileData,
	updateMedicalKLevel,
} from "@/db/repositories/medicalProfileRepository"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

type KLevelId = "K0" | "K1" | "K2" | "K3" | "K4"

type KLevel = {
	id: KLevelId
	labelKey:
		| "profile.kLevels.K0.label"
		| "profile.kLevels.K1.label"
		| "profile.kLevels.K2.label"
		| "profile.kLevels.K3.label"
		| "profile.kLevels.K4.label"
	descriptionKey:
		| "profile.kLevels.K0.description"
		| "profile.kLevels.K1.description"
		| "profile.kLevels.K2.description"
		| "profile.kLevels.K3.description"
		| "profile.kLevels.K4.description"
}

type Medication = {
	id: string
	name: string
	usage: string
}

type ConditionType = "condition" | "allergy"
type AddMode = "condition" | "medication" | null

const K_LEVELS: KLevel[] = [
	{
		id: "K0",
		labelKey: "profile.kLevels.K0.label",
		descriptionKey: "profile.kLevels.K0.description",
	},
	{
		id: "K1",
		labelKey: "profile.kLevels.K1.label",
		descriptionKey: "profile.kLevels.K1.description",
	},
	{
		id: "K2",
		labelKey: "profile.kLevels.K2.label",
		descriptionKey: "profile.kLevels.K2.description",
	},
	{
		id: "K3",
		labelKey: "profile.kLevels.K3.label",
		descriptionKey: "profile.kLevels.K3.description",
	},
	{
		id: "K4",
		labelKey: "profile.kLevels.K4.label",
		descriptionKey: "profile.kLevels.K4.description",
	},
]

export default function ProfileScreen() {
	const { colors } = useTheme()
	const router = useRouter()
	const { t } = useTranslation()

	const [selectedKLevel, setSelectedKLevel] = useState<KLevelId | null>(null)
	const [isKLevelOpen, setIsKLevelOpen] = useState(false)

	const [conditions, setConditions] = useState<string[]>([])
	const [areConditionsExpanded, setAreConditionsExpanded] = useState(false)

	const [medications, setMedications] = useState<Medication[]>([])
	const [areMedicationsExpanded, setAreMedicationsExpanded] = useState(false)

	const [addMode, setAddMode] = useState<AddMode>(null)
	const [conditionName, setConditionName] = useState("")
	const [conditionType, setConditionType] = useState<ConditionType>("condition")
	const [medicationName, setMedicationName] = useState("")
	const [medicationUsage, setMedicationUsage] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		let mounted = true

		const loadMedicalProfile = async () => {
			try {
				const result = await getMedicalProfileData()

				if (!mounted) {
					return
				}

				setSelectedKLevel(result.profile.kLevel)
				setConditions(result.conditions.map((condition) => condition.name))
				setMedications(
					result.medications.map((medication) => ({
						id: medication.id,
						name: medication.name,
						usage: medication.usage,
					}))
				)
			} catch (error) {
				console.error("Failed to load medical profile:", error)
			}
		}

		void loadMedicalProfile()

		return () => {
			mounted = false
		}
	}, [])

	const selectedKLevelData = useMemo(
		() => (selectedKLevel ? (K_LEVELS.find((level) => level.id === selectedKLevel) ?? null) : null),
		[selectedKLevel]
	)

	const visibleConditions = areConditionsExpanded ? conditions : conditions.slice(0, 3)
	const hiddenConditionsCount = Math.max(conditions.length - 3, 0)

	const visibleMedications = areMedicationsExpanded ? medications : medications.slice(0, 3)

	const closeExpandableSections = () => {
		setIsKLevelOpen(false)
		setAreConditionsExpanded(false)
	}

	const handleConditionCopy = async (condition: string) => {
		setIsKLevelOpen(false)
		await Clipboard.setStringAsync(condition)
	}

	const closeAddModal = () => {
		setAddMode(null)
		setConditionName("")
		setConditionType("condition")
		setMedicationName("")
		setMedicationUsage("")
	}

	const handleAddCondition = async () => {
		const name = conditionName.trim()

		if (!name || isSaving) {
			return
		}

		try {
			setIsSaving(true)
			const savedCondition = await addMedicalCondition({
				name,
				type: conditionType,
			})

			setConditions((current) => [...current, savedCondition.name])
			closeAddModal()
		} catch (error) {
			console.error("Failed to save medical condition:", error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleAddMedication = async () => {
		const name = medicationName.trim()
		const usage = medicationUsage.trim()

		if (!name || !usage || isSaving) {
			return
		}

		try {
			setIsSaving(true)
			const savedMedication = await addMedicalMedication({
				name,
				usage,
			})

			setMedications((current) => [
				...current,
				{
					id: savedMedication.id,
					name: savedMedication.name,
					usage: savedMedication.usage,
				},
			])
			closeAddModal()
		} catch (error) {
			console.error("Failed to save medication:", error)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<ThemedView colorName="tertiary_base_2" style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				onScrollBeginDrag={closeExpandableSections}
			>
				<Pressable onPress={closeExpandableSections}>
					{/* Header */}
					<ThemedView colorName="primary_base" style={styles.topHeader}>
						<ThemedView
							colorName="primary_base"
							style={styles.backButton}
							onPress={() => router.back()}
							accessibilityRole="button"
						>
							<Ionicons name="chevron-back" size={26} color={colors.accent_base} />
						</ThemedView>

						<ThemedText
							tx="profile.title"
							variant="title"
							colorName="accent_base"
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.8}
						/>
					</ThemedView>

					{/* K-Levels */}
					<View style={[styles.section, styles.firstSection]}>
						<ThemedText
							tx="profile.activity"
							variant="tab1Category"
							colorName="secondary_base_0c"
							accessibilityRole="header"
							style={styles.sectionTitle}
						/>

						<Pressable
							onPress={(event) => {
								event.stopPropagation()
								setAreConditionsExpanded(false)
								setIsKLevelOpen((current) => !current)
							}}
							accessibilityRole="button"
							accessibilityState={{ expanded: isKLevelOpen }}
						>
							<ThemedView
								variant="wide"
								colorName="tertiary_base_3"
								style={styles.activityDropdown}
							>
								<View style={styles.dropdownTextContainer}>
									<ThemedText
										variant="subTitle1"
										colorName="primary_base"
										style={styles.kLevelLabel}
									>
										{selectedKLevelData
											? t(selectedKLevelData.labelKey)
											: t("profile.selectActivityLevel")}
									</ThemedText>

									{selectedKLevelData && (
										<ThemedText
											variant="subTitle2"
											colorName="secondary_base_0c"
											style={styles.kLevelDescription}
											numberOfLines={1}
										>
											{t(selectedKLevelData.descriptionKey)}
										</ThemedText>
									)}
								</View>

								<Ionicons
									name={isKLevelOpen ? "chevron-up" : "chevron-down"}
									size={22}
									color={colors.primary_base}
								/>
							</ThemedView>
						</Pressable>

						{isKLevelOpen && (
							<Pressable
								onPress={(event) => event.stopPropagation()}
								style={styles.dropdownMenuWrapper}
							>
								<ThemedView colorName="tertiary_base_3" style={styles.dropdownMenu}>
									{K_LEVELS.map((level, index) => {
										const isSelected = level.id === selectedKLevel

										return (
											<Pressable
												key={level.id}
												onPress={async (event) => {
													event.stopPropagation()

													try {
														await updateMedicalKLevel(level.id)
														setSelectedKLevel(level.id)
														setIsKLevelOpen(false)
													} catch (error) {
														console.error("Failed to save K-Level:", error)
													}
												}}
												style={[
													styles.dropdownOption,
													index !== K_LEVELS.length - 1 && styles.dropdownOptionBorder,
												]}
												accessibilityRole="button"
												accessibilityState={{ selected: isSelected }}
											>
												<View style={styles.dropdownOptionText}>
													<ThemedText
														variant="subTitle1"
														colorName="primary_base"
														style={[
															styles.dropdownOptionLabel,
															isSelected && styles.selectedOptionText,
														]}
													>
														{t(level.labelKey)}
													</ThemedText>

													<ThemedText
														variant="subTitle2"
														colorName="secondary_base_0c"
														style={styles.dropdownOptionDescription}
														numberOfLines={2}
													>
														{t(level.descriptionKey)}
													</ThemedText>
												</View>

												{isSelected && (
													<Ionicons name="checkmark" size={20} color={colors.primary_base} />
												)}
											</Pressable>
										)
									})}
								</ThemedView>
							</Pressable>
						)}
					</View>

					{/* Schorzenia i alergie */}
					<View style={styles.section}>
						<ThemedText
							tx="profile.diseases"
							variant="tab1Category"
							colorName="secondary_base_0c"
							accessibilityRole="header"
							style={styles.sectionTitle}
						/>

						<View style={styles.conditionsArea}>
							<View style={styles.tagsContainer}>
								{visibleConditions.map((condition) => (
									<Pressable
										key={condition}
										onPress={async (event) => {
											event.stopPropagation()
											await handleConditionCopy(condition)
										}}
										accessibilityRole="button"
										accessibilityLabel={t("profile.copyCondition", { condition })}
									>
										<ThemedView variant="tag" colorName="primary_base" style={styles.conditionTag}>
											<ThemedText
												variant="subTitle2"
												colorName="accent_base"
												numberOfLines={1}
												style={styles.conditionTagText}
											>
												{condition}
											</ThemedText>
										</ThemedView>
									</Pressable>
								))}

								{!areConditionsExpanded && hiddenConditionsCount > 0 && (
									<Pressable
										onPress={(event) => {
											event.stopPropagation()
											setIsKLevelOpen(false)
											setAreConditionsExpanded(true)
										}}
										accessibilityRole="button"
										accessibilityLabel={t("profile.showMoreConditions", {
											count: hiddenConditionsCount,
										})}
									>
										<ThemedView variant="tag" colorName="primary_base" style={styles.moreTag}>
											<ThemedText
												variant="subTitle2"
												colorName="accent_base"
												style={styles.moreTagText}
											>
												+{hiddenConditionsCount}
											</ThemedText>
										</ThemedView>
									</Pressable>
								)}

								<ThemedView
									variant="tag"
									colorName="tertiary_base_3"
									borderColor="primary_base"
									style={styles.addConditionTag}
									onPress={() => {
										closeExpandableSections()
										setAddMode("condition")
									}}
									accessibilityRole="button"
								>
									<ThemedText
										tx="profile.addCondition"
										variant="subTitle2"
										colorName="primary_base"
										style={styles.addConditionText}
									/>

									<Ionicons name="add-outline" size={15} color={colors.primary_base} />
								</ThemedView>
							</View>
						</View>
					</View>

					{/* Stale przyjmowane leki */}
					<View style={styles.section}>
						<ThemedText
							tx="profile.medications"
							variant="tab1Category"
							colorName="secondary_base_0c"
							accessibilityRole="header"
							style={styles.sectionTitle}
						/>

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
											setAreConditionsExpanded(false)
											setIsKLevelOpen(false)
											setAreMedicationsExpanded((current) => !current)
										}}
										style={styles.medicationToggle}
										accessibilityRole="button"
										accessibilityState={{ expanded: areMedicationsExpanded }}
									>
										<Ionicons
											name={areMedicationsExpanded ? "chevron-up" : "chevron-down"}
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
											<View
												style={[styles.medicationBullet, { backgroundColor: colors.primary_base }]}
											/>

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
							onPress={() => {
								closeExpandableSections()
								setAddMode("medication")
							}}
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
					</View>

					{/* Akcje profilu */}
					<View style={styles.utilitiesContainer}>
						<ProfileMenuCard
							label="profile.history"
							subtitle="profile.historyEntries"
							colorName="accent_base_1"
							hasNewEntries={false}
							onPress={() => {
								router.push("/profile/measurements")
							}}
						/>

						<ThemedView
							variant="tag"
							colorName="accent_base_1"
							borderColor="primary_base"
							style={styles.actionTag}
							onPress={() => {
								// TODO: dodawanie pomiaru
							}}
							accessibilityRole="button"
						>
							<ThemedText
								tx="profile.addMeasurement"
								variant="subTitle2"
								colorName="primary_base"
								style={styles.tagText}
							/>

							<Ionicons name="add-outline" size={20} color={colors.primary_base} />
						</ThemedView>

						<ProfileMenuCard
							label="profile.recommendations"
							subtitle="profile.recommendationsEntries"
							colorName="tertiary_base_3"
							hasNewEntries
							onPress={() => {
								router.push("/profile/recommendations")
							}}
						/>

						<ProfileMenuCard
							label="profile.notes"
							subtitle="profile.notesEntries"
							colorName="tertiary_base_3"
							onPress={() => {
								router.push("/profile/technical-notes")
							}}
						/>

						{/* Dodaj plik */}
						<View style={styles.addFileSection}>
							<ThemedView
								colorName="tertiary_base_2"
								style={styles.addFileRow}
								onPress={() => {
									// TODO: dodawanie pliku
								}}
								accessibilityRole="button"
							>
								<ThemedView colorName="primary_base" style={styles.addFileIcon}>
									<Ionicons name="add-outline" size={24} color={colors.accent_base_2} />
								</ThemedView>

								<ThemedText tx="profile.newFile" variant="main1Button" colorName="primary_base" />
							</ThemedView>

							<ThemedText
								tx="profile.fileDescription"
								variant="subTitle1"
								colorName="secondary_base_0c"
								style={styles.addFileDescription}
							/>
						</View>
					</View>
				</Pressable>
			</ScrollView>

			<Modal
				visible={addMode !== null}
				transparent
				animationType="fade"
				onRequestClose={closeAddModal}
			>
				<Pressable style={styles.modalBackdrop} onPress={closeAddModal}>
					<Pressable
						style={[styles.modalCard, { backgroundColor: colors.tertiary_base_3 }]}
						onPress={(event) => event.stopPropagation()}
					>
						<ThemedText variant="subTitle1" colorName="primary_base" style={styles.modalTitle}>
							{t(
								addMode === "condition" ? "profile.addConditionTitle" : "profile.addMedicationTitle"
							)}
						</ThemedText>

						{addMode === "condition" ? (
							<>
								<TextInput
									value={conditionName}
									onChangeText={setConditionName}
									placeholder={t("profile.conditionNamePlaceholder")}
									placeholderTextColor={colors.secondary_base_0c}
									style={[
										styles.modalInput,
										{
											borderColor: colors.primary_base_3,
											color: colors.primary_base,
										},
									]}
								/>

								<View style={styles.conditionTypeRow}>
									<Pressable
										onPress={() => setConditionType("condition")}
										style={[
											styles.conditionTypeButton,
											{ borderColor: colors.primary_base },
											conditionType === "condition" && {
												backgroundColor: colors.primary_base,
											},
										]}
									>
										<ThemedText
											variant="subTitle2"
											colorName={conditionType === "condition" ? "accent_base" : "primary_base"}
										>
											{t("profile.condition")}
										</ThemedText>
									</Pressable>

									<Pressable
										onPress={() => setConditionType("allergy")}
										style={[
											styles.conditionTypeButton,
											{ borderColor: colors.primary_base },
											conditionType === "allergy" && {
												backgroundColor: colors.primary_base,
											},
										]}
									>
										<ThemedText
											variant="subTitle2"
											colorName={conditionType === "allergy" ? "accent_base" : "primary_base"}
										>
											{t("profile.allergy")}
										</ThemedText>
									</Pressable>
								</View>
							</>
						) : (
							<>
								<TextInput
									value={medicationName}
									onChangeText={setMedicationName}
									placeholder={t("profile.medicationNamePlaceholder")}
									placeholderTextColor={colors.secondary_base_0c}
									style={[
										styles.modalInput,
										{
											borderColor: colors.primary_base_3,
											color: colors.primary_base,
										},
									]}
								/>

								<TextInput
									value={medicationUsage}
									onChangeText={setMedicationUsage}
									placeholder={t("profile.medicationUsagePlaceholder")}
									placeholderTextColor={colors.secondary_base_0c}
									style={[
										styles.modalInput,
										{
											borderColor: colors.primary_base_3,
											color: colors.primary_base,
										},
									]}
								/>
							</>
						)}

						<View style={styles.modalActions}>
							<Pressable
								onPress={closeAddModal}
								style={[styles.modalButton, { borderColor: colors.primary_base }]}
							>
								<ThemedText variant="subTitle2" colorName="primary_base">
									{t("profile.cancel")}
								</ThemedText>
							</Pressable>

							<Pressable
								onPress={() =>
									void (addMode === "condition" ? handleAddCondition() : handleAddMedication())
								}
								disabled={isSaving}
								style={[styles.modalButton, { backgroundColor: colors.primary_base }]}
							>
								<ThemedText variant="subTitle2" colorName="accent_base">
									{t(isSaving ? "profile.saving" : "profile.save")}
								</ThemedText>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</ThemedView>
	)
}

interface ProfileMenuCardProps {
	label: "profile.history" | "profile.recommendations" | "profile.notes"

	subtitle: "profile.historyEntries" | "profile.recommendationsEntries" | "profile.notesEntries"

	colorName: "accent_base_1" | "tertiary_base_3"

	hasNewEntries?: boolean
	onPress: () => void
}

function ProfileMenuCard({
	label,
	subtitle,
	colorName,
	hasNewEntries = false,
	onPress,
}: ProfileMenuCardProps) {
	const { colors } = useTheme()

	return (
		<ThemedView
			variant="wide"
			colorName={colorName}
			style={styles.utilityCard}
			onPress={onPress}
			accessibilityRole="button"
		>
			<View style={styles.utilityTextContainer}>
				<ThemedText
					tx={label}
					variant="subTitle1"
					colorName="primary_base"
					style={styles.utilityText}
				/>

				<View style={styles.subtitleRow}>
					{hasNewEntries && <View style={styles.newEntryDot} />}

					<ThemedText
						tx={subtitle}
						variant="subTitle2"
						colorName="primary_base"
						style={styles.utilitySubtitle}
					/>
				</View>
			</View>

			<Ionicons name="chevron-forward" size={30} color={colors.primary_base} />
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	scrollView: {
		flex: 1,
		width: "100%",
	},

	scrollContent: {
		paddingBottom: 40,
	},

	topHeader: {
		width: "100%",
		minHeight: 86,
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 16,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		position: "relative",
		justifyContent: "center",
		overflow: "hidden",
	},

	backButton: {
		position: "absolute",
		left: 16,
		top: 18,
		bottom: 16,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 2,
	},

	section: {
		width: "100%",
		paddingHorizontal: 28,
		marginBottom: 14,
	},

	firstSection: {
		marginTop: 20,
	},

	sectionTitle: {
		marginBottom: 14,
	},

	activityDropdown: {
		minHeight: 52,
		paddingVertical: 8,
		paddingHorizontal: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},

	dropdownTextContainer: {
		flex: 1,
		paddingRight: 8,
		alignItems: "flex-start",
	},

	kLevelLabel: {
		width: "100%",
		textAlign: "left",
		alignSelf: "flex-start",
	},

	kLevelDescription: {
		width: "100%",
		marginTop: 2,
		textAlign: "left",
		alignSelf: "flex-start",
	},

	dropdownMenuWrapper: {
		width: "100%",
	},

	dropdownMenu: {
		marginTop: 6,
		borderRadius: 16,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},

	dropdownOption: {
		minHeight: 55,
		paddingHorizontal: 14,
		paddingVertical: 9,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	dropdownOptionBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(13, 58, 153, 0.18)",
	},

	dropdownOptionText: {
		flex: 1,
		paddingRight: 8,
		alignItems: "flex-start",
	},

	dropdownOptionLabel: {
		width: "100%",
		textAlign: "left",
		alignSelf: "flex-start",
	},

	dropdownOptionDescription: {
		width: "100%",
		marginTop: 2,
		textAlign: "left",
		alignSelf: "flex-start",
	},

	selectedOptionText: {
		fontWeight: "700",
	},

	conditionsArea: {
		width: "100%",
	},

	tagsContainer: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
	},

	conditionTag: {
		minHeight: 28,
		marginRight: 6,
		marginBottom: 6,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},

	conditionTagText: {
		maxWidth: 150,
	},

	moreTag: {
		minWidth: 38,
		minHeight: 28,
		marginRight: 6,
		marginBottom: 6,
		paddingHorizontal: 9,
		paddingVertical: 4,
		justifyContent: "center",
	},

	moreTagText: {
		textAlign: "center",
	},

	addConditionTag: {
		minHeight: 28,
		marginBottom: 6,
		paddingHorizontal: 9,
		paddingVertical: 3,
		borderWidth: 1,
	},

	addConditionText: {
		marginRight: 3,
	},

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
	},

	medicationName: {
		fontWeight: "700",
	},

	utilitiesContainer: {
		width: "100%",
		paddingHorizontal: 24,
	},

	utilityCard: {
		marginBottom: 12,
		justifyContent: "space-between",

		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},

	utilityTextContainer: {
		flex: 1,
	},

	utilityText: {
		textAlign: "left",
	},

	utilitySubtitle: {
		marginTop: 4,
	},

	subtitleRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	newEntryDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: "#22C55E",
		marginRight: 6,
		marginTop: 4,
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

	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.35)",
		justifyContent: "center",
		paddingHorizontal: 24,
	},

	modalCard: {
		width: "100%",
		borderRadius: 18,
		padding: 18,
	},

	modalTitle: {
		marginBottom: 14,
	},

	modalInput: {
		width: "100%",
		minHeight: 44,
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		marginBottom: 12,
	},

	conditionTypeRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 12,
	},

	conditionTypeButton: {
		flex: 1,
		minHeight: 40,
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},

	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 8,
		marginTop: 4,
	},

	modalButton: {
		minHeight: 40,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},

	addFileSection: {
		alignSelf: "center",
		alignItems: "center",
		paddingVertical: 18,
	},

	addFileRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},

	addFileIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},

	addFileDescription: {
		width: 190,
		textAlign: "center",
	},
})
