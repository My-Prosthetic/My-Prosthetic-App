import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import type { ParseKeys } from "i18next"

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
import { formatDate } from "@/src/utils/dateTimeUtils"
import { useComponentForm, type ComponentFormMode } from "@/src/hooks/useComponentForm"

import IconFile from "@/assets/icons/file.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"

export default function ComponentFormScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const params = useLocalSearchParams<{
		prosthesisId?: string
		componentId?: string
		mode?: string
	}>()
	const formMode: ComponentFormMode = params.mode === "Edit" ? "Edit" : "Create"
	const {
		screenLoadState,
		componentCategories,
		category,
		brand,
		model,
		isFinal,
		isHistorical,
		assemblyDate,
		warrantyEndDate,
		expectedExchangeDate,
		description,
		remindExchangeEmail,
		remindExchangeApp,
		remindExchangePush,
		remindWarrantyEmail,
		remindWarrantyApp,
		remindWarrantyPush,
		assemblyDateModalVisible,
		warrantyEndDateModalVisible,
		expectedExchangeDateModalVisible,
		isSaving,
		handleCategoryChange,
		handleSave,
		handleLeave,
		handleDelete,
		handleOnAddFiles,
		retryLoad,
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
		setBrand,
		setModel,
		setIsFinal,
		setIsHistorical,
		setAssemblyDate,
		setWarrantyEndDate,
		setExpectedExchangeDate,
		setDescription,
		toggleRemindExchangeEmail,
		toggleRemindExchangeApp,
		toggleRemindExchangePush,
		toggleRemindWarrantyEmail,
		toggleRemindWarrantyApp,
		toggleRemindWarrantyPush,
		setAssemblyDateModalVisible,
		setWarrantyEndDateModalVisible,
		setExpectedExchangeDateModalVisible,
	} = useComponentForm(formMode, params.componentId)

	if (screenLoadState === "loading") {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ActivityIndicator size="large" color={colors.blue2} />
			</ThemedView>
		)
	}

	if (screenLoadState === "notFound" || screenLoadState === "error") {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ThemedText
					tx={
						screenLoadState === "notFound"
							? "newComponent.errors.notFound"
							: "newComponent.errors.loadComponent"
					}
					variant="H2"
					colorName="blue2"
				/>
				{screenLoadState === "error" && (
					<ThemedView colorName="blue2" onPress={retryLoad} style={styles.retryButton}>
						<ThemedText tx="prosthesisDetails.retry" variant="H2" colorName="bg_0" />
					</ThemedView>
				)}
			</ThemedView>
		)
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
			<ThemedView variant="background" colorName="bg_1">
				<ThemedHeader
					tx={formMode === "Create" ? "newComponent.newComponent" : "newComponent.editComponent"}
					onBack={handleLeave}
				/>

				{/* Kategoria podzespołu */}
				<View style={[styles.fieldGroup, styles.categoryGroup]}>
					<ThemedText variant="H1" colorName="blue2">
						{t("newComponent.fields.category")} *
					</ThemedText>
					<DropdownSelect
						label={t("newComponent.fields.category")}
						placeholder={t("newComponent.placeholders.category")}
						value={category}
						onChange={handleCategoryChange}
						options={componentCategories}
					/>
				</View>

				{category === "socket" && (
					<View style={styles.switchGroup}>
						<ThemedText variant="H1" colorName="blue2" tx="newComponent.switches.socketType" />
						<View style={styles.toggleContainer}>
							<ThemedSelectiveSwitch
								key={`final-${formMode}-${isFinal}`}
								leftLabelWidth={80}
								rightLabelWidth={80}
								leftTx="newComponent.switches.test"
								rightTx="newComponent.switches.final"
								selectLeft={() => setIsFinal(false)}
								selectRight={() => setIsFinal(true)}
								initialState={isFinal ? "right" : "left"}
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
						key={`historical-${formMode}-${isHistorical}`}
						leftLabelWidth={80}
						rightLabelWidth={80}
						rightTx="newComponent.switches.historical"
						leftTx="newComponent.switches.active"
						selectLeft={() => setIsHistorical(false)}
						selectRight={() => setIsHistorical(true)}
						initialState={isHistorical ? "right" : "left"}
						backgroundColor={colors.bg_0}
					/>
				</View>

				{/* Data montażu */}
				<View style={styles.fieldGroup}>
					<ThemedText variant="H1" colorName="blue2">
						{t("newComponent.fields.assemblyDate")} *
					</ThemedText>
					<DateRow t={t} value={assemblyDate} onPress={() => setAssemblyDateModalVisible(true)} />
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
						onClear={() => setWarrantyEndDate(null)}
					/>
					<ReminderCheckRow
						label={t("newComponent.reminders.warrantyEnd")}
						emailValue={remindWarrantyEmail}
						appValue={remindWarrantyApp}
						pushValue={remindWarrantyPush}
						onEmailChange={toggleRemindWarrantyEmail}
						onAppChange={toggleRemindWarrantyApp}
						onPushChange={toggleRemindWarrantyPush}
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
						onClear={() => setExpectedExchangeDate(null)}
					/>
					<ReminderCheckRow
						label={t("newComponent.reminders.exchangeDate")}
						emailValue={remindExchangeEmail}
						appValue={remindExchangeApp}
						pushValue={remindExchangePush}
						onEmailChange={toggleRemindExchangeEmail}
						onAppChange={toggleRemindExchangeApp}
						onPushChange={toggleRemindExchangePush}
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
					style={styles.addFiles}
				/>

				<ThemedView
					variant="wide"
					colorName="blue2"
					onPress={() => void handleSave()}
					disabled={isSaving || isLoadingBrands || isLoadingModels}
					centerChild={
						<ThemedText
							variant="H1"
							colorName="bg_0"
							tx={
								isSaving
									? "newComponent.saving"
									: formMode === "Create"
										? "newComponent.save"
										: "newComponent.saveChanges"
							}
						/>
					}
					style={styles.saveButton}
				/>
				<ThemedView
					variant="narrow"
					onPress={formMode === "Edit" ? handleDelete : handleLeave}
					style={{ paddingBottom: 20 }}
				>
					<View style={{ flexDirection: "row", gap: 20 }}>
						<IconTrash color={colors.false} />
						<ThemedText
							tx={formMode === "Edit" ? "common.delete" : "common.cancel"}
							variant="H1"
							colorName="false"
						/>
					</View>
				</ThemedView>
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
				initialDate={assemblyDate ?? new Date()}
				onClose={() => setAssemblyDateModalVisible(false)}
				onSave={setAssemblyDate}
			/>
			<DatePickerModal
				visible={warrantyEndDateModalVisible}
				initialDate={warrantyEndDate ?? assemblyDate ?? new Date()}
				onClose={() => setWarrantyEndDateModalVisible(false)}
				onSave={setWarrantyEndDate}
			/>
			<DatePickerModal
				visible={expectedExchangeDateModalVisible}
				initialDate={expectedExchangeDate ?? assemblyDate ?? new Date()}
				onClose={() => setExpectedExchangeDateModalVisible(false)}
				onSave={setExpectedExchangeDate}
			/>
		</ScrollView>
	)
}

function DateRow({
	value,
	onPress,
	onClear,
	t,
}: {
	value: Date | null
	onPress: () => void
	onClear?: () => void
	t: (key: ParseKeys) => string
}) {
	return (
		<View style={styles.dateRow}>
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
			{value && onClear && (
				<ThemedView onPress={onClear} style={styles.clearDate}>
					<ThemedText tx="common.delete" variant="H4" colorName="false" />
				</ThemedView>
			)}
		</View>
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
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	retryButton: {
		marginTop: 16,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 16,
	},
	categoryGroup: {
		paddingTop: 0,
		paddingBottom: 10,
	},
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
	dateRow: {
		gap: 6,
	},
	dateField: {
		minHeight: 44,
		alignItems: "flex-start",
		paddingHorizontal: 10,
		borderRadius: 15,
	},
	clearDate: {
		alignSelf: "flex-start",
		paddingHorizontal: 8,
		paddingVertical: 4,
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
	addFiles: {
		marginTop: 10,
	},
	saveButton: {
		marginVertical: 20,
	},
})
