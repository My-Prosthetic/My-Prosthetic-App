import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, TextInput, View, Switch } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { DropdownSelect } from "@/src/components/DropdownSelect"
import { useTheme } from "@/context/ThemeContext"
import { formatDate } from "@/src/utils/dateFormatter"
import { DatePickerModal } from "@/src/components/DatePicker"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"
import { createComponent } from "@/db/repositories/componentRepository"
import type { Component } from "@/db/repositories/componentRepository"

//TODO tx (placeholders, ThemedText and //tx comments)
//TODO mocks

export default function NewComponentScreen() {
	const router = useRouter()
	const { prosthesisId } = useLocalSearchParams<{ prosthesisId: string }>()
	const { colors } = useTheme()

	const [category, setCategory] = useState<Component["type"]>("socket")
	const [brand, setBrand] = useState("Ottobock")
	const [model, setModel] = useState("Rękawica kosmetyczna")
	const [assemblyDate, setAssemblyDate] = useState(new Date())
	const [warrantyEndDate, setWarrantyEndDate] = useState(new Date())
	const [expectedExchangeDate, setExpectedExchangeDate] = useState(new Date())

	const [assemblyDateModalVisible, setAssemblyDateModalVisible] = useState(false)
	const [warrantyEndDateModalVisible, setWarrantyEndDateModalVisible] = useState(false)
	const [expectedExchangeDateModalVisible, setExpectedExchangeDateModalVisible] = useState(false)

	const [isFinal, setIsFinal] = useState(false)
	const [isHistorical, setIsHistorical] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const [remindExchangeEmail, setRemindExchangeEmail] = useState(true)
	const [remindExchangeApp, setRemindExchangeApp] = useState(true)
	const [remindExchangePush, setRemindExchangePush] = useState(false)

	const [remindWarrantyEmail, setRemindWarrantyEmail] = useState(true)
	const [remindWarrantyApp, setRemindWarrantyApp] = useState(true)
	const [remindWarrantyPush, setRemindWarrantyPush] = useState(false)

	const [description, setDescription] = useState("")

	const handleOnAddFiles = () => {
		// TODO: Implement file picker / upload logic
	}

	const handleSave = async () => {
		if (typeof prosthesisId !== "string" || isSaving) {
			return
		}

		try {
			setIsSaving(true)
			await createComponent({
				prosthesisId,
				type: category,
				brand: brand.trim(),
				model: model.trim(),
				isFinal,
				isHistorical,
				assemblyDate: assemblyDate.toISOString(),
				warrantyEndDate: warrantyEndDate.toISOString(),
				expectedExchangeDate: expectedExchangeDate.toISOString(),
				description: description.trim(),
				remindExchangeEmail,
				remindExchangeApp,
				remindExchangePush,
				remindWarrantyEmail,
				remindWarrantyApp,
				remindWarrantyPush,
			})
			router.back()
		} catch (error) {
			console.error("Failed to save component:", error)
			Alert.alert("Błąd", "Nie udało się zapisać komponentu.")
		} finally {
			setIsSaving(false)
		}
	}

	const componentCategories: { label: string; value: Component["type"] }[] = [
		{ label: "Lej protezowy", value: "socket" },
		{ label: "Kolano", value: "knee" },
		{ label: "Stopa protezowa", value: "foot" },
		{ label: "Liner", value: "liner" },
		{ label: "Adapter", value: "adapter" },
		{ label: "Inny komponent", value: "other" },
	]
	const mockBrands = [
		{ label: "Ottobock", value: "Ottobock" },
		{ label: "Össur", value: "Össur" },
	]
	const mockModels = [{ label: "Rękawica kosmetyczna", value: "Rękawica kosmetyczna" }]

	return (
		<ThemedView variant="background" colorName="tertiary_base_1">
			<ThemedHeader tx="newComponent.newComponent" variant="transparent" onBack={router.back} />
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
				{/* Kategoria podzespołu */}
				<View style={[styles.fieldGroup, { paddingTop: 0, paddingBottom: 10 }]}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Kategoria podzespołu
					</ThemedText>
					<DropdownSelect
						label="category"
						placeholder="Wybierz kategorię"
						value={category}
						onChange={setCategory}
						options={componentCategories}
					/>
				</View>

				{/* Przełączniki: Rodzaj leja & Typ komponentu */}
				{category === "socket" && (
					<View style={styles.switchRowsContainer}>
						<View style={styles.switchRow}>
							<ThemedText variant="tab1Category" colorName="secondary_base_0c">
								RODZAJ LEJA:
							</ThemedText>
							<View style={styles.toggleContainer}>
								<ThemedText variant="subTitle1" colorName="primary_base">
									testowy
								</ThemedText>
								<Switch //useThemedSwitch
									value={isFinal}
									onValueChange={setIsFinal}
									trackColor={{ false: colors.primary_base_2, true: colors.primary_base }}
									thumbColor={colors.tertiary_base_1}
									style={styles.switch}
								/>
								<ThemedText variant="subTitle1" colorName="primary_base">
									finalny
								</ThemedText>
							</View>
						</View>

						<View style={styles.switchRow}>
							<ThemedText variant="tab1Category" colorName="secondary_base_0c">
								TYP KOMPONENTU:
							</ThemedText>
							<View style={styles.toggleContainer}>
								<ThemedText variant="subTitle1" colorName="primary_base">
									aktywny
								</ThemedText>
								<Switch
									value={isHistorical}
									onValueChange={setIsHistorical}
									trackColor={{ false: colors.primary_base_2, true: colors.primary_base }}
									thumbColor={colors.tertiary_base_1}
									style={styles.switch}
								/>
								<ThemedText variant="subTitle1" colorName="primary_base" style={{}}>
									historyczny
								</ThemedText>
							</View>
						</View>
					</View>
				)}

				{/* Marka podzespołu */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Marka podzespołu
					</ThemedText>
					<DropdownSelect
						label="brand"
						placeholder="Wybierz markę"
						value={brand}
						onChange={setBrand}
						options={mockBrands}
					/>
				</View>

				{/* Model */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Model
					</ThemedText>
					<DropdownSelect
						label="model"
						placeholder="Wybierz model"
						value={model}
						onChange={setModel}
						options={mockModels}
					/>
				</View>

				{/* Data montażu */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Data montażu:
					</ThemedText>
					<ThemedView
						borderColor="primary_base_2"
						colorName="tertiary_base_3"
						variant="wide"
						onPress={() => setAssemblyDateModalVisible(true)}
						style={styles.dateField}
					>
						<ThemedText variant="main1Button" colorName="primary_base">
							{formatDate(assemblyDate, "numeric")}
						</ThemedText>
						<Ionicons name="chevron-down" size={20} color={colors.primary_base} />
					</ThemedView>
				</View>

				{/* Opis */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Opis:
					</ThemedText>
					<TextInput
						multiline
						value={description}
						onChangeText={setDescription}
						placeholder="Wpisz krótki opis, np. nr decyzji..."
						placeholderTextColor={colors.primary_base_3}
						style={[
							styles.textArea,
							{
								backgroundColor: colors.tertiary_base_3,
								borderColor: colors.primary_base_2,
								color: colors.primary_base,
							},
						]}
					/>
				</View>

				{/* Sekcja: Gwarancja i zużycie */}
				<View style={styles.sectionHeader}>
					<ThemedText
						variant="main1Button"
						colorName="secondary_base_0c"
						style={styles.sectionTitle}
					>
						GWARANCJA I ZUŻYCIE
					</ThemedText>
				</View>

				{/* Data końca gwarancji */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Data końca gwarancji:
					</ThemedText>
					<ThemedView
						borderColor="primary_base_2"
						colorName="tertiary_base_3"
						variant="wide"
						onPress={() => setWarrantyEndDateModalVisible(true)}
						style={styles.dateField}
					>
						<ThemedText variant="main1Button" colorName="primary_base">
							{formatDate(warrantyEndDate, "numeric")}
						</ThemedText>
						<Ionicons name="chevron-down" size={20} color={colors.primary_base} />
					</ThemedView>
				</View>

				{/* Przewidywana data wymiany */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						Przewidywana data wymiany
					</ThemedText>
					<ThemedView
						borderColor="primary_base_2"
						colorName="tertiary_base_3"
						variant="wide"
						onPress={() => setExpectedExchangeDateModalVisible(true)}
						style={styles.dateField}
					>
						<ThemedText variant="main1Button" colorName="primary_base">
							{formatDate(expectedExchangeDate, "numeric")}
						</ThemedText>
						<Ionicons name="chevron-down" size={20} color={colors.primary_base} />
					</ThemedView>
				</View>

				{/* Sekcja przypomnień / checklist */}
				<View style={styles.remindersContainer}>
					<ReminderCheckRow
						label={"PRZYPOMNIJ O\nDACIE WYMIANY"} //tx
						emailValue={remindExchangeEmail}
						appValue={remindExchangeApp}
						pushValue={remindExchangePush}
						onEmailChange={() => setRemindExchangeEmail(!remindExchangeEmail)}
						onAppChange={() => setRemindExchangeApp(!remindExchangeApp)}
						onPushChange={() => setRemindExchangePush(!remindExchangePush)}
					/>

					<ReminderCheckRow
						label={"PRZYPOMNIJ O\nUPŁYWIE GWARANCJI"} //tx
						emailValue={remindWarrantyEmail}
						appValue={remindWarrantyApp}
						pushValue={remindWarrantyPush}
						onEmailChange={() => setRemindWarrantyEmail(!remindWarrantyEmail)}
						onAppChange={() => setRemindWarrantyApp(!remindWarrantyApp)}
						onPushChange={() => setRemindWarrantyPush(!remindWarrantyPush)}
					/>
				</View>

				{/* Dodaj pliki */}
				<ThemedView
					variant="narrow"
					style={{ backgroundColor: "transparent" }}
					onPress={handleOnAddFiles}
				>
					<Ionicons name="add-circle" size={28} color={colors.primary_base} />
					<ThemedText variant="main1Button" colorName="primary_base">
						DODAJ PLIKI
					</ThemedText>
				</ThemedView>
				<ThemedText variant="subTitle2" colorName="primary_base" style={styles.addFilesSubtitle}>
					{"tutaj możesz dodać zdjęcia,\ndokumentację i skany 3D\ninne pliki dotyczące protezy"}
				</ThemedText>

				{/* Zapisz komponent */}
				<ThemedView
					variant="narrow"
					borderColor="accent_base"
					onPress={() => handleSave()}
					disabled={isSaving}
					accessibilityRole="button"
				>
					<ThemedText
						variant="main1Button"
						colorName="accent_base"
						numberOfLines={1}
						adjustsFontSizeToFit
					>
						{isSaving ? "Zapisywanie..." : "Zapisz komponent"}
					</ThemedText>
				</ThemedView>
			</ScrollView>

			<DatePickerModal
				visible={assemblyDateModalVisible}
				initialDate={assemblyDate}
				onClose={() => setAssemblyDateModalVisible(false)}
				onSave={setAssemblyDate}
			/>
			<DatePickerModal
				visible={warrantyEndDateModalVisible}
				initialDate={warrantyEndDate}
				onClose={() => setWarrantyEndDateModalVisible(false)}
				onSave={setWarrantyEndDate}
				variant="calendar"
			/>
			<DatePickerModal
				visible={expectedExchangeDateModalVisible}
				initialDate={expectedExchangeDate}
				onClose={() => setExpectedExchangeDateModalVisible(false)}
				onSave={setExpectedExchangeDate}
				variant="calendar"
			/>
		</ThemedView>
	)
}

interface ReminderCheckRowProps {
	label: string
	emailValue: boolean
	appValue: boolean
	pushValue: boolean
	onEmailChange: () => void
	onAppChange: () => void
	onPushChange: () => void
}

function ReminderCheckRow({
	label,
	emailValue,
	appValue,
	pushValue,
	onEmailChange,
	onAppChange,
	onPushChange,
}: ReminderCheckRowProps) {
	return (
		<View style={styles.reminderRow}>
			<View style={styles.reminderTitleWrapper}>
				<ThemedText variant="tab1Category" colorName="secondary_base_0c">
					{label}
				</ThemedText>
			</View>

			<View style={styles.checkboxesGroup}>
				<ThemedCheckbox label="e-mail" checked={emailValue} onPress={onEmailChange} />
				<ThemedCheckbox label={"w\naplikacji"} checked={appValue} onPress={onAppChange} />
				<ThemedCheckbox label={"powiadomienie\npush"} checked={pushValue} onPress={onPushChange} />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: 20,
	},
	fieldGroup: {
		gap: 6,
		paddingTop: 10,
	},
	fieldLabel: {
		paddingLeft: 4,
	},
	switchRowsContainer: {
		paddingVertical: 4,
	},
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 4,
		height: 30,
	},
	toggleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	switch: {
		transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
	},
	dateField: {
		borderWidth: 1,
		justifyContent: "space-between",
		paddingVertical: 0,
		paddingHorizontal: 10,
	},
	textArea: {
		minHeight: 90,
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 12,
		textAlignVertical: "top",
		fontFamily: "Afacad-Regular",
		fontSize: 16,
	},
	sectionHeader: {
		marginTop: 8,
	},
	sectionTitle: {
		textAlign: "left",
	},
	remindersContainer: {
		marginTop: 8,
		gap: 20,
	},
	reminderRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
	},
	reminderTitleWrapper: {
		width: "36%",
		paddingRight: 4,
	},
	checkboxesGroup: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	addFilesButton: {
		alignItems: "center",
		justifyContent: "center",
		marginTop: 16,
		paddingVertical: 12,
		gap: 8,
	},
	addFilesSubtitle: {
		textAlign: "center",
	},
})
