import React, { useEffect, useState, useMemo } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedInput } from "../ThemedInput"
import { DropdownSelect } from "@/src/components/DropdownSelect"
import { DatePickerModal } from "@/src/components/DatePicker"
import { formatDate } from "@/src/utils/dateFormatter"
import { useTheme, ThemeColors } from "@/context/ThemeContext"
import {
	FUNDING_SOURCE_IDS,
	FundingSource,
	getFundingSourceOptions,
} from "@/src/constants/fundingSources"

import {
	createDeposit,
	deleteDeposit,
	Deposit,
	getDepositById,
	updateDeposit,
} from "@/db/repositories/depositRepository"

import IconHand from "@/assets/icons/save-money-dollar.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconChevronDown from "@/assets/icons/chevron-down.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"

interface DepositFormProps {
	mode: "create" | "edit"
}

export function DepositForm({ mode }: DepositFormProps) {
	const { colors } = useTheme()
	const styles = getStyles(colors)
	const { t } = useTranslation()
	const params = useLocalSearchParams<{ goalId?: string; depositId?: string }>()

	//TODO dynamic currency value from user settings
	const currency = "PLN"

	const goalId =
		mode === "create"
			? Number.isSafeInteger(Number(params.goalId)) && Number(params.goalId) > 0
				? Number(params.goalId)
				: null
			: null

	const depositId =
		mode === "edit"
			? Number.isSafeInteger(Number(params.depositId)) && Number(params.depositId) > 0
				? Number(params.depositId)
				: null
			: null

	const [deposit, setDeposit] = useState<Deposit>()
	const [amount, setAmount] = useState("")
	const [note, setNote] = useState("")
	const [fundingSource, setFundingSource] = useState<FundingSource>()
	const [isLoading, setIsLoading] = useState(mode === "edit")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [dateModalVisible, setDateModalVisible] = useState(false)
	const [selectedDate, setSelectedDate] = useState(new Date())
	const options = useMemo(() => getFundingSourceOptions(t), [t])

	useEffect(() => {
		if (mode !== "edit") return

		const fetchDeposit = async () => {
			if (depositId === null) {
				Alert.alert(t("common.error"), t("funding.depositNotFound"))
				setIsLoading(false)
				router.back()
				return
			}

			try {
				const savedDeposit = await getDepositById(depositId)
				if (!savedDeposit) {
					Alert.alert(t("common.error"), t("funding.depositNotFound"))
					router.back()
					return
				}

				setDeposit(savedDeposit)
				setAmount(String(savedDeposit.amount / 100))
				setNote(savedDeposit.note ?? "")
				setSelectedDate(new Date(savedDeposit.assignedAt))
				setFundingSource(
					(FUNDING_SOURCE_IDS as readonly string[]).includes(savedDeposit.source)
						? (savedDeposit.source as FundingSource)
						: "other"
				)
			} catch (error) {
				console.error("Błąd podczas pobierania wpłaty:", error)
				Alert.alert(t("common.error"), t("funding.loadDepositError"))
				router.back()
			} finally {
				setIsLoading(false)
			}
		}

		fetchDeposit()
	}, [depositId, mode, t])

	const handleSave = async () => {
		if (isSubmitting) return
		if (mode === "create" && goalId === null) {
			Alert.alert(t("common.error"), t("funding.goalNotFound"))
			return
		}
		if (mode === "edit" && depositId === null) {
			Alert.alert(t("common.error"), t("funding.depositNotFound"))
			return
		}
		if (!fundingSource) {
			Alert.alert(t("common.error"), t("funding.selectFundingSource"))
			return
		}

		const parsedAmount = parseFloat(amount.replace(",", "."))
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			Alert.alert(t("common.error"), t("funding.invalidAmountError"))
			return
		}

		try {
			setIsSubmitting(true)
			const values = {
				source: fundingSource,
				amount: Math.round(parsedAmount * 100),
				assignedAt: selectedDate.toISOString(),
				note: note.trim() || null,
			}

			if (mode === "create") {
				await createDeposit({ goalId: goalId!, ...values })
			} else {
				await updateDeposit(depositId!, values)
			}

			router.back()
		} catch (error) {
			console.error("Błąd podczas zapisu wpłaty:", error)
			Alert.alert(
				t("common.error"),
				t(mode === "create" ? "funding.saveDepositError" : "funding.updateDepositError")
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDelete = () => {
		if (isSubmitting || mode !== "edit" || depositId === null) return

		Alert.alert(t("funding.deleteDepositTitle"), t("funding.deleteDepositMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					try {
						setIsSubmitting(true)
						await deleteDeposit(depositId)
						router.back()
					} catch (error) {
						console.error("Błąd podczas usuwania wpłaty:", error)
						Alert.alert(t("common.error"), t("funding.deleteDepositError"))
					} finally {
						setIsSubmitting(false)
					}
				},
			},
		])
	}

	if (isLoading || (mode === "edit" && !deposit)) {
		return (
			<ThemedView colorName="tertiary_base_2" variant="background" style={styles.loading}>
				<ActivityIndicator color={colors.primary_base} />
			</ThemedView>
		)
	}

	return (
		<ScrollView>
			<ThemedView colorName="bg_1" variant="background" style={styles.screen}>
				<View style={{ paddingBottom: 40 }}>
					<View style={styles.formSection}>
						<ThemedText
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
							tx="funding.fundingSource"
						/>
						<DropdownSelect
							label={t("funding.fundingSource")}
							placeholder={t("funding.select")}
							options={options}
							value={fundingSource}
							onChange={setFundingSource}
						/>
					</View>
					<View style={styles.formSection}>
						<ThemedText
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
							tx="funding.grantedAmount"
						/>
						<ThemedInput
							variant="money"
							currency={currency}
							value={amount}
							onChangeText={setAmount}
							placeholder="0"
							viewStyle={{ backgroundColor: colors.bg_0 }}
						/>
					</View>

					<View style={styles.formSection}>
						<ThemedText
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
							tx="funding.decisionDate"
						/>
						<ThemedView
							borderColor="blue1"
							colorName="bg_0"
							variant="wide"
							onPress={() => setDateModalVisible(true)}
							leftChild={
								<ThemedText variant="H3" colorName="graphite0">
									{formatDate(selectedDate, "numeric")}
								</ThemedText>
							}
							rightChild={<IconChevronDown color={colors.blue1} />}
						/>
					</View>
					<View style={styles.formSection}>
						<ThemedText
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
							tx="funding.additionalNote"
						/>
						<ThemedInput
							variant="note"
							value={note}
							onChangeText={setNote}
							placeholder={t("funding.notePlaceholder")}
							multiline
							viewStyle={{ backgroundColor: colors.bg_0 }}
						/>
					</View>
				</View>

				<View style={styles.actions}>
					{mode === "create" ? (
						<ThemedView
							variant={"wide"}
							colorName="blue2"
							onPress={isSubmitting ? undefined : handleSave}
							leftChild={<IconHand color={colors.bg_0} />}
							centerChild={
								<ThemedText
									variant="H1"
									colorName="bg_0"
									tx={"funding.addToWallet"}
									numberOfLines={1}
									adjustsFontSizeToFit
								/>
							}
							rightChild={<IconPlus color={colors.bg_0} />}
						/>
					) : (
						<ThemedView
							variant={"narrow"}
							colorName="blue2"
							onPress={isSubmitting ? undefined : handleSave}
							centerChild={
								<ThemedText
									variant="H1"
									colorName="bg_0"
									tx={"common.save"}
									numberOfLines={1}
									adjustsFontSizeToFit
								/>
							}
						/>
					)}
					<ThemedView
						onPress={mode === "edit" ? handleDelete : () => router.back()}
						style={{ flexDirection: "row", gap: 10 }}
					>
						<IconTrash color={colors.false} />
						<ThemedText
							tx={mode === "edit" ? "common.delete" : "common.cancel"}
							variant="H1"
							colorName="false"
						/>
					</ThemedView>
				</View>
				<DatePickerModal
					visible={dateModalVisible}
					initialDate={selectedDate}
					onClose={() => setDateModalVisible(false)}
					onSave={setSelectedDate}
				/>
			</ThemedView>
		</ScrollView>
	)
}

const getStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		screen: { justifyContent: "flex-start" },
		loading: { alignItems: "center", justifyContent: "center" },
		formSection: { marginTop: 15 },
		fieldLabel: { marginBottom: 8 },
		actions: { gap: 16, marginBottom: 16, alignItems: "center" },
	})
