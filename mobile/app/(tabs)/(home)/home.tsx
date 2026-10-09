import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Dimensions } from "react-native"
import { useTranslation } from "react-i18next"
import { useTheme, ThemeColors } from "@/context/ThemeContext"
import { useRouter } from "expo-router"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import { getLatestUser } from "@/db/repositories/userRepository"
import { useAuth } from "@/context/AuthContext"
import { Carousel } from "@/src/components/Carousel"
import { formatDateBadge } from "@/src/utils/dateFormatter"

import IconPlus from "@/assets/icons/plus.svg"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconEventLive from "@/assets/icons/event-live-outline-thin.svg"
import IconMeasure from "@/assets/icons/measure-filled.svg"
import IconMagnifyingGlass from "@/assets/icons/magnifying_glass_dolar.svg"
import IconFile from "@/assets/icons/file.svg"
import IconLegLogo from "@/assets/icons/leg_logo.svg"

//TODO widok protezy jako component, generowany na podstawie aktualnie zaznaczonej protezy, z możliwością przesuwania między nimi
//TODO zdefiniowaćtype User do userList i userName -> userLogged typu <User>

export default function HomeScreen() {
	const [currentDate, setCurrentDate] = useState(() => new Date())
	const [userName, setUserName] = useState<string>("")
	const router = useRouter()

	const { i18n } = useTranslation()
	const { colors } = useTheme()
	const { status } = useAuth()

	const styles = getStyles(colors)

	useEffect(() => {
		const timer = setInterval(() => setCurrentDate(new Date()), 60_000)
		return () => clearInterval(timer)
	}, [])

	const locale = i18n.resolvedLanguage ?? i18n.language
	const {
		day,
		month,
		accessibilityLabel: dateAccessibilityLabel,
	} = formatDateBadge(currentDate, locale)

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

	const renderAddProsthesis = () => {
		return (
			<ThemedView
				colorName="blue2"
				style={styles.prostheticCard}
				onPress={() => router.push("/prosthesis/new")}
			>
				<View style={styles.cardIcon}>
					<IconPlus color={colors.blue0} width={70} height={70} />
				</View>
				<ThemedText tx="home.addProsthesis" variant="H2" colorName="bg_0" />
			</ThemedView>
		)
	}

	const renderProsthesisCard = (name: string) => {
		return (
			<ThemedView colorName="blue2" style={styles.prostheticCard}>
				<View style={styles.cardIcon}>
					<IconLegLogo color={colors.blue0} />
				</View>
				<ThemedText variant="H2" colorName="bg_0">
					{name}
				</ThemedText>
			</ThemedView>
		)
	}

	//TODO
	const onHandleShowFullHistory = () => {}
	const onHandleAddMeasurement = () => {}
	const onHandleAddIncident = () => {}
	const onHandleMyFiles = () => {}

	//MOCKS
	interface Activity {
		name: string
		when: string
	}

	const mockActivities: Activity[] = [
		{ name: "Ostatni pomiar:", when: "Dzisiaj, 08:30" },
		{ name: "Ostatni incydent:", when: "5 dni temu" },
	]

	const renderActivity = (activity: Activity, index: number) => {
		const isLast = index === mockActivities.length - 1

		return (
			<View key={index}>
				<ThemedView
					key={index}
					style={styles.activityRow}
					leftChild={<ThemedView colorName="blue1" style={styles.timelineDot} />}
					centerChild={
						<ThemedText variant="H2" colorName="blue2">
							{activity.name}
						</ThemedText>
					}
					rightChild={
						<ThemedText variant="H2" colorName="blue2">
							{activity.when}
						</ThemedText>
					}
				/>
				{!isLast && <View style={styles.timelineLine} />}
			</View>
		)
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<ThemedView
				colorName="bg_1"
				variant="background"
				style={{ paddingTop: status === "GUEST" ? 10 : 50, paddingHorizontal: 0 }}
			>
				<ThemedView variant="background" colorName="bg_1">
					{/* ----------------- NAGŁÓWEK (CZEŚĆ USER!) ----------------- */}
					<ThemedView variant="wide" style={styles.headerRow}>
						<ThemedText
							tx={status === "GUEST" ? "home.greetingGuest" : "home.greetingUser"}
							txOptions={{ name: userName }}
							colorName="blue2"
							style={styles.greeting}
						/>
						<ThemedView
							colorName="blue0"
							style={styles.dateBadge}
							accessibilityLabel={dateAccessibilityLabel}
						>
							<ThemedText variant="H0" colorName="blue2">
								{day}
							</ThemedText>
							<ThemedText variant="H1" colorName="blue2">
								{month}
							</ThemedText>
						</ThemedView>
					</ThemedView>

					{/* ----------------- SEKCJA: MOJE PROTEZY ----------------- */}
					{/* TODO real data */}
					<Carousel
						items={["Codzienna"]}
						renderItem={renderProsthesisCard}
						renderPlus={renderAddProsthesis}
					/>
				</ThemedView>

				{/*TODO shadow jest nierównomierny między górą i dołem*/}
				<ThemedView variant="background" colorName="bg_0" shadow style={styles.activitySection}>
					<ThemedText tx="home.lastActivity" variant="H1" colorName="blue2" />
					<ThemedView variant="divider" style={styles.divider} colorName="blue0" />
					{mockActivities.map(renderActivity)}
				</ThemedView>

				<View style={styles.showFullHistory}>
					<ThemedText
						tx="home.showFullHistory"
						variant="H2"
						colorName="magenta0"
						onPress={onHandleShowFullHistory}
						style={{ alignSelf: "flex-end", textAlign: "right" }}
					/>
				</View>
				<ThemedView variant="background" colorName="bg_1" style={styles.bottomSection}>
					{/* ----------------- SEKCJA: SZYBKIE PRZYCISKI AKCJI ----------------- */}
					<ThemedView
						variant="wide"
						colorName="blue2"
						onPress={onHandleAddIncident}
						leftChild={<IconEventLive color={colors.bg_0} />}
						centerChild={<ThemedText tx="home.addIncident" variant="H1" colorName="bg_0" />}
						rightChild={<IconPlus color={colors.bg_0} />}
					/>

					<ThemedView
						variant="wide"
						colorName="blue2"
						onPress={onHandleAddMeasurement}
						leftChild={<IconMeasure color={colors.bg_0} />}
						centerChild={<ThemedText tx="home.addMeasure" variant="H1" colorName="bg_0" />}
						rightChild={<IconPlus color={colors.bg_0} />}
					/>

					<ThemedView
						variant="wide"
						colorName="blue0"
						onPress={() => router.push("./funding/accumulated_funds")}
						leftChild={<IconMagnifyingGlass color={colors.graphite0} />}
						centerChild={<ThemedText tx="home.funding" variant="H1" colorName="graphite0" />}
						rightChild={<IconChevronRight color={colors.graphite0} />}
					/>

					<ThemedView
						variant="wide"
						colorName="blue0"
						onPress={onHandleMyFiles}
						leftChild={<IconFile color={colors.graphite0} />}
						centerChild={<ThemedText tx="home.myFiles" variant="H1" colorName="graphite0" />}
						rightChild={<IconChevronRight color={colors.graphite0} />}
					/>
				</ThemedView>
			</ThemedView>
		</ScrollView>
	)
}

const windowWidth = Dimensions.get("window").width

const getStyles = (colors: ThemeColors) => {
	return StyleSheet.create({
		headerRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: 24,
		},
		greeting: {
			textAlign: "left",
			fontFamily: "Montserrat-Bold",
			textTransform: "none",
		},
		dateBadge: {
			width: 60,
			height: 60,
			borderRadius: 10,
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			gap: 2,
		},
		prostheticCard: {
			width: windowWidth * 0.6,
			height: windowWidth * 0.6,
			borderRadius: 30,
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "center",
			gap: 20,
			paddingBottom: 15,
		},
		cardIcon: {
			flex: 1,
			justifyContent: "center",
			marginTop: 50,
		},
		showFullHistory: {
			alignSelf: "flex-end",
			paddingRight: 40,
			marginBottom: 15,
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
		cardContainer: {
			flexDirection: "column",
			borderRadius: 16,
			marginTop: 20,
			width: "100%",
			paddingVertical: 18,
			alignItems: "center",
		},
		headerText: {
			textAlign: "center",
			marginBottom: 12,
		},
		listContainer: {
			width: "100%",
		},
		activityRow: {
			width: "100%",
			minHeight: 44,
			backgroundColor: "transparent",
		},
		timelineContainer: {
			width: 16,
			height: 25,
			alignItems: "center",
			justifyContent: "center",
			position: "relative",
		},
		timelineDot: {
			width: 12,
			height: 12,
			borderRadius: 6,
			zIndex: 2,
		},
		timelineLine: {
			borderRadius: 1000,
			width: 2,
			height: 25,
			marginLeft: 23,
			overflow: "visible",
			marginVertical: -10,
			backgroundColor: colors.blue1,
		},
		divider: {
			width: "75%",
			marginTop: 5,
		},
		activitySection: {
			borderRadius: 0,
			marginTop: 20,
			paddingTop: 15,
			paddingBottom: 10,
		},
		bottomSection: {
			gap: 20,
			paddingBottom: 30,
		},
	})
}
