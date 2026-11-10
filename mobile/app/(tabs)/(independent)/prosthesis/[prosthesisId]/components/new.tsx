import { useEffect, useMemo, useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ParseKeys } from "i18next"
import { useTheme } from "@/context/ThemeContext"

import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { DropdownSelect } from "@/src/components/DropdownSelect"
import { ThemedInput } from "@/src/components/ThemedInput"
import { DatePickerModal } from "@/src/components/DatePicker"
import { CustomOptionDialogModal } from "@/src/components/CustomOptionDialogModal"
import ThemedSelectiveSwitch from "@/src/components/ThemedSelectiveSwitch"
import ThemedCheckbox from "@/src/components/ThemedCheckbox"

import { useBrandModelCatalog } from "@/src/hooks/useBrandModelCatalog"
import { formatDate } from "@/src/utils/dateTimeUtils"
import { getComponentTypesForProsthesis, type ComponentType } from "@/src/constants/componentTypes"

import { createComponent } from "@/db/repositories/componentRepository"
import { getProsthesisById } from "@/db/repositories/prosthesisRepository"
import type { Prosthesis } from "@/db/repositories/prosthesisRepository"

import IconFile from "@/assets/icons/file.svg"
import IconPlus from "@/assets/icons/plus.svg"

export default function NewComponentScreen() {
	const router = useRouter()
	const { prosthesisId } = useLocalSearchParams<{ prosthesisId: string }>()
	const { colors } = useTheme()
	const { t } = useTranslation()

	const [category, setCategory] = useState<ComponentType>("socket")
	const [prosthesis, setProsthesis] = useState<Prosthesis | null>(null)
	const [brand, setBrand] = useState("")
	const [model, setModel] = useState("")
	const [assemblyDate, setAssemblyDate] = useState(new Date())
	const [warrantyEndDate, setWarrantyEndDate] = useState<Date | null>(null)
	const [expectedExchangeDate, setExpectedExchangeDate] = useState<Date | null>(null)

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
	useEffect(() => {
		let isActive = true

		if (typeof prosthesisId !== "string" || prosthesisId.length === 0) {
			return () => {
				isActive = false
			}
		}

		void getProsthesisById(prosthesisId)
			.then((result) => {
				if (isActive) {
					setProsthesis(result)
				}
			})
			.catch((error: unknown) => {
				console.error("Failed to load prosthesis:", error)
				if (isActive) {
					setProsthesis(null)
				}
			})

		return () => {
			isActive = false
		}
	}, [prosthesisId])

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

	const handleDelete = () => {
		//TODO (ai)
		//soft delete the component from the database. Use the repository methods, implement accurate method if there is none for component deletions
	}

	const handleForefit = () => {
		//TODO (ai)
		// if any data has been changed in the form, ask by Alert "Are you sure you want to forefit" or smth (check how it has been done in the translations)
		//and after router.back()
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
				t("common.validationError"),
				t("newComponent.validation.requiredFields", {
					fields: missingFields.map((field) => `• ${field}`).join("\n"),
				})
			)
			return
		}

		const assemblyDay = new Date(assemblyDate)
		assemblyDay.setHours(0, 0, 0, 0)

		if (warrantyEndDate) {
			const warrantyDay = new Date(warrantyEndDate)
			warrantyDay.setHours(0, 0, 0, 0)
			if (warrantyDay < assemblyDay) {
				Alert.alert(
					t("common.validationError"),
					t("newComponent.validation.warrantyBeforeAssembly")
				)
				return
			}
		}

		if (expectedExchangeDate) {
			const exchangeDay = new Date(expectedExchangeDate)
			exchangeDay.setHours(0, 0, 0, 0)
			if (exchangeDay < assemblyDay) {
				Alert.alert(
					t("common.validationError"),
					t("newComponent.validation.exchangeBeforeAssembly")
				)
				return
			}
		}

		try {
			setIsSaving(true)
			await createComponent({
				prosthesisId,
				modelId: model.trim(),
				isFinal,
				isHistorical,
				assemblyDate: assemblyDate.toISOString(),
				warrantyEndDate: warrantyEndDate?.toISOString(),
				expectedExchangeDate: expectedExchangeDate?.toISOString(),
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

	const componentCategories = useMemo(() => {
		const availableTypes = getComponentTypesForProsthesis(prosthesis?.limbType)
		return availableTypes.map((type) => ({
			label: t(`newComponent.categories.${type}`),
			value: type,
		}))
	}, [prosthesis?.limbType, t])

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<ThemedView variant="background" colorName="bg_1">
				<ThemedHeader tx="newComponent.newComponent" onBack={handleForefit} />

				{/* Kategoria podzespołu */}
				<View style={[styles.fieldGroup, { paddingTop: 0, paddingBottom: 10 }]}>
					<ThemedText variant="H1" colorName="blue2">
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

				{category === "socket" && (
					<View style={styles.switchGroup}>
						<ThemedText variant="H1" colorName="blue2" tx="newComponent.switches.socketType" />
						<View style={styles.toggleContainer}>
							<ThemedSelectiveSwitch
								leftLabelWidth={80}
								rightLabelWidth={80}
								leftTx="newComponent.switches.test"
								rightTx="newComponent.switches.final"
								selectLeft={() => setIsFinal(false)}
								selectRight={() => setIsFinal(true)}
								initialState="left"
								backgroundColor={colors.bg_0}
							/>
						</View>
					</View>
				)}

				{/* Marka podzespołu */}
				<View style={styles.fieldGroup}>
					<ThemedText variant="H1" colorName="blue2">
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
					<ThemedText variant="H1" colorName="blue2">
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
								<ThemedText variant="subTitle2" colorName="blue2">
									{t("newComponent.modelsUnavailable")}
								</ThemedText>
							)}
						</>
					) : (
						<>
							<ThemedView
								variant="wide"
								borderColor="blue1"
								style={[styles.modelUnavailable, { backgroundColor: colors.bg_2 }]}
							>
								<ThemedText variant="H3" colorName="blue2">
									{t("newComponent.placeholders.selectBrandFirst")}
								</ThemedText>
							</ThemedView>
							<ThemedText variant="H4" colorName="blue2">
								{t("newComponent.hints.selectBrandForModel")}
							</ThemedText>
						</>
					)}
				</View>

				<View style={styles.switchGroup}>
					<ThemedText variant="H1" colorName="blue2" tx="newComponent.switches.componentType" />
					<ThemedSelectiveSwitch
						leftLabelWidth={80}
						rightLabelWidth={80}
						rightTx="newComponent.switches.historical"
						leftTx="newComponent.switches.active"
						selectLeft={() => setIsHistorical(false)}
						selectRight={() => setIsHistorical(true)}
						initialState="left"
						backgroundColor={colors.bg_0}
					/>
				</View>

				{/* Data montażu */}
				<View style={styles.fieldGroup}>
					<ThemedText variant="H1" colorName="blue2">
						{t("newComponent.fields.assemblyDate")} *
					</ThemedText>
					<DateRow t={t} onPress={() => setAssemblyDateModalVisible(true)} value={assemblyDate} />
				</View>

				{/* Opis */}
				<View style={styles.fieldGroup}>
					<ThemedText variant="H1" colorName="blue2">
						{t("newComponent.fields.description")}
					</ThemedText>
					<ThemedInput
						viewStyle={{ backgroundColor: colors.bg_0 }}
						variant="note"
						placeholder={t("newComponent.placeholders.description")}
						value={description}
						onChangeText={setDescription}
					/>
				</View>

				{/* Data końca gwarancji */}
				<View style={styles.fieldGroup}>
					<ThemedText variant="H1" colorName="blue2">
						{t("newComponent.fields.warrantyEndDate")}:
					</ThemedText>
					<DateRow
						t={t}
						value={warrantyEndDate}
						onPress={() => setWarrantyEndDateModalVisible(true)}
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

				{/* Przewidywana data wymiany */}
				<View style={styles.fieldGroup}>
					<ThemedText variant="H1" colorName="blue2">
						{t("newComponent.fields.expectedExchangeDate")}
					</ThemedText>
					<DateRow
						t={t}
						value={expectedExchangeDate}
						onPress={() => setExpectedExchangeDateModalVisible(true)}
					/>
					<ReminderCheckRow
						label={t("newComponent.reminders.exchangeDate")}
						emailValue={remindExchangeEmail}
						appValue={remindExchangeApp}
						pushValue={remindExchangePush}
						onEmailChange={() => setRemindExchangeEmail(!remindExchangeEmail)}
						onAppChange={() => setRemindExchangeApp(!remindExchangeApp)}
						onPushChange={() => setRemindExchangePush(!remindExchangePush)}
					/>
				</View>

				{/* Dodaj pliki */}
				<ThemedView
					variant="wide"
					colorName="blue0"
					onPress={handleOnAddFiles}
					leftChild={<IconFile color={colors.graphite0} />}
					centerChild={<ThemedText variant="H1" colorName="graphite0" tx="newComponent.addFiles" />}
					rightChild={<IconPlus color={colors.graphite0} />}
					style={{ marginTop: 10 }}
				/>

				{/* Zapisz komponent */}
				<ThemedView
					variant="wide"
					colorName="blue2"
					onPress={() => handleSave()}
					disabled={isSaving}
					centerChild={<ThemedText variant="H1" colorName="bg_0" tx="newComponent.save" />}
					style={{ marginVertical: 10 }}
				/>

				<ThemedView
					variant="wide"
					colorName="blue2"
					// onPress={formMode === "Edit" ? handleDelete : handleForefit} //TODO (ai)
					// centerChild={<ThemedText variant="H1" colorName="bg_0" tx={formMode === "Edit" ? "common.delete" : "common.cancel"} />} //TODO(ai)
					style={{ marginVertical: 10 }}
				/>
			</ThemedView>
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
				initialDate={warrantyEndDate ?? assemblyDate}
				onClose={() => setWarrantyEndDateModalVisible(false)}
				onSave={setWarrantyEndDate}
			/>
			<DatePickerModal
				visible={expectedExchangeDateModalVisible}
				initialDate={expectedExchangeDate ?? assemblyDate}
				onClose={() => setExpectedExchangeDateModalVisible(false)}
				onSave={setExpectedExchangeDate}
			/>
		</ScrollView>
	)
}

function DateRow({
	value,
	onPress,
	t,
}: {
	value: Date | null | undefined
	onPress: () => void
	t: (key: ParseKeys) => string
}) {
	return (
		<ThemedView
			borderColor="blue1"
			colorName="bg_0"
			variant="wide"
			onPress={onPress}
			style={styles.dateField}
		>
			<ThemedText variant="H3" colorName="graphite0">
				{value ? formatDate(value, "numeric") : t("prosthesisDetails.filters.chooseDate")}
			</ThemedText>
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
				<ThemedText variant="H4" colorName="blue2">
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
	switchGroup: {
		justifyContent: "flex-start",
		gap: 10,
		alignItems: "flex-start",
		paddingVertical: 10,
	},

	fieldGroup: {
		gap: 6,
		paddingVertical: 10,
	},
	toggleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	dateField: {
		minHeight: 44,
		alignItems: "flex-start",
		paddingHorizontal: 10,
		borderRadius: 15,
	},
	modelUnavailable: {
		minHeight: 44,
		borderRadius: 15,
		justifyContent: "center",
		paddingHorizontal: 16,
		opacity: 0.6,
	},
	reminderRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginTop: 10,
	},
	reminderTitleWrapper: {
		width: "36%",
		paddingRight: 4,
	},
	checkboxesGroup: {
		flexDirection: "column",
		gap: 10,
	},
})
