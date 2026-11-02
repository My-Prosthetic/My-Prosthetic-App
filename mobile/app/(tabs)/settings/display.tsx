import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { useTheme } from "@/context/ThemeContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { StyleSheet, ScrollView } from "react-native"
import { ThemedToggleSwitch } from "@/src/components/settings/ThemedToggleSwitch"
import { useState } from "react"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import { SettingsOptionModal } from "@/src/components/settings/SettingsOptionModal"
import { LANGUAGE_OPTIONS, DATE_FORMAT_OPTIONS } from "@/src/components/settings/SettingsOptions"
import { useSettings } from "@/context/SettingsContext"
import { useTranslation } from "react-i18next"
// import { useTts } from "@/src/hooks/useTts"

export default function DisplayScreen() {
	const { colors, colorMode, highContrast, setColorMode, setHighContrast } = useTheme()
	type SelectionModal = "language" | "date" | null
	const [openModal, setOpenModal] = useState<SelectionModal>(null)
	const { dateFormat, setDateFormat, language, setLanguage, ttsEnabled, setTtsEnabled } =
		useSettings()
	const { t } = useTranslation()
	const translatedLanguageOptions = LANGUAGE_OPTIONS.map((option) => ({
		value: option.value,
		label: t(option.labelKey),
	}))

	const languageLabel =
		translatedLanguageOptions.find((option) => option.value === language)?.label ?? language

	// const { speak } = useTts()

	return (
		<ThemedView variant="background" colorName="bg_1">
			<ThemedHeader tx="display.name" />
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* INTERFACE SETTINGS */}
				<ThemedText
					variant="H1"
					tx="display.interface.title"
					style={styles.sectionTitle}
					colorName="blue2"
				/>
				<ThemedView style={styles.subsectionRow}>
					<ThemedText variant="H2" tx="display.interface.darkMode" colorName="blue2" />
					<ThemedToggleSwitch
						value={colorMode === "dark"}
						onValueChange={(enabled) => {
							setColorMode(enabled ? "dark" : "light")
						}}
					/>
				</ThemedView>
				<ThemedView variant="divider" colorName="blue1" />
				<ThemedView style={styles.subsectionRow}>
					<ThemedText variant="H2" tx="display.interface.contrast" colorName="blue2" />
					<ThemedToggleSwitch value={highContrast} onValueChange={setHighContrast} />
				</ThemedView>
				<ThemedView variant="divider" colorName="blue1" />

				{/* ACCESSIBILITY SETTINGS */}
				<ThemedText
					variant="H1"
					tx="display.accessibility.title"
					style={styles.sectionTitle}
					colorName="blue2"
				/>
				<ThemedView style={styles.subsectionRow}>
					<ThemedText variant="H2" tx="display.accessibility.tts" colorName="blue2" />
					<ThemedToggleSwitch value={ttsEnabled} onValueChange={setTtsEnabled} />
				</ThemedView>
				<ThemedView variant="divider" colorName="blue1" />
				{/* <ThemedText
					variant="H1"
					colorName="false"
					onPress={() =>
						speak(language === "pl" ? "Czytanie ekranu jest włączone" : "Screen reading is enabled")
					}
				>
					PRESS ME TO TEST TTS !!!!!!
				</ThemedText> */}
				<ThemedView variant="divider" colorName="blue1" />
				{/* LANGUAGE & REGION SETTINGS */}
				<ThemedText
					variant="H1"
					tx="display.region.title"
					style={styles.sectionTitle}
					colorName="blue2"
				/>
				<ThemedView style={styles.subsectionRow} onPress={() => setOpenModal("language")}>
					<ThemedText variant="H2" tx="display.region.language" colorName="blue2" />
					<ThemedView style={styles.rightBtn}>
						<ThemedText variant="H4" colorName="blue1">
							{languageLabel}
						</ThemedText>
						<IconChevronRight color={colors.blue2} style={styles.docChevron} />
					</ThemedView>
				</ThemedView>
				<ThemedView variant="divider" colorName="blue1" />
				<ThemedView style={styles.subsectionRow} onPress={() => setOpenModal("date")}>
					<ThemedText variant="H2" tx="display.region.date" colorName="blue2" />
					<ThemedView style={styles.rightBtn}>
						<ThemedText variant="H4" colorName="blue1">
							{dateFormat}
						</ThemedText>
						<IconChevronRight color={colors.blue2} style={styles.docChevron} />
					</ThemedView>
				</ThemedView>
				<ThemedView variant="divider" colorName="blue1" />
				<SettingsOptionModal
					visible={openModal === "language"}
					title={t("display.modals.chooseLanguage")}
					options={translatedLanguageOptions}
					selectedValue={language}
					onSelect={(value) => {
						setLanguage(value)
						setOpenModal(null)
					}}
					onClose={() => setOpenModal(null)}
				/>
				<SettingsOptionModal
					visible={openModal === "date"}
					title={t("display.modals.chooseDateFormat")}
					options={DATE_FORMAT_OPTIONS}
					selectedValue={dateFormat}
					onSelect={(value) => {
						setDateFormat(value)
						setOpenModal(null)
					}}
					onClose={() => setOpenModal(null)}
				/>{" "}
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	sectionTitle: {
		marginTop: 40,
		marginBottom: 16,
	},
	subsectionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: 44,
		paddingTop: 6,
		paddingBottom: 6,
		marginTop: 6,
	},
	docChevron: {
		height: 20,
	},
	rightBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 15,
	},
	fontSizeSlider: {
		width: "100%",
		height: 44,
	},
	scrollView: {
		flex: 1,
		width: "100%",
	},
})
