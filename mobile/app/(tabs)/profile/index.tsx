import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"

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

import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconMeasure from "@/assets/icons/measure-filled.svg"
import IconFile from "@/assets/icons/file.svg"
import IconMedicalReport from "@/assets/icons/medical-report-clipboard.svg"

export default function ProfileScreen() {
	const { colors } = useTheme()

	const [selectedKLevel, setSelectedKLevel] = useState<KLevelId | null>(null)
	const [isKLevelOpen, setIsKLevelOpen] = useState(false)
	const [conditions, setConditions] = useState<Condition[]>([])
	const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null)
	const [areConditionsExpanded, setAreConditionsExpanded] = useState(false)
	const [medications, setMedications] = useState<Medication[]>([])
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

	//TODO
	const onHandleAddMeasurement = () => {}
	const onHandleMyFiles = () => {}
	const onHandleRecommendations = () => {}

	//TODO MOCK
	const numberOfNewEntries = 1

	return (
		<ThemedView colorName="bg_1" style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				nestedScrollEnabled
				onTouchStart={() => setSelectedConditionId(null)}
				onScrollBeginDrag={closeExpandableSections}
			>
				<View>
					<ThemedHeader tx="profile.title" />
					{/* K-Levels */}
					<View style={[styles.section, styles.firstSection]}>
						<ThemedText
							tx="profile.activity"
							variant="H1"
							colorName="blue2"
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
							variant="H1"
							colorName="blue2"
							accessibilityRole="header"
							style={[styles.sectionTitle, { marginBottom: 7 }]}
						/>

						<ConditionsSection
							conditions={conditions}
							selectedConditionId={selectedConditionId}
							onSelectCondition={setSelectedConditionId}
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
						/>
					</View>

					{/* Stale przyjmowane leki */}
					<View style={[styles.section, { marginBottom: 0 }]}>
						<ThemedText
							tx="profile.medications"
							variant="H1"
							colorName="blue2"
							accessibilityRole="header"
							style={styles.sectionTitle}
						/>

						<MedicationsSection
							medications={medications}
							onAddPress={() => {
								closeExpandableSections()
								setAddMode("medication")
							}}
							onDelete={handleDeleteMedication}
						/>
					</View>

					{/* Akcje profilu */}
					<View style={styles.utilitiesContainer}>
						<ThemedView
							style={styles.actionButton}
							variant="wide"
							colorName="blue2"
							onPress={onHandleAddMeasurement}
							leftChild={<IconMeasure color={colors.bg_0} />}
							centerChild={<ThemedText tx="profile.addMeasurement" variant="H1" colorName="bg_0" />}
							rightChild={<IconChevronRight color={colors.bg_0} />}
						/>

						<ThemedView
							style={styles.actionButton}
							variant="wide"
							colorName="blue0"
							onPress={onHandleMyFiles}
							leftChild={<IconFile color={colors.graphite0} />}
							centerChild={<ThemedText tx="home.myFiles" variant="H1" colorName="graphite0" />}
							rightChild={<IconChevronRight color={colors.graphite0} />}
						/>

						<ThemedView
							style={styles.actionButton}
							variant="wide"
							colorName="blue0"
							onPress={onHandleRecommendations}
							leftChild={<IconMedicalReport color={colors.graphite0} height={22} />}
							centerChild={
								<ThemedText tx="profile.recommendations" variant="H1" colorName="graphite0" />
							}
							rightChild={<IconChevronRight color={colors.graphite0} />}
						/>
						{numberOfNewEntries > 0 && (
							<View style={styles.newEntry}>
								<View style={[styles.newEntryDot, { backgroundColor: colors.true }]} />
								<ThemedText tx="profile.recommendationsEntries" variant="H4" colorName="blue2" />
							</View>
						)}
					</View>
				</View>
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
		flexDirection: "column",
		justifyContent: "flex-start",
	},
	newEntryDot: {
		width: 7,
		height: 7,
		borderRadius: 7,
		marginRight: 6,
		marginTop: 4,
	},
	actionButton: {
		marginVertical: 10,
	},
	newEntry: {
		width: "100%",
		paddingRight: 20,
		flexDirection: "row",
		alignContent: "center",
		justifyContent: "flex-end",
	},
})
