import React, { useState } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useTheme } from "@/context/ThemeContext"
import ThemedSearch from "@/src/components/ThemedSearch"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"

import { formatDate } from "@/src/utils/dateTimeUtils"

import IconSliders from "@/assets/icons/sliders.svg"
import IconPencil from "@/assets/icons/pencil.svg"
import IconFile from "@/assets/icons/file.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconChevronLeft from "@/assets/icons/chevron-left.svg"
import IconChevronUp from "@/assets/icons/chevron-up.svg.svg"
import IconChevronDown from "@/assets/icons/chevron-down.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconGear from "@/assets/icons/gear.svg"

// TODO MOCK
interface ComponentItem {
	id: string
	isHistorical: boolean
	warrantyEndDate: Date
	modelName: string
	brandName: string
	type: string
}

const MOCK_COMPONENTS: ComponentItem[] = [
	{
		id: "1",
		isHistorical: false,
		warrantyEndDate: new Date("2030-01-01"),
		modelName: "Rękawica kosmetyczna",
		brandName: "Ottobock",
		type: "Lej protezowy",
	},
	{
		id: "2",
		isHistorical: true,
		warrantyEndDate: new Date("2030-01-01"),
		modelName: "Model",
		brandName: "Marka",
		type: "Kategoria",
	},
	{
		id: "3",
		isHistorical: false,
		warrantyEndDate: new Date("2030-01-01"),
		modelName: "Model",
		brandName: "Marka",
		type: "Kategoria",
	},
]

export default function MyProsthesisScreen() {
	const { colors } = useTheme()
	const [isExpanded, setIsExpanded] = useState(true)
	const [showActive, setShowActive] = useState(true)
	const [showHistorical, setShowHistorical] = useState(false)

	// Puste funkcje obsługi zdarzeń zgodnie z zasadą CZYSTY LAYOUT
	const handleOnBack = () => {
		//TODO: Obsługa powrotu
	}

	const handleOnEdit = () => {
		//TODO: Edycja nazwy protezy
	}

	const handleOnToggleNote = () => {
		setIsExpanded((prev) => !prev)
	}

	const handleOnViewFiles = () => {
		//TODO: Przejście do podglądu zdjęć i plików
	}

	const handleOnAddComponent = () => {
		//TODO: Dodawanie nowego komponentu
	}

	const handleOnMoreDetails = (id: string) => {
		//TODO: Przejście do szczegółów komponentu
	}

	const handleOnPrevPage = () => {
		//TODO: Poprzednia strona paginacji
	}

	const handleOnNextPage = () => {
		//TODO: Następna strona paginacji
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<ThemedView
				colorName="bg_1"
				variant="background"
				style={{ alignItems: "center", paddingBottom: 20 }}
			>
				<ThemedView
					shadow
					colorName="bg_0"
					variant="background"
					style={{
						flexDirection: "column",
						width: "119%",
						borderBottomLeftRadius: 15,
						borderBottomRightRadius: 15,
					}}
				>
					<ThemedHeader tx="prosthesisDetails.title" onBack={handleOnBack} />

					<View style={styles.headerCard}>
						<ThemedView colorName="blue2" style={styles.prosthesisIconContainer}>
							{
								//TODO ikona
							}
						</ThemedView>
						<View style={styles.headerTextContainer}>
							<ThemedText variant="H0" colorName="blue2">
								Proteza codzienna
							</ThemedText>
							<ThemedText variant="H4" colorName="blue2">
								Kończyna lewa dolna
							</ThemedText>
						</View>
						<ThemedView onPress={handleOnEdit} hitSlop={9}>
							<IconPencil width={22} height={22} color={colors.magenta0} />
						</ThemedView>
					</View>
				</ThemedView>

				{/* Sekcja właściwości / informacji o protezie */}
				<ProsthesisDetailsSection
					isExpanded={isExpanded}
					onToggleNote={handleOnToggleNote}
					onViewFiles={handleOnViewFiles}
				/>

				{/* Sekcja komponentów */}
				<ThemedText variant="H1" colorName="blue2" style={styles.sectionHeader}>
					KOMPONENTY PROTEZY
				</ThemedText>

				<ThemedSearch />
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						width: "100%",
						marginVertical: 8,
						flex: 1,
					}}
				>
					<ThemedView style={styles.filtersRowElement} onPress={() => setShowActive(!showActive)}>
						<ThemedCheckbox checked={showActive} />
						<ThemedText tx="prosthesisDetails.actve" variant="H2" colorName="blue2" />
					</ThemedView>
					<ThemedView
						style={styles.filtersRowElement}
						onPress={() => setShowHistorical(!showHistorical)}
					>
						<ThemedCheckbox checked={showHistorical} />
						<ThemedText tx="prosthesisDetails.histrocial" variant="H2" colorName="blue2" />
					</ThemedView>
					<ThemedView style={styles.filtersRowElement}>
						<ThemedText tx="prosthesisDetails.filter" variant="H2" colorName="blue1" />
						<IconSliders color={colors.blue1} width={24} height={24} />
					</ThemedView>
				</View>

				<ThemedView
					variant="wide"
					colorName="blue2"
					onPress={handleOnAddComponent}
					style={styles.addButton}
				>
					<View style={styles.addButtonContent}>
						<ThemedText variant="H2" colorName="bg_0" style={styles.addButtonText}>
							DODAJ KOMPONENT
						</ThemedText>
						<IconPlus color={colors.bg_0} width={20} height={20} />
					</View>
				</ThemedView>

				{/* Lista komponentów */}
				<View style={styles.componentsList}>
					{MOCK_COMPONENTS.map((item) => (
						<ComponentCard key={item.id} item={item} onMore={() => handleOnMoreDetails(item.id)} />
					))}
				</View>

				{/* Paginacja */}
				<View style={styles.paginationRow}>
					<ThemedView onPress={handleOnPrevPage} style={styles.paginationArrow}>
						<IconChevronLeft color={colors.blue1} width={20} height={20} />
					</ThemedView>
					<ThemedText variant="H3" colorName="blue2">
						1
					</ThemedText>
					<ThemedView onPress={handleOnNextPage} style={styles.paginationArrow}>
						<IconChevronRight color={colors.blue1} width={20} height={20} />
					</ThemedView>
				</View>
			</ThemedView>
		</ScrollView>
	)
}

// Podkomponent: Szczegóły protezy
function ProsthesisDetailsSection({
	isExpanded,
	onToggleNote,
	onViewFiles,
}: {
	isExpanded: boolean
	onToggleNote: () => void
	onViewFiles: () => void
}) {
	const { colors } = useTheme()

	return (
		<View style={styles.detailsContainer}>
			<View style={styles.detailRow}>
				<ThemedText variant="H4" colorName="blue1">
					Poziom amputacji:
				</ThemedText>
				<ThemedText variant="H2" colorName="blue2">
					średni kikut podudzia
				</ThemedText>
			</View>
			<ThemedView variant="divider" colorName="blue1" />

			<View style={styles.detailRow}>
				<ThemedText variant="H4" colorName="blue1">
					Data rozpoczęcia użytkowania:
				</ThemedText>
				<ThemedText variant="H2" colorName="blue2">
					00-00-0000
				</ThemedText>
			</View>
			<ThemedView variant="divider" colorName="blue1" />

			<View style={styles.detailRow}>
				<ThemedText variant="H4" colorName="blue1">
					Przewidywana data wymiany:
				</ThemedText>
				<ThemedText variant="H2" colorName="blue2">
					00-00-0000
				</ThemedText>
			</View>
			<ThemedView variant="divider" colorName="blue1" />

			{/* Zwinięta/Rozwinięta sekcja notatki */}
			<ThemedView onPress={onToggleNote} style={styles.noteHeaderRow}>
				<ThemedText variant="H4" colorName="blue1">
					Notatka:
				</ThemedText>
				{isExpanded ? (
					<IconChevronUp color={colors.blue1} width={20} height={20} />
				) : (
					<IconChevronDown color={colors.blue1} width={20} height={20} />
				)}
			</ThemedView>

			{isExpanded && (
				<View style={styles.noteContent}>
					<ThemedText variant="H2" colorName="blue2">
						To jest tekst notatki...
					</ThemedText>
				</View>
			)}
			<ThemedView variant="divider" colorName="blue1" />

			{/* Przycisk Zobacz zdjęcia i pliki */}
			<ThemedView variant="wide" colorName="blue0" onPress={onViewFiles} style={styles.filesButton}>
				<View style={styles.filesButtonContent}>
					<IconFile color={colors.blue2} width={20} height={20} />
					<ThemedText variant="H2" colorName="blue2" style={styles.filesButtonText}>
						ZOBACZ ZDJĘCIA I PLIKI
					</ThemedText>
					<IconChevronRight color={colors.blue2} width={20} height={20} />
				</View>
			</ThemedView>
		</View>
	)
}

function ComponentCard({ item, onMore }: { item: ComponentItem; onMore: () => void }) {
	const { colors } = useTheme()

	return (
		<ThemedView
			colorName={item.isHistorical ? "bg_1" : "bg_0"}
			borderColor={item.isHistorical ? "blue0" : "blue1"}
			style={styles.componentCard}
		>
			<View style={styles.componentCardHeader}>
				<ThemedView
					colorName={item.isHistorical ? "blue0" : "blue1"}
					style={styles.componentIconCircle}
				>
					<IconGear width={28} height={28} color={item.isHistorical ? colors.blue1 : colors.bg_0} />
				</ThemedView>

				<View style={styles.componentMainInfo}>
					<ThemedText variant="H3" colorName="blue2">
						{item.type}
					</ThemedText>
					{item.brandName && (
						<ThemedText variant="H4" colorName="blue2">
							{item.brandName}
						</ThemedText>
					)}
					{item.modelName && (
						<ThemedText variant="H4" colorName="blue2">
							{item.modelName}
						</ThemedText>
					)}
					<View style={styles.warrantyRow}>
						<ThemedText variant="H4" colorName="blue2">
							Data gwarancji:{" "}
						</ThemedText>
						<ThemedText variant="H2" colorName="blue2">
							{formatDate(item.warrantyEndDate)}
						</ThemedText>
					</View>
				</View>

				<ThemedView colorName="blue2" onPress={onMore} style={styles.moreButton}>
					<ThemedText variant="H5" colorName="bg_0">
						więcej
					</ThemedText>
				</ThemedView>
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	filtersRowElement: { flexDirection: "row", alignItems: "center", gap: 8 },
	headerCard: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
		marginBottom: 20,
	},
	prosthesisIconContainer: {
		width: 80,
		height: 80,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTextContainer: {
		flex: 1,
		marginLeft: 15,
	},
	detailsContainer: {
		marginVertical: 25,
        width: "100%",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
	},
	noteHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	noteContent: {
		paddingBottom: 10,
	},
	filesButton: {
		marginTop: 15,
		borderRadius: 20,
		height: 50,
	},
	filesButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		width: "100%",
	},
	filesButtonText: {
		flex: 1,
		marginLeft: 10,
	},
	sectionHeader: {
		marginBottom: 12,
		alignSelf: "flex-start",
	},
	addButton: {
		borderRadius: 20,
		height: 50,
		marginVertical: 16,
	},
	addButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	addButtonText: {
		letterSpacing: 0.5,
	},
	componentsList: {
		gap: 12,
		width: "100%",
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
	moreButton: {
		paddingHorizontal: 16,
		paddingVertical: 4,
		borderRadius: 12,
		alignSelf: "flex-start",
	},
	paginationRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 20,
		marginTop: 20,
	},
	paginationArrow: {
		padding: 5,
	},
})
