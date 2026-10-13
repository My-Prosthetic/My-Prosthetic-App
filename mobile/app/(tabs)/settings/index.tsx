import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import type { ParseKeys } from "i18next"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { getLatestUser } from "@/db/repositories/userRepository"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

interface SettingsRowProps {
	tx: ParseKeys
	onPress?: () => void
}

function SettingsRow({ tx, onPress }: SettingsRowProps) {
	const { colors } = useTheme()

	return (
		<ThemedView
			variant="wide"
			onPress={onPress}
			style={[styles.row, { borderBottomColor: colors.blue0 }]}
			childrenContainerStyle={styles.rowContent}
			centerChild={<ThemedText tx={tx} variant="H2" colorName="blue2" style={styles.rowLabel} />}
			rightChild={<Ionicons name="chevron-forward" size={30} color={colors.blue1} />}
			accessibilityRole={onPress ? "button" : undefined}
		/>
	)
}

export default function SettingsScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { status, logout } = useAuth()
	const [userName, setUserName] = useState("")

	const isGuest = status === "GUEST"

	useEffect(() => {
		if (status !== "AUTHENTICATED") {
			return
		}

		let cancelled = false

		const loadUser = async () => {
			try {
				const user = await getLatestUser()

				if (!cancelled) {
					setUserName(user?.name ?? "")
				}
			} catch (error) {
				console.error("Failed to load user in settings:", error)
			}
		}

		void loadUser()

		return () => {
			cancelled = true
		}
	}, [status])

	return (
		<ThemedView colorName="bg_1" style={styles.screen}>
			<ThemedHeader tx="settings.title" style={[styles.header, { backgroundColor: colors.bg_0 }]} />

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<ThemedView colorName="bg_0" shadow style={styles.userCard}>
					<View style={[styles.avatar, { backgroundColor: colors.blue1 }]}>
						<Ionicons name="person-outline" size={38} color={colors.bg_0} />
					</View>

					<View style={styles.userInfo}>
						{isGuest ? (
							<ThemedText
								tx="settings.guest.title"
								variant="H0"
								colorName="blue2"
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.78}
							/>
						) : userName ? (
							<ThemedText
								variant="H0"
								colorName="blue2"
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.78}
							>
								{userName}
							</ThemedText>
						) : (
							<ThemedText
								tx="settings.account.userFallback"
								variant="H0"
								colorName="blue2"
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.78}
							/>
						)}

						{isGuest ? (
							<>
								<ThemedText tx="settings.guest.noBackup" variant="H4" colorName="blue2" />
								<ThemedText
									tx="settings.guest.limitedSharing"
									variant="H4"
									colorName="blue2"
									style={styles.guestDescription}
								/>
							</>
						) : (
							<View style={styles.syncRow}>
								<ThemedText tx="settings.account.synced" variant="H4" colorName="blue2" />
								<Ionicons name="cloud-done-outline" size={19} color={colors.blue2} />
							</View>
						)}
					</View>
				</ThemedView>

				<View style={styles.content}>
					<View style={styles.section}>
						<ThemedText
							tx="settings.sections.sharing"
							variant="H1"
							colorName="blue2"
							style={styles.sectionTitle}
						/>

						{!isGuest && <SettingsRow tx="settings.rows.specialists" />}

						<SettingsRow
							tx="settings.rows.export"
							onPress={() => router.push("/(tabs)/settings/export")}
						/>
					</View>

					<View style={styles.section}>
						<ThemedText
							tx="settings.sections.settings"
							variant="H1"
							colorName="blue2"
							style={styles.sectionTitle}
						/>

						{!isGuest && <SettingsRow tx="settings.rows.accountSync" />}

						<SettingsRow tx="settings.rows.appearanceLanguage" />
						<SettingsRow tx="settings.rows.notifications" />
					</View>

					<View style={styles.section}>
						<ThemedText
							tx="settings.sections.information"
							variant="H1"
							colorName="blue2"
							style={styles.sectionTitle}
						/>

						<SettingsRow tx="settings.rows.about" />
					</View>

					<View style={styles.actionWrapper}>
						<ThemedView
							variant="wide"
							colorName="blue2"
							onPress={logout}
							style={styles.actionButton}
							centerChild={
								<ThemedText
									tx={isGuest ? "settings.loginOrCreate" : "settings.logout"}
									variant="H2"
									colorName="bg_0"
									style={styles.actionLabel}
								/>
							}
						/>
					</View>
				</View>
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		flexDirection: "column",
		alignItems: "stretch",
		justifyContent: "flex-start",
		borderRadius: 0,
	},
	header: {
		minHeight: 92,
		justifyContent: "flex-end",
		paddingBottom: 18,
		borderRadius: 0,
		elevation: 4,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 20,
	},
	userCard: {
		width: "100%",
		minHeight: 140,
		paddingHorizontal: "8%",
		paddingVertical: 22,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: 26,
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
	},
	avatar: {
		width: 54,
		height: 54,
		borderRadius: 27,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	userInfo: {
		flex: 1,
		gap: 7,
	},
	guestDescription: {
		maxWidth: 270,
	},
	syncRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flexWrap: "wrap",
	},
	content: {
		flex: 1,
		paddingHorizontal: "8%",
	},
	section: {
		marginTop: 28,
	},
	sectionTitle: {
		marginBottom: 13,
	},
	row: {
		minHeight: 44,
		width: "100%",
		borderRadius: 0,
		borderBottomWidth: 1,
		justifyContent: "center",
		alignItems: "stretch",
	},
	rowContent: {
		paddingHorizontal: 0,
		gap: 8,
	},
	rowLabel: {
		width: "100%",
	},
	actionWrapper: {
		marginTop: 46,
		marginBottom: 8,
	},
	actionButton: {
		width: "100%",
		minHeight: 50,
		borderRadius: 20,
	},
	actionLabel: {
		textTransform: "uppercase",
		textAlign: "center",
	},
})
