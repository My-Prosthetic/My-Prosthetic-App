import React, { useState, useCallback, useRef, useEffect } from "react"
import { StyleSheet, View, ScrollView, Dimensions, Alert } from "react-native"
import { useFocusEffect, router } from "expo-router"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/src/utils/currencyFormatter"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { useTheme, ThemeColors } from "@/context/ThemeContext"

import { Deposit, getDeposits } from "@/db/repositories/depositRepository"
import { Goal, getGoals } from "@/db/repositories/goalRepository"

import IconPencil from "@/assets/icons/pencil.svg"
import IconHandCoin from "@/assets/icons/save-money-dollar.svg"
import IconPlus from "@/assets/icons/plus.svg"
import { Carousel } from "@/src/components/Carousel"

const sourceIds = ["family", "fundraiser", "grant", "savings", "other"] as const
const sourceTranslationKeys = {
	family: "funding.sources.family",
	fundraiser: "funding.sources.fundraiser",
	grant: "funding.sources.grant",
	savings: "funding.sources.savings",
	other: "funding.sources.other",
} as const

export default function AccumulatedFundsScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const styles = getStyles(colors)
	const windowWidth = Dimensions.get("window").width

	//TODO dynamic currency value from user settings
	const currency = "PLN"

	const [goalsList, setGoalsList] = useState<Goal[]>([])
	const [depositsList, setDepositsList] = useState<Deposit[]>([])
	const [currentGoalIndex, setCurrentGoalIndex] = useState(0)
	const [loading, setLoading] = useState(true)
	const indexRef = useRef(currentGoalIndex)

	useEffect(() => {
		indexRef.current = currentGoalIndex
	}, [currentGoalIndex])

	const currentGoal: Goal | undefined = goalsList[currentGoalIndex]

	const getSourceLabel = (source: string) =>
		sourceIds.includes(source as (typeof sourceIds)[number])
			? t(sourceTranslationKeys[source as (typeof sourceIds)[number]])
			: source

	const accumulatedDeposit = depositsList.reduce(
		(total, item: Deposit) => total + (item.amount / 100 || 0),
		0
	)

	const progressPercentage = currentGoal?.amount
		? Math.min((accumulatedDeposit / (currentGoal.amount / 100)) * 100, 100)
		: 0

	const handleEditGoal = () => {
		if (!currentGoal) return
		router.push({
			pathname: "/funding/edit_goal",
			params: { goalId: String(currentGoal.id) },
		})
	}

	const fetchDeposits = async (goalId: number) => {
		try {
			const data = await getDeposits(goalId)
			setDepositsList(data)
		} catch (error) {
			console.error("Błąd podczas pobierania wpłat:", error)
			Alert.alert(t("funding.loadDepositError"))
			setDepositsList([])
		}
	}

	const handleIndexChange = (newIndex: number) => {
		setCurrentGoalIndex(newIndex)
		const targetGoal = goalsList[newIndex]

		if (targetGoal?.id) {
			fetchDeposits(targetGoal.id)
		} else {
			setDepositsList([])
		}
	}

	useFocusEffect(
		useCallback(() => {
			let isActive = true

			const refreshScreen = async () => {
				try {
					setLoading(true)
					const goals = await getGoals()
					if (!isActive) return

					setGoalsList(goals)
					const safeIndex = goals.length > 0 ? Math.min(indexRef.current, goals.length) : 0

					if (safeIndex !== indexRef.current) {
						setCurrentGoalIndex(safeIndex)
						indexRef.current = safeIndex
					}
					const activeGoal = goals[safeIndex]

					if (activeGoal?.id) {
						const deposits = await getDeposits(activeGoal.id)
						if (isActive) setDepositsList(deposits)
					} else {
						if (isActive) setDepositsList([])
					}
				} catch (error) {
					console.error("Błąd podczas ładowania danych ekranu:", error)
					Alert.alert(t("funding.loadDepositError"))
					setDepositsList([])
				} finally {
					if (isActive) setLoading(false)
				}
			}

			refreshScreen()

			return () => {
				isActive = false
			}
		}, [t])
	)

	const renderAddGoal = () => (
		<ThemedView
			variant="wide"
			colorName="bg_0"
			shadow
			style={styles.summaryCard}
			onPress={() => router.push("/funding/new_goal")}
		>
			<View>
				<ThemedText
					tx="funding.addGoal"
					variant="H0"
					colorName="blue2"
					style={{ textAlign: "center" }}
				/>
			</View>
		</ThemedView>
	)

	const renderGoalSummary = (goal: Goal) => (
		<ThemedView variant="wide" colorName="bg_0" shadow style={styles.summaryCard}>
			<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
				<ThemedText
					variant="H4"
					colorName="blue2"
					tx="funding.collected"
					style={{ paddingRight: 20 }}
				/>

				<ThemedView variant="tag" colorName="blue0" style={{ maxWidth: "68%" }}>
					<ThemedText
						variant="H4"
						colorName="blue2"
						style={{ paddingHorizontal: 10 }}
						numberOfLines={1}
					>
						{goal.name}
					</ThemedText>
				</ThemedView>
			</View>
			<ThemedText variant="H0" style={{ paddingTop: 6 }} colorName="blue2">
				{formatCurrency(accumulatedDeposit, currency)}
			</ThemedText>

			<View style={styles.progressBarBackground}>
				<View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
			</View>
			<ThemedView
				childrenContainerStyle={{ paddingHorizontal: 0 }}
				leftChild={
					<ThemedText variant="H4" colorName="blue2">
						{Math.floor(progressPercentage)}% {t("funding.outOf")}{" "}
						{formatCurrency(goal.amount / 100, currency)}
					</ThemedText>
				}
				rightChild={
					<ThemedView
						style={{ flexDirection: "row", gap: 10 }}
						onPress={handleEditGoal}
						hitSlop={{ top: 13, bottom: 13 }}
					>
						<ThemedText variant="H4" colorName="magenta0" tx="funding.editGoalTitle" />
						<IconPencil color={colors.magenta0} width={18} height={18} />
					</ThemedView>
				}
			/>
		</ThemedView>
	)

	return (
		<View style={{ marginTop: 15, flex: 1 }}>
			<ThemedText
				variant="H1"
				colorName="blue2"
				tx="funding.prostheticBudget"
				style={{ textAlign: "left" }}
			/>
			{!loading && (
				<View style={{ flex: 1 }}>
					<Carousel
						items={goalsList}
						renderItem={renderGoalSummary}
						renderPlus={renderAddGoal}
						setExternalIndex={handleIndexChange}
						cardStyle={{ width: 0.84 * windowWidth }}
						carouselStyle={{ marginHorizontal: -0.08 * windowWidth, alignSelf: "stretch" }}
						chevronScale={0.6}
						adjustChevronPadding={-7.5}
						initialIndex={currentGoalIndex}
					/>
					{currentGoal !== undefined && (
						<View style={{ flex: 1 }}>
							{/*LISTA ZAPISANYCH WPŁAT*/}
							<ThemedText
								variant="H1"
								colorName="blue2"
								tx="funding.savedSources"
								style={{ marginVertical: 8 }}
							/>
							<ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
								<View>
									{depositsList.length === 0 ? (
										<ThemedText
											variant="H2"
											colorName="blue2"
											style={{ textAlign: "center", paddingVertical: 20 }}
											tx="funding.noDeposits"
										/>
									) : (
										depositsList.map((deposit) => (
											<View key={deposit.id}>
												<ThemedView
													variant="wide"
													style={styles.depositItem}
													onPress={() =>
														router.push({
															pathname: "/funding/edit_deposit",
															params: { depositId: String(deposit.id) },
														})
													}
												>
													<ThemedText
														variant="H2"
														colorName="blue2"
														style={{ paddingVertical: 10 }}
													>
														{deposit.source ? getSourceLabel(deposit.source) : t("funding.deposit")}
													</ThemedText>
													<View style={{ flexDirection: "row", gap: 12 }}>
														<ThemedText variant="H2" colorName="blue2">
															{formatCurrency(deposit.amount / 100 || 0, currency)}
														</ThemedText>
														<IconPencil color={colors.magenta0} width={18} height={18} />
													</View>
												</ThemedView>
												<ThemedView variant="divider" colorName="blue1" />
											</View>
										))
									)}
								</View>
							</ScrollView>

							{/*DODAJ UZYSKANE ŚRODKI*/}
							<ThemedView
								variant="wide"
								colorName="blue2"
								onPress={() =>
									router.push({
										pathname: "/funding/new_deposit",
										params: { goalId: String(currentGoal.id) },
									})
								}
								style={{ marginVertical: 16 }}
								leftChild={<IconHandCoin color={colors.bg_0} width={30} height={30} />}
								centerChild={<ThemedText variant="H1" tx="funding.addDeposit" colorName="bg_0" />}
								rightChild={<IconPlus color={colors.bg_0} width={18} height={18} />}
							/>
						</View>
					)}
				</View>
			)}
		</View>
	)
}

const getStyles = (colors: ThemeColors) => {
	const styles = StyleSheet.create({
		summaryCard: {
			padding: 16,
			flexDirection: "column",
			marginVertical: 15,
			height: 130,
		},
		progressBarBackground: {
			height: 8,
			backgroundColor: colors.blue0,
			borderRadius: 1000,
			overflow: "hidden",
			width: "100%",
			marginVertical: 10,
		},
		progressBarFill: {
			height: "100%",
			backgroundColor: colors.blue2,
			borderRadius: 1000,
		},
		depositItem: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
	})
	return styles
}
