import { useState, useEffect } from "react"
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
} from "react-native"
import { useTranslation } from "react-i18next"
import { Ionicons } from "@expo/vector-icons"
import { useTheme, ThemeColors } from "@/context/ThemeContext"
import { useRouter } from "expo-router"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { db } from "@/db/client"
import { users } from "@/db/schema/users"
import migrations from "@/drizzle/migrations"

//TODO widok protezy jako component, generowany na podstawie aktualnie zaznaczonej protezy, z możliwością przesuwania między nimi
//TODO zdefiniowaćtype User do userList i userName -> userLogged typu <User>
//TODO pasek ostatniej aktywności: 1. poprawić layout   2. Możliwość generowania dowolnie długiej listy na podstawie danych/json

export default function HomeScreen() {
	const { success, error } = useMigrations(db, migrations)
	const [userName, setUserName] = useState<string>("(init value)")

	const router = useRouter()

	const { t, i18n } = useTranslation()
	const { colors, themeType, setTheme } = useTheme()

	const styles = getStyles(colors)

	// Funkcja odczytująca użytkowników z bazy danych
	const fetchUsers = async () => {
		try {
			const allUsers = await db.select().from(users)

			if (allUsers.length > 0) {
				setUserName(allUsers[allUsers.length - 1].name)
			} else {
				setUserName("(pusta baza)")
			}
		} catch (err) {
			console.error("Błąd odczytu z bazy:", err)
		}
	}

	// Automatyczny odczyt po załadowaniu bazy i wykonaniu migracji
	useEffect(() => {
		if (success) {
			queueMicrotask(() => fetchUsers())
		}
	}, [success])

	if (error) {
		return (
			<View style={styles.container}>
				<Text>Błąd migracji bazy danych: {error.message}</Text>
			</View>
		)
	}

	if (!success) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" />
				<Text>Inicjalizacja bazy danych...</Text>
			</View>
		)
	}

	// 2. Funkcja dodająca testowy rekord (striggeruje odczytanie z bazy jako osobny proces)
	const handleAddUser = async () => {
		try {
			const testName = "Tym"

			await db.insert(users).values({ name: testName })

			await fetchUsers()
		} catch (err) {
			console.error("Błąd zapisu:", err)
		}
	}

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={styles.container}
			showsVerticalScrollIndicator={false}
		>
			{/* ----------------- NAGŁÓWEK (CZEŚĆ USER!) ----------------- */}
			<ThemedView variant="wide" colorName="tertiary_base_2" style={styles.headerRow}>
				<ThemedText
					tx="home.greeting"
					txOptions={{ name: userName.toLocaleUpperCase() }}
					colorName="primary_base"
					style={{ textAlign: "left" }}
				/>
				<TouchableOpacity style={styles.handIconContainer} onPress={handleAddUser}>
					<Ionicons name="hand-left" size={48} color={colors.primary_base} />
				</TouchableOpacity>
			</ThemedView>

			{/* ----------------- SEKCJA: MOJE PROTEZY ----------------- */}
			<ThemedView
				variant="wide"
				colorName="tertiary_base_3"
				shadow={true}
				style={styles.sectionContainer}
			>
				<ThemedText tx="home.myProsthetics" variant="main1Button" style={{ padding: 16 }} />

				<View style={styles.carouselRow}>
					{/* Lewa strzałka karuzeli */}
					<TouchableOpacity style={styles.carouselArrow}>
						<Ionicons name="chevron-back" size={32} color={colors.primary_base} />
					</TouchableOpacity>

					{/* Główna karta protezy */}
					<View style={styles.prostheticCard}>
						{/* Logo protezy */}
						<Image
							source={require("../../../assets/mp_logo_accent.png")}
							style={styles.logoImage}
							resizeMode="contain"
						/>
						<Text style={styles.prostheticCardText}>{t("home.prostheticDaily")}</Text>
					</View>

					{/* Prawa strzałka karuzeli */}
					<TouchableOpacity style={styles.carouselArrow}>
						<Ionicons name="chevron-forward" size={32} color={colors.primary_base} />
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
				variant="wide"
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
				variant="wide"
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
				variant="wide"
				colorName="tertiary_base_3"
				shadow={true}
				style={{ justifyContent: "space-between", marginBottom: 32 }}
			>
				<Ionicons name="cash-outline" size={24} color={colors.primary_base} />
				<ThemedText tx="home.funding" variant="main1Button" colorName="primary_base" />
				<Ionicons name="chevron-forward" size={24} color={colors.primary_base} />
			</ThemedView>
			<ThemedView
				variant="wide"
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
				style={{ alignSelf: "center" }}
			/>

			{/* ----------------- PROSTY PRZEŁĄCZNIK JĘZYKA (DEWELOPERSKI) ----------------- */}

			<ThemedText
				onPress={() => {
					const nextLang = i18n.language.startsWith("pl") ? "en" : "pl"
					i18n.changeLanguage(nextLang)
				}}
				variant="subTitle1"
				style={{ alignSelf: "center" }}
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
			paddingTop: 50,
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
