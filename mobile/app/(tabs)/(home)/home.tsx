import { useState, useEffect } from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useTranslation } from "react-i18next"
import { Ionicons } from "@expo/vector-icons"
import { useTheme, ThemeColors } from "@/context/ThemeContext"
import { useRouter } from "expo-router"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import { getLatestUser } from "@/db/repositories/userRepository"
import { useAuth } from "@/context/AuthContext"

//TODO widok protezy jako component, generowany na podstawie aktualnie zaznaczonej protezy, z możliwością przesuwania między nimi
//TODO zdefiniowaćtype User do userList i userName -> userLogged typu <User>
//TODO pasek ostatniej aktywności: 1. poprawić layout   2. Możliwość generowania dowolnie długiej listy na podstawie danych/json

export default function HomeScreen() {
	const [userName, setUserName] = useState<string>("")
	const [showAddProsthesisCard, setShowAddProsthesisCard] = useState(false)
	const router = useRouter()

	const { t, i18n } = useTranslation()
	const { colors, themeType, setTheme } = useTheme()
	const { status } = useAuth()

	const styles = getStyles(colors)

	useEffect(() => {
		let isMounted = true
		void getLatestUser()
			.then((user) => {
				if (isMounted) setUserName(user?.name ?? "")
			})
			.catch((err: Error) => console.error("Błąd odczytu użytkownika:", err))

		return () => {
			isMounted = false
		}
	}, [])

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={[
				styles.container,
				{ paddingTop: status === "GUEST" ? 0 : 50, alignItems: "center" },
			]}
			showsVerticalScrollIndicator={false}
		>
			{/* ----------------- NAGŁÓWEK (CZEŚĆ USER!) ----------------- */}
			<ThemedView variant="old_wide" colorName="tertiary_base_2" style={styles.headerRow}>
				<ThemedText
					tx={status === "GUEST" ? "home.greetingGuest" : "home.greetingUser"}
					txOptions={{ name: userName.toLocaleUpperCase() }}
					colorName="primary_base"
					style={{ textAlign: "left" }}
				/>
				<View style={styles.handIconContainer}>
					<Ionicons name="hand-left" size={48} color={colors.primary_base} />
				</View>
			</ThemedView>

			{/* ----------------- SEKCJA: MOJE PROTEZY ----------------- */}
			<ThemedView
				variant="old_wide"
				colorName="tertiary_base_3"
				shadow={true}
				style={styles.sectionContainer}
			>
				<ThemedText tx="home.myProsthetics" variant="main1Button" style={{ padding: 16 }} />

				<View style={styles.carouselRow}>
					{/* Lewa strzałka karuzeli */}
					<TouchableOpacity
						style={styles.carouselArrow}
						onPress={() => setShowAddProsthesisCard(false)}
						disabled={!showAddProsthesisCard}
						accessibilityRole="button"
					>
						<Ionicons
							name="chevron-back"
							size={32}
							color={showAddProsthesisCard ? colors.primary_base : colors.primary_base_3}
						/>
					</TouchableOpacity>

					{/* Główna karta protezy */}
					{showAddProsthesisCard ? (
						<TouchableOpacity
							style={styles.prostheticCard}
							onPress={() => router.push("/prosthesis/new")}
							accessibilityRole="button"
						>
							<View style={styles.addProsthesisCircle}>
								<Ionicons name="add" size={54} color={colors.primary_base} />
							</View>

							<Text style={styles.prostheticCardText}>{t("home.addProsthesis")}</Text>
						</TouchableOpacity>
					) : (
						<View style={styles.prostheticCard}>
							{/* Logo protezy */}
							<Image
								source={require("../../../assets/mp_logo_accent.png")}
								style={styles.logoImage}
								resizeMode="contain"
							/>
							<Text style={styles.prostheticCardText}>{t("home.prostheticDaily")}</Text>
						</View>
					)}

					{/* Prawa strzałka karuzeli */}
					<TouchableOpacity
						style={styles.carouselArrow}
						onPress={() => setShowAddProsthesisCard(true)}
						disabled={showAddProsthesisCard}
						accessibilityRole="button"
					>
						<Ionicons
							name="chevron-forward"
							size={32}
							color={showAddProsthesisCard ? colors.primary_base_3 : colors.primary_base}
						/>
					</TouchableOpacity>
				</View>
			</ThemedView>

			{/* ----------------- SEKCJA: SZYBKIE PRZYCISKI AKCJI ----------------- */}
			<View style={styles.actionButtonsRow}>
				{/* Przycisk: Dodaj Pomiar */}
				<ThemedView colorName="tertiary_base_3" shadow={true} style={styles.actionButtonCard}>
					<ThemedText tx="home.addMeasure" variant="main1Button" style={{ textAlign: "center" }} />
				</ThemedView>
				<ThemedView
					colorName="accent_base_1"
					shadow={true}
					style={[styles.actionButtonCard, { borderWidth: 4, borderColor: colors.primary_base }]}
				>
					<ThemedText tx="home.addIncident" variant="main1Button" style={{ textAlign: "center" }} />
				</ThemedView>
			</View>

			{/* ----------------- SEKCJA: OSTATNIA AKTYWNOŚĆ ----------------- */}
			<ThemedText
				tx="home.lastActivity"
				variant="main1Button"
				colorName="secondary_base_0c"
				style={{ textAlign: "center", marginBottom: 15 }}
			/>
			<ThemedView
				colorName="tertiary_base_3"
				variant="old_wide"
				style={{ borderWidth: 1, borderColor: colors.secondary_base_0c }}
			>
				<View style={styles.activityCard}>
					{/* Element osi czasu 1: Pomiar kikuta */}
					<View style={styles.activityRow}>
						<View style={styles.activityContent}>
							<Text style={styles.activityLabel}>{t("home.lastStumpMeasurement")}</Text>
							<Text style={styles.activityValue}>{t("home.todayAt", { time: "8:30" })}</Text>
						</View>
					</View>

					{/* Element osi czasu 2: Ostatni incydent */}
					<View style={styles.activityRow}>
						<View style={styles.activityContent}>
							<Text style={styles.activityLabel}>{t("home.lastIncident")}</Text>
							<Text style={styles.activityValue}>{t("home.daysAgo", { count: 5 })}</Text>
						</View>
					</View>
				</View>
			</ThemedView>

			<ThemedView
				variant="old_wide"
				colorName="tertiary_base_2"
				style={{
					flexDirection: "row",
					justifyContent: "flex-end",
					paddingVertical: 0,
					paddingHorizontal: 8,
				}}
			>
				<ThemedText tx="home.showFullHistory" variant="subTitle1" colorName="secondary_base_0c" />
			</ThemedView>

			{/* ----------------- SEKCJA: UTILITY BUTTONS (NA DOLE) ----------------- */}

			<ThemedView
				onPress={() => router.push("./funding/accumulated_funds")}
				variant="old_wide"
				colorName="tertiary_base_3"
				shadow={true}
				style={{ justifyContent: "space-between", marginBottom: 32 }}
			>
				<Ionicons name="cash-outline" size={24} color={colors.primary_base} />
				<ThemedText tx="home.funding" variant="main1Button" colorName="primary_base" />
				<Ionicons name="chevron-forward" size={24} color={colors.primary_base} />
			</ThemedView>
			<ThemedView
				variant="old_wide"
				colorName="tertiary_base_3"
				shadow={true}
				style={{ justifyContent: "space-between", marginBottom: 60 }}
			>
				<Ionicons name="document-text-outline" size={24} color={colors.primary_base} />
				<ThemedText tx="home.myFiles" variant="main1Button" colorName="primary_base" />
				<Ionicons name="chevron-forward" size={24} color={colors.primary_base} />
			</ThemedView>

			{/* ----------------- PRZEŁĄCZNIK MOTYWU DEWELOPERSKI ----------------- */}
			<ThemedText
				onPress={() => setTheme(themeType === "light" ? "high-contrast" : "light")}
				variant="subTitle1"
				tx={themeType === "light" ? "home.switchToHighContrast" : "home.switchToLightTheme"}
			/>

			{/* ----------------- PROSTY PRZEŁĄCZNIK JĘZYKA (DEWELOPERSKI) ----------------- */}

			<ThemedText
				onPress={() => {
					const nextLang = i18n.language.startsWith("pl") ? "en" : "pl"
					i18n.changeLanguage(nextLang)
				}}
				variant="subTitle1"
			>
				{i18n.language.startsWith("pl")
					? "Zmień język: English (EN)"
					: "Change language: Polski (PL)"}
			</ThemedText>
		</ScrollView>
	)
}

const getStyles = (colors: ThemeColors) => {
	return StyleSheet.create({
		scrollView: {
			flex: 1,
			backgroundColor: colors.tertiary_base_2,
		},
		container: {
			paddingHorizontal: 24,
			paddingBottom: 40,
		},
		headerRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: 24,
		},
		handIconContainer: {
			transform: [{ rotate: "-45deg" }],
		},
		sectionContainer: {
			flexDirection: "column",
			alignItems: "center",
			marginBottom: 32,
			borderRadius: 40,
		},
		carouselRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between", // Zmieniono na space-between dla lepszego rozkładu
			width: "100%",
		},
		carouselArrow: {
			padding: 5,
		},
		prostheticCard: {
			width: 200, // Zmniejszono nieco kartę, aby wszystko się mieściło
			height: 200,
			backgroundColor: colors.primary_base,
			borderRadius: 40,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.15,
			shadowRadius: 10,
			elevation: 6,
			borderColor: colors.primary_base,
		},
		logoImage: {
			width: 120,
			height: 120,
			marginBottom: 10,
		},
		addProsthesisCircle: {
			width: 82,
			height: 82,
			borderRadius: 41,
			backgroundColor: colors.accent_base,
			justifyContent: "center",
			alignItems: "center",
			marginBottom: 24,
		},
		prostheticCardText: {
			fontSize: 14,
			fontWeight: "600",
			color: colors.accent_base,
			textAlign: "center",
		},
		actionButtonsRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "stretch",
			marginBottom: 28,
			width: "100%",
			gap: 20,
		},
		actionButtonCard: {
			width: "45%",
			minHeight: 100,
			paddingHorizontal: 18,
			paddingVertical: 20,
			borderRadius: 20,
			alignItems: "center",
			justifyContent: "center",
		},
		activityCard: {
			width: "100%",
			backgroundColor: colors.tertiary_base_2,
			borderRadius: 20,
			paddingHorizontal: 10,
			borderColor: colors.primary_base,
		},
		activityRow: {
			flexDirection: "row",
			marginBottom: 10,
		},
		activityContent: {
			flex: 1,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		activityLabel: {
			fontSize: 14,
			color: colors.primary_base,
		},
		activityValue: {
			fontSize: 14,
			fontWeight: "bold",
			color: colors.primary_base,
		},
	})
}
