import { useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

import { useTheme } from "@/context/ThemeContext"
import {
	addMedicalCondition,
	addMedicalMedication,
	deleteMedicalCondition,
	deleteMedicalMedication,
	getMedicalProfileData,
	updateMedicalKLevel,
} from "@/db/repositories/medicalProfileRepository"
import { ConditionsSection } from "@/src/components/profile/ConditionsSection"
import { KLevelSelector } from "@/src/components/profile/KLevelSelector"
import { MedicalProfileModal } from "@/src/components/profile/MedicalProfileModal"
import { MedicationsSection } from "@/src/components/profile/MedicationsSection"
import type { AddMode, Condition, KLevelId, Medication } from "@/src/components/profile/types"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedHeader } from "@/src/components/ThemedHeader"

export default function ProfileScreen() {
	const { colors } = useTheme()
	const router = useRouter()

	const [selectedKLevel, setSelectedKLevel] = useState<KLevelId | null>(null)
	const [isKLevelOpen, setIsKLevelOpen] = useState(false)
	const [conditions, setConditions] = useState<Condition[]>([])
	const [areConditionsExpanded, setAreConditionsExpanded] = useState(false)
	const [medications, setMedications] = useState<Medication[]>([])
	const [areMedicationsExpanded, setAreMedicationsExpanded] = useState(false)
	const [addMode, setAddMode] = useState<AddMode>(null)

	useEffect(() => {
		let mounted = true

		const loadMedicalProfile = async () => {
			try {
				const result = await getMedicalProfileData()

				if (!mounted) {
					return
				}

				setSelectedKLevel(result.profile.kLevel)
				setConditions(
					result.conditions.map((condition) => ({
						id: condition.id,
						name: condition.name,
					}))
				)
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

	const closeExpandableSections = () => {
		setIsKLevelOpen(false)
		setAreConditionsExpanded(false)
	}

	const handleKLevelSelect = async (level: KLevelId) => {
		await updateMedicalKLevel(level)
		setSelectedKLevel(level)
	}

	const handleAddCondition = async (input: { name: string }) => {
		const savedCondition = await addMedicalCondition(input)

		setConditions((current) => [
			...current,
			{
				id: savedCondition.id,
				name: savedCondition.name,
			},
		])
	}

	const handleAddMedication = async (input: { name: string; usage: string }) => {
		const savedMedication = await addMedicalMedication(input)

		setMedications((current) => [
			...current,
			{
				id: savedMedication.id,
				name: savedMedication.name,
				usage: savedMedication.usage,
			},
		])
	}

	const handleDeleteCondition = async (id: string) => {
		const deletedCondition = await deleteMedicalCondition(id)

		if (deletedCondition) {
			setConditions((current) => current.filter((condition) => condition.id !== id))
		}
	}

	const handleDeleteMedication = async (id: string) => {
		const deletedMedication = await deleteMedicalMedication(id)

		if (deletedMedication) {
			setMedications((current) => current.filter((medication) => medication.id !== id))
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
					<ThemedHeader tx="profile.title" variant="prominent" />
					{/* K-Levels */}
					<View style={[styles.section, styles.firstSection]}>
						<ThemedText
							tx="profile.activity"
							variant="tab1Category"
							colorName="secondary_base_0c"
							accessibilityRole="header"
							style={styles.sectionTitle}
						/>

						<KLevelSelector
							selectedKLevel={selectedKLevel}
							isOpen={isKLevelOpen}
							onOpenChange={(isOpen) => {
								setIsKLevelOpen(isOpen)

								if (isOpen) {
									setAreConditionsExpanded(false)
								}
							}}
							onSelect={handleKLevelSelect}
						/>
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

						<ConditionsSection
							conditions={conditions}
							isExpanded={areConditionsExpanded}
							onExpandedChange={(expanded) => {
								setAreConditionsExpanded(expanded)

								if (expanded) {
									setIsKLevelOpen(false)
								}
							}}
							onAddPress={() => {
								closeExpandableSections()
								setAddMode("condition")
							}}
							onDelete={handleDeleteCondition}
							onCopy={() => setIsKLevelOpen(false)}
						/>
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

						<MedicationsSection
							medications={medications}
							isExpanded={areMedicationsExpanded}
							onExpandedChange={(expanded) => {
								setAreMedicationsExpanded(expanded)
								setAreConditionsExpanded(false)
								setIsKLevelOpen(false)
							}}
							onAddPress={() => {
								closeExpandableSections()
								setAddMode("medication")
							}}
							onDelete={handleDeleteMedication}
						/>
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

			<MedicalProfileModal
				mode={addMode}
				conditions={conditions}
				medications={medications}
				onClose={() => setAddMode(null)}
				onAddCondition={handleAddCondition}
				onAddMedication={handleAddMedication}
			/>
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
			style={[styles.utilityCard, { shadowColor: colors.primary_base }]}
			onPress={onPress}
			accessibilityRole="button"
		>
			<View style={styles.utilityTextContainer}>
				<ThemedText tx={label} variant="subTitle1" colorName="primary_base" />

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
	utilitiesContainer: {
		width: "100%",
		paddingHorizontal: 24,
	},
	utilityCard: {
		marginBottom: 12,
		justifyContent: "space-between",
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
