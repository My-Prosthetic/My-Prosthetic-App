import { useMemo } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { DropdownSelect } from "@/src/components/DropdownSelect"
import { SettingsRow } from "@/src/components/settings/SettingsRow"
import { SettingsToggle } from "@/src/components/settings/SettingsToggle"
import { useSettingsPreferences } from "@/src/hooks/useSettingsPreferences"
import InfoIcon from "@/assets/icons/info.svg"

export default function NotificationsScreen() {
	const { t } = useTranslation()
	const { colors, themeType } = useTheme()
	const { preferences, ready, updatePreference } = useSettingsPreferences()
	const timeOptions = useMemo(
		() =>
			Array.from({ length: 48 }, (_, index) => {
				const hour = String(Math.floor(index / 2)).padStart(2, "0")
				const minute = index % 2 === 0 ? "00" : "30"
				const time = `${hour}:${minute}`
				return { value: time, label: `${time} (${t("settings34.notifications.everyDay")})` }
			}),
		[t]
	)

	return (
		<View style={[styles.screen, { backgroundColor: colors.bg_1 }]}>
			<ThemedHeader tx="settings34.notifications.title" style={styles.header} />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<ThemedText variant="H3" colorName="blue2" style={styles.sectionTitle}>
					{t("settings34.notifications.sectionNotifications")}
				</ThemedText>
				<SettingsRow
					title={t("settings34.notifications.push")}
					right={
						<SettingsToggle
							label={t("settings34.notifications.push")}
							value={preferences.pushEnabled}
							disabled={!ready}
							onValueChange={(value) => updatePreference("pushEnabled", value)}
						/>
					}
				/>
				<SettingsRow
					title={t("settings34.notifications.email")}
					right={
						<SettingsToggle
							label={t("settings34.notifications.email")}
							value={preferences.emailEnabled}
							disabled={!ready}
							onValueChange={(value) => updatePreference("emailEnabled", value)}
						/>
					}
				/>

				<ThemedText
					variant="H3"
					colorName="blue2"
					style={[styles.sectionTitle, styles.secondSection]}
				>
					{t("settings34.notifications.sectionHealth")}
				</ThemedText>
				<SettingsRow
					title={t("settings34.notifications.recommendations")}
					description={t("settings34.notifications.recommendationsDescription")}
					right={
						<SettingsToggle
							label={t("settings34.notifications.recommendations")}
							value={preferences.newRecommendations}
							disabled={!ready}
							onValueChange={(value) => updatePreference("newRecommendations", value)}
						/>
					}
				/>
				<SettingsRow
					title={t("settings34.notifications.measurements")}
					description={t("settings34.notifications.measurementsDescription")}
					right={
						<SettingsToggle
							label={t("settings34.notifications.measurements")}
							value={preferences.stumpMeasurements}
							disabled={!ready}
							onValueChange={(value) => updatePreference("stumpMeasurements", value)}
						/>
					}
				/>

				<ThemedText variant="H3" colorName="blue2" style={styles.timeLabel}>
					{t("settings34.notifications.measurementTime")}
				</ThemedText>
				<DropdownSelect
					label={t("settings34.notifications.measurementTime")}
					placeholder={t("settings34.notifications.chooseTime")}
					options={timeOptions}
					value={preferences.measurementTime}
					onChange={(value) => updatePreference("measurementTime", value)}
				/>
				<View
					style={[
						styles.note,
						{ backgroundColor: themeType === "high-contrast" ? colors.bg_0 : colors.blue0 },
					]}
				>
					<View style={[styles.infoCircle, { backgroundColor: colors.blue2 }]}>
						<InfoIcon color={colors.bg_0} width={18} height={18} />
					</View>
					<ThemedText variant="H4" colorName="blue2" style={styles.noteText}>
						{t("settings34.notifications.info")}
					</ThemedText>
				</View>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	header: { width: "100%" },
	content: { paddingHorizontal: "8%", paddingTop: 38, paddingBottom: 50 },
	sectionTitle: { fontSize: 14, lineHeight: 19, marginBottom: 10 },
	secondSection: { marginTop: 40 },
	timeLabel: { fontSize: 15, lineHeight: 20, marginTop: 18, marginBottom: 12 },
	note: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 14,
		paddingVertical: 19,
		borderRadius: 20,
		marginTop: 50,
		gap: 14,
	},
	infoCircle: {
		width: 25,
		height: 25,
		borderRadius: 13,
		alignItems: "center",
		justifyContent: "center",
	},
	noteText: { flex: 1, fontSize: 12, lineHeight: 16 },
})
