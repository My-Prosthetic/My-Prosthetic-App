import React, { useEffect, useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedInput } from "../ThemedInput"
import { useTheme, ThemeColors } from "@/context/ThemeContext"
import {
	createGoal,
	deleteGoal,
	Goal,
	getGoalById,
	updateGoal,
} from "@/db/repositories/goalRepository"

import IconTrash from "@/assets/icons/trash-bin.svg"
import { ThemedHeader } from "../ThemedHeader"

interface GoalFormProps {
	mode: "create" | "edit"
}

export function GoalForm({ mode }: GoalFormProps) {
	const { colors } = useTheme()
	const styles = getStyles(colors)
	const { t } = useTranslation()

	//TODO dynamic currency value from user settings
	const currency = "PLN"

	const { goalId } = useLocalSearchParams<{ goalId?: string }>()
	const id =
		mode === "edit"
			? Number.isSafeInteger(Number(goalId)) && Number(goalId) > 0
				? Number(goalId)
				: null
			: null
	const [goal, setGoal] = useState<Goal>()
	const [name, setName] = useState("")
	const [amount, setAmount] = useState("")
	const [note, setNote] = useState("")
	const [isLoading, setIsLoading] = useState(mode === "edit")
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (mode !== "edit") {
			return
		}

		const fetchGoal = async () => {
			if (id === null) {
				Alert.alert(t("common.error"), t("funding.goalNotFound"))
				setIsLoading(false)
				router.back()
				return
			}

			try {
				const savedGoal = await getGoalById(id)
				if (!savedGoal) {
					Alert.alert(t("common.error"), t("funding.goalNotFound"))
					router.back()
					return
				}

				setGoal(savedGoal)
				setName(savedGoal.name)
				setAmount(String(savedGoal.amount / 100))
				setNote(savedGoal.note ?? "")
			} catch (error) {
				console.error("Błąd podczas pobierania celu:", error)
				Alert.alert(t("common.error"), t("funding.loadGoalError"))
				router.back()
			} finally {
				setIsLoading(false)
			}
		}

		fetchGoal()
	}, [id, mode, t])

	const handleSave = async () => {
		if (isSubmitting) {
			return
		}

		if (mode === "edit" && id === null) {
			Alert.alert(t("common.error"), t("funding.goalNotFound"))
			return
		}

		if (!name.trim()) {
			Alert.alert(t("common.error"), t("funding.emptyGoalNameError"))
			return
		}

		const parsedAmount = parseFloat(amount.replace(",", "."))
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			Alert.alert(t("common.error"), t("funding.invalidGoalAmountError"))
			return
		}

		try {
			setIsSubmitting(true)
			const values = {
				name: name.trim(),
				amount: Math.round(parsedAmount * 100),
				note: note.trim() || null,
			}

			if (mode === "create") {
				await createGoal(values)
			} else {
				await updateGoal(id!, values)
			}

			router.back()
		} catch (error) {
			console.error("Błąd podczas zapisu celu:", error)
			Alert.alert(
				t("common.error"),
				t(mode === "create" ? "funding.saveGoalError" : "funding.updateGoalError")
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDelete = () => {
		if (isSubmitting || mode !== "edit" || id === null) {
			return
		}

		Alert.alert(t("funding.deleteGoalTitle"), t("funding.deleteGoalMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					try {
						setIsSubmitting(true)
						await deleteGoal(id)
						router.back()
					} catch (error) {
						console.error("Błąd podczas usuwania celu:", error)
						Alert.alert(t("common.error"), t("funding.deleteGoalError"))
					} finally {
						setIsSubmitting(false)
					}
				},
			},
		])
	}

	if (isLoading || (mode === "edit" && !goal)) {
		return (
			<ThemedView colorName="bg_0" variant="background" style={styles.loading}>
				<ActivityIndicator color={colors.blue2} />
			</ThemedView>
		)
	}

	return (
		<ThemedView colorName="bg_1" variant="background">
			<ThemedHeader tx={mode === "create" ? "funding.addGoalTitle" : "funding.editGoalTitle"} />
			<View style={styles.screen}>
				<View>
					<View style={styles.formSection}>
						<ThemedText
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
							tx="funding.goalName"
						/>
						<ThemedInput
							variant="regular"
							value={name}
							onChangeText={setName}
							placeholder={t("funding.goalNamePlaceholder")}
							viewStyle={styles.input}
						/>
					</View>

					<View style={styles.formSection}>
						<ThemedText
							variant="H1"
							colorName="blue2"
							style={styles.fieldLabel}
							tx="funding.goalAmount"
						/>
						<ThemedInput
							variant="money"
							currency={currency}
							value={amount}
							onChangeText={setAmount}
							keyboardType="decimal-pad"
							placeholder="0"
							viewStyle={styles.input}
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
							viewStyle={styles.input}
						/>
					</View>
				</View>

				<View style={styles.actions}>
					{mode === "create" ? (
						<ThemedView
							variant={"narrow"}
							colorName="blue2"
							onPress={isSubmitting ? undefined : handleSave}
							centerChild={
								<ThemedText
									variant="H1"
									colorName="bg_0"
									tx={"funding.addGoalAction"}
									numberOfLines={1}
									adjustsFontSizeToFit
								/>
							}
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
			</View>
		</ThemedView>
	)
}

const getStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		screen: { justifyContent: "space-between", flexDirection: "column", flex: 1 },
		loading: { alignItems: "center", justifyContent: "center" },
		formSection: { marginTop: 15 },
		fieldLabel: { marginBottom: 8 },
		input: { backgroundColor: colors.bg_0 },
		actions: { gap: 16, marginBottom: 16, alignItems: "center" },
	})
