import { useEffect, useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { Redirect, router } from "expo-router"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { SettingsRow } from "@/src/components/settings/SettingsRow"
import { SettingsToggle } from "@/src/components/settings/SettingsToggle"
import { useSettingsPreferences } from "@/src/hooks/useSettingsPreferences"
import {
	AccountApiError,
	deleteAccount,
	getAccountProfile,
} from "@/src/services/settingsAccountService"
import type { AuthenticatedUser } from "@/src/services/authService"
import AvatarIcon from "@/assets/icons/settings-avatar.svg"
import EditIcon from "@/assets/icons/settings-edit.svg"
import CloudCheckIcon from "@/assets/icons/settings-cloud-check.svg"
import CloudFailIcon from "@/assets/icons/settings-cloud-fail.svg"
import ChevronRightIcon from "@/assets/icons/chevron-right.svg"

export default function AccountScreen() {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { status, closeDeletedAccountSession } = useAuth()
	const { preferences, ready, updatePreference } = useSettingsPreferences()
	const [profile, setProfile] = useState<AuthenticatedUser | null>(null)
	const [profileError, setProfileError] = useState(false)
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (status !== "AUTHENTICATED") return
		let active = true
		void getAccountProfile()
			.then((user) => {
				if (active) setProfile(user)
			})
			.catch((error: unknown) => {
				console.warn("Could not load account profile", error)
				if (active) setProfileError(true)
			})
		return () => {
			active = false
		}
	}, [status])

	async function performDelete() {
		if (deleting) return
		setDeleting(true)
		try {
			await deleteAccount()
		} catch (error: unknown) {
			const key = error instanceof AccountApiError ? error.kind : "server"
			Alert.alert(t("settings34.common.error"), t(`settings34.api.${key}`))
			setDeleting(false)
			return
		}

		try {
			await closeDeletedAccountSession()
		} catch (error) {
			console.error("Failed to fully clear local data after deleting account", error)
			Alert.alert(t("settings34.common.error"), t("settings34.account.localCleanupError"))
		}
		router.replace("/")
	}

	function confirmDelete() {
		if (deleting) return
		Alert.alert(t("settings34.account.deleteAccount"), t("settings34.account.deleteConfirm"), [
			{ text: t("settings34.common.cancel"), style: "cancel" },
			{
				text: t("settings34.account.deleteAccount"),
				style: "destructive",
				onPress: () => {
					void performDelete()
				},
			},
		])
	}

	function manualSync() {
		Alert.alert(t("settings34.common.unavailable"), t("settings34.account.syncNotReady"))
	}

	const profileName = profile?.name || t("settings34.account.profileUnavailable")
	const profileEmail =
		profile?.email ||
		(profileError ? t("settings34.account.profileError") : t("settings34.account.noEmail"))
	const showConnected = !!profile

	if (status === "GUEST" || status === "UNAUTHENTICATED") {
		return <Redirect href="/settings" />
	}

	return (
		<View style={[styles.screen, { backgroundColor: colors.bg_1 }]}>
			<View style={styles.headerContainer}>
				<ThemedHeader tx="settings34.account.title" />
			</View>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
				<ThemedView colorName="bg_0" shadow style={styles.profileCard}>
					<View style={[styles.avatar, { backgroundColor: colors.blue1 }]}>
						<AvatarIcon color={colors.bg_0} width={27} height={27} />
					</View>
					<View style={styles.profileText}>
						<ThemedText variant="H0" colorName="blue2" numberOfLines={2} style={styles.profileName}>
							{profileName}
						</ThemedText>
						<ThemedText
							variant="H3"
							colorName="blue2"
							numberOfLines={2}
							style={styles.profileEmail}
						>
							{profileEmail}
						</ThemedText>
					</View>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("settings34.account.editProfile")}
						onPress={() =>
							Alert.alert(t("settings34.common.unavailable"), t("settings34.account.editNotReady"))
						}
						style={styles.editButton}
					>
						<EditIcon color={colors.magenta0} width={25} height={25} />
					</Pressable>
					<View style={styles.cloudStatus}>
						<ThemedText variant="H4" colorName="blue2" style={styles.statusText}>
							{showConnected
								? t("settings34.account.connected")
								: t("settings34.account.notConnected")}
						</ThemedText>
						{showConnected ? (
							<CloudCheckIcon color={colors.blue2} width={22} height={22} />
						) : (
							<CloudFailIcon color={colors.blue2} width={22} height={22} />
						)}
					</View>
				</ThemedView>

				<View style={styles.sections}>
					<ThemedText variant="H3" colorName="blue2" style={styles.sectionTitle}>
						{t("settings34.account.syncSettings")}
					</ThemedText>
					<SettingsRow
						title={t("settings34.account.backgroundSync")}
						description={t("settings34.account.backgroundSyncDescription")}
						right={
							<SettingsToggle
								label={t("settings34.account.backgroundSync")}
								value={preferences.backgroundSync}
								disabled={!ready}
								onValueChange={(value) => updatePreference("backgroundSync", value)}
							/>
						}
					/>
					<SettingsRow
						title={t("settings34.account.wifiOnly")}
						description={t("settings34.account.wifiOnlyDescription")}
						right={
							<SettingsToggle
								label={t("settings34.account.wifiOnly")}
								value={preferences.wifiOnly}
								disabled={!ready}
								onValueChange={(value) => updatePreference("wifiOnly", value)}
							/>
						}
					/>
					<SettingsRow
						title={t("settings34.account.mediaBackup")}
						description={t("settings34.account.mediaBackupDescription")}
						right={
							<SettingsToggle
								label={t("settings34.account.mediaBackup")}
								value={preferences.mediaBackup}
								disabled={!ready}
								onValueChange={(value) => updatePreference("mediaBackup", value)}
							/>
						}
					/>
					<View style={styles.manualSync}>
						<ThemedText variant="H4" colorName="blue2" style={styles.lastSyncText}>
							{t("settings34.account.lastSync")}:{" "}
							<ThemedText variant="H5" colorName="blue2">
								{t("settings34.account.neverSynced")}
							</ThemedText>
						</ThemedText>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("settings34.account.syncNow")}
							onPress={manualSync}
							style={styles.syncButton}
						>
							<View style={[styles.syncButtonVisual, { backgroundColor: colors.magenta0 }]}>
								<ThemedText variant="H5" style={{ color: colors.bg_0 }}>
									{t("settings34.account.syncNow")}
								</ThemedText>
							</View>
						</Pressable>
					</View>

					<ThemedText
						variant="H3"
						colorName="blue2"
						style={[styles.sectionTitle, styles.accountSection]}
					>
						{t("settings34.account.accountSettings")}
					</ThemedText>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("settings34.account.changePassword")}
						onPress={() => router.push("/settings/change-password")}
						style={[styles.navigationRow, { borderBottomColor: colors.blue1 }]}
					>
						<ThemedText variant="H3" colorName="blue2">
							{t("settings34.account.changePassword")}
						</ThemedText>
						<ChevronRightIcon color={colors.blue2} width={19} height={19} />
					</Pressable>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("settings34.account.deleteAccount")}
						onPress={confirmDelete}
						disabled={deleting}
						style={[styles.navigationRow, { borderBottomColor: colors.blue1 }]}
					>
						<ThemedText variant="H3" colorName="false">
							{t("settings34.account.deleteAccount")}
						</ThemedText>
						<ChevronRightIcon color={colors.false} width={19} height={19} />
					</Pressable>
				</View>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	headerContainer: { paddingHorizontal: "8%" },
	scrollContent: { paddingBottom: 48 },
	profileCard: {
		marginTop: 0,
		paddingHorizontal: "8%",
		paddingTop: 27,
		paddingBottom: 20,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
		flexDirection: "row",
		alignItems: "flex-start",
		flexWrap: "wrap",
	},
	avatar: {
		width: 54,
		height: 54,
		borderRadius: 27,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 22,
	},
	profileText: { flex: 1, minWidth: 0 },
	profileName: { fontSize: 22, lineHeight: 27 },
	profileEmail: { fontSize: 13, lineHeight: 19, marginTop: 3 },
	editButton: {
		width: 44,
		minHeight: 44,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 2,
	},
	cloudStatus: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: 12,
		marginTop: 3,
		paddingLeft: 76,
	},
	statusText: { fontSize: 12, lineHeight: 16, flexShrink: 1 },
	sections: { paddingHorizontal: "8%", paddingTop: 33 },
	sectionTitle: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
	manualSync: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 12,
		gap: 8,
	},
	lastSyncText: { flexShrink: 1, fontSize: 12, lineHeight: 16 },
	syncButton: {
		minHeight: 44,
		minWidth: 44,
		justifyContent: "center",
		alignItems: "center",
	},
	syncButtonVisual: {
		height: 22,
		borderRadius: 11,
		paddingHorizontal: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	accountSection: { marginTop: 39, marginBottom: 10 },
	navigationRow: {
		minHeight: 49,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
	},
})
