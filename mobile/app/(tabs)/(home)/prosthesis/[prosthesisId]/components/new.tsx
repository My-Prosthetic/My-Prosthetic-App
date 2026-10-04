import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, TextInput, View, Switch } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
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
import type { ComponentType } from "@/src/constants/componentTypes"
import { useBrandModelCatalog } from "@/src/hooks/useBrandModelCatalog"
import { CustomOptionDialogModal } from "@/src/components/CustomOptionDialogModal"

export default function NewComponentScreen() {
	const router = useRouter()
	const { prosthesisId } = useLocalSearchParams<{ prosthesisId: string }>()
	const { colors } = useTheme()
	const { t } = useTranslation()

	const [category, setCategory] = useState<ComponentType>("socket")
	const [brand, setBrand] = useState("")
	const [model, setModel] = useState("")
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
	const {
		brandsList,
		isLoadingBrands,
		modelsList,
		isLoadingModels,
		customOptionType,
		customOptionName,
		setCustomOptionName,
		isCreatingCustomOption,
		openCustomOptionDialog,
		closeCustomOptionDialog,
		saveCustomOption,
	} = useBrandModelCatalog({
		category,
		selectedBrandId: brand,
		onBrandCreatedAndSelected: (brandId) => {
			setBrand(brandId)
			setModel("")
		},
		onModelCreatedAndSelected: setModel,
	})

	const handleOnAddFiles = () => {
		// TODO
	}

	const handleSave = async () => {
		if (typeof prosthesisId !== "string" || isSaving) {
			return
		}

		const missingFields: string[] = []

		if (!category) {
			missingFields.push(t("newComponent.fields.category"))
		}
		if (!brand.trim()) {
			missingFields.push(t("newComponent.fields.brand"))
		}
		if (!model.trim()) {
			missingFields.push(t("newComponent.fields.model"))
		}
		if (!(assemblyDate instanceof Date) || Number.isNaN(assemblyDate.getTime())) {
			missingFields.push(t("newComponent.fields.assemblyDate"))
		}

		if (missingFields.length > 0) {
			Alert.alert(
				t("newComponent.validation.title"),
				t("newComponent.validation.requiredFields", {
					fields: missingFields.map((field) => `• ${field}`).join("\n"),
				})
			)
			return
		}

		try {
			setIsSaving(true)
			await createComponent({
				prosthesisId,
				modelId: model.trim(),
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
			Alert.alert(t("common.error"), t("newComponent.errors.saveComponent"))
		} finally {
			setIsSaving(false)
		}
	}

	const componentCategories: { label: string; value: ComponentType }[] = [
		{ label: t("newComponent.categories.socket"), value: "socket" },
		{ label: t("newComponent.categories.knee"), value: "knee" },
		{ label: t("newComponent.categories.foot"), value: "foot" },
		{ label: t("newComponent.categories.liner"), value: "liner" },
		{ label: t("newComponent.categories.adapter"), value: "adapter" },
		{ label: t("newComponent.categories.other"), value: "other" },
	]

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
						{t("newComponent.fields.category")} *
					</ThemedText>
					<DropdownSelect
						label={t("newComponent.fields.category")}
						placeholder={t("newComponent.placeholders.category")}
						value={category}
						onChange={(value) => {
							setModel("")
							setCategory(value)
						}}
						options={componentCategories}
					/>
				</View>

				{/* Przełączniki: Rodzaj leja & Typ komponentu */}
				<View style={styles.switchRowsContainer}>
					{category === "socket" && (
						<View style={styles.switchRow}>
							<ThemedText variant="tab1Category" colorName="secondary_base_0c">
								{t("newComponent.switches.socketType")}
							</ThemedText>
							<View style={styles.toggleContainer}>
								<ThemedText variant="subTitle1" colorName="primary_base">
									{t("newComponent.switches.test")}
								</ThemedText>
								<Switch //TODO useThemedSwitch
									value={isFinal}
									onValueChange={setIsFinal}
									trackColor={{ false: colors.primary_base_2, true: colors.primary_base }}
									thumbColor={colors.tertiary_base_1}
									style={styles.switch}
								/>
								<ThemedText variant="subTitle1" colorName="primary_base">
									{t("newComponent.switches.final")}
								</ThemedText>
							</View>
						</View>
					)}
					<View style={styles.switchRow}>
						<ThemedText variant="tab1Category" colorName="secondary_base_0c">
							{t("newComponent.switches.componentType")}
						</ThemedText>
						<View style={styles.toggleContainer}>
							<ThemedText variant="subTitle1" colorName="primary_base">
								{t("newComponent.switches.active")}
							</ThemedText>
							<Switch
								value={isHistorical}
								onValueChange={setIsHistorical}
								trackColor={{ false: colors.primary_base_2, true: colors.primary_base }}
								thumbColor={colors.tertiary_base_1}
								style={styles.switch}
							/>
							<ThemedText variant="subTitle1" colorName="primary_base" style={{}}>
								{t("newComponent.switches.historical")}
							</ThemedText>
						</View>
					</View>
				</View>

				{/* Marka podzespołu */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						{t("newComponent.fields.brand")} *
					</ThemedText>
					<DropdownSelect
						label={t("newComponent.fields.brand")}
						placeholder={
							isLoadingBrands
								? t("newComponent.placeholders.loadingBrands")
								: t("newComponent.placeholders.brand")
						}
						value={brand}
						onChange={(value) => {
							setModel("")
							setBrand(value)
						}}
						options={brandsList}
						search={t("newComponent.placeholders.searchBrand")}
						customLast={{
							tx: "newComponent.customBrand.add",
							onPress: () => openCustomOptionDialog("brand"),
						}}
					/>
				</View>

				{/* Model */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						{t("newComponent.fields.model")} *
					</ThemedText>
					{brand ? (
						<>
							<DropdownSelect
								label={t("newComponent.fields.model")}
								placeholder={
									isLoadingModels
										? t("newComponent.placeholders.loadingModels")
										: t("newComponent.placeholders.model")
								}
								value={model}
								onChange={setModel}
								options={modelsList}
								search={t("newComponent.placeholders.searchModel")}
								customLast={{
									tx: "newComponent.customModel.add",
									onPress: () => openCustomOptionDialog("model"),
								}}
							/>
							{!isLoadingModels && modelsList.length === 0 && (
								<ThemedText variant="subTitle2" colorName="secondary_base_0c">
									{t("newComponent.modelsUnavailable")}
								</ThemedText>
							)}
						</>
					) : (
						<>
							<View
								style={[
									styles.modelUnavailable,
									{ backgroundColor: colors.tertiary_base_3, borderColor: colors.primary_base_2 },
								]}
							>
								<ThemedText variant="main1Button" colorName="primary_base_3">
									{t("newComponent.placeholders.selectBrandFirst")}
								</ThemedText>
							</View>
							<ThemedText variant="subTitle2" colorName="secondary_base_0c">
								{t("newComponent.hints.selectBrandForModel")}
							</ThemedText>
						</>
					)}
				</View>

				{/* Data montażu */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						{t("newComponent.fields.assemblyDate")}: *
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
						{t("newComponent.fields.description")}:
					</ThemedText>
					<TextInput
						multiline
						value={description}
						onChangeText={setDescription}
						placeholder={t("newComponent.placeholders.description")}
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
						{t("newComponent.sections.warrantyAndUsage")}
					</ThemedText>
				</View>

				{/* Data końca gwarancji */}
				<View style={styles.fieldGroup}>
					<ThemedText
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fieldLabel}
					>
						{t("newComponent.fields.warrantyEndDate")}:
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
						{t("newComponent.fields.expectedExchangeDate")}
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
						label={t("newComponent.reminders.exchangeDate")}
						emailValue={remindExchangeEmail}
						appValue={remindExchangeApp}
						pushValue={remindExchangePush}
						onEmailChange={() => setRemindExchangeEmail(!remindExchangeEmail)}
						onAppChange={() => setRemindExchangeApp(!remindExchangeApp)}
						onPushChange={() => setRemindExchangePush(!remindExchangePush)}
					/>

					<ReminderCheckRow
						label={t("newComponent.reminders.warrantyEnd")}
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
						{t("newComponent.addFiles")}
					</ThemedText>
				</ThemedView>
				<ThemedText variant="subTitle2" colorName="primary_base" style={styles.addFilesSubtitle}>
					{t("newComponent.filesDescription")}
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
						{isSaving ? t("newComponent.saving") : t("newComponent.save")}
					</ThemedText>
				</ThemedView>
			</ScrollView>

			<CustomOptionDialogModal
				visible={customOptionType !== null}
				type={customOptionType}
				value={customOptionName}
				onChangeText={setCustomOptionName}
				onSave={() => void saveCustomOption()}
				onClose={closeCustomOptionDialog}
				isSaving={isCreatingCustomOption}
			/>

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
	const { t } = useTranslation()

	return (
		<View style={styles.reminderRow}>
			<View style={styles.reminderTitleWrapper}>
				<ThemedText variant="tab1Category" colorName="secondary_base_0c">
					{label}
				</ThemedText>
			</View>

			<View style={styles.checkboxesGroup}>
				<ThemedCheckbox
					label={t("newComponent.reminderChannels.email")}
					checked={emailValue}
					onPress={onEmailChange}
				/>
				<ThemedCheckbox
					label={t("newComponent.reminderChannels.app")}
					checked={appValue}
					onPress={onAppChange}
				/>
				<ThemedCheckbox
					label={t("newComponent.reminderChannels.push")}
					checked={pushValue}
					onPress={onPushChange}
				/>
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
	modelUnavailable: {
		minHeight: 48,
		borderWidth: 1,
		borderRadius: 16,
		justifyContent: "center",
		paddingHorizontal: 16,
		opacity: 0.6,
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
