import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { useTheme } from "@/context/ThemeContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { StyleSheet } from "react-native"
import { ThemedToggleSwitch } from "@/src/components/settings/ThemedToggleSwitch"
import { useState } from "react"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import { SettingsOptionModal } from "@/src/components/settings/SettingsOptionModal"
import {
	LANGUAGE_OPTIONS,
	DATE_FORMAT_OPTIONS,
	FONT_SIZE_OPTIONS,
} from "@/src/components/settings/SettingsOptions"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/src/utils/dateFormatter"
import { useTranslation } from "react-i18next"
import Slider from "@react-native-community/slider"
import { useTts } from "@/src/hooks/useTts"

export default function DisplayScreen() {
	const { colors, colorMode, highContrast, setColorMode, setHighContrast } = useTheme()
	type SelectionModal = "language" | "date" | "fontSize" | null
	const [openModal, setOpenModal] = useState<SelectionModal>(null)
	const {
		dateFormat,
		setDateFormat,
		language,
		setLanguage,
		fontSize,
		setFontSize,
		ttsEnabled,
		setTtsEnabled,
	} = useSettings()
	const { t } = useTranslation()
	const translatedFontSizeOptions = FONT_SIZE_OPTIONS.map((option) => ({
		value: option.value,
		label: t(option.labelKey),
	}))
	const translatedLanguageOptions = LANGUAGE_OPTIONS.map((option) => ({
		value: option.value,
		label: t(option.labelKey),
	}))
	const fontSizeIndex = FONT_SIZE_OPTIONS.findIndex((option) => option.value === fontSize)

	const languageLabel =
		translatedLanguageOptions.find((option) => option.value === language)?.label ?? language

	const fontSizeLabel =
		translatedFontSizeOptions.find((option) => option.value === fontSize)?.label ?? fontSize
	// remove below after done testing
	const testDate = new Date(2026, 9, 31)

	const { speak } = useTts()

	return (
		<ThemedView variant="background" colorName="bg_1">
			<ThemedHeader tx="display.name" />

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

			<ThemedView style={styles.subsectionRow} onPress={() => setOpenModal("fontSize")}>
				<ThemedText variant="H2" tx="display.interface.fontSize" colorName="blue2" />
				<ThemedView style={styles.rightBtn}>
					<ThemedText variant="H4" colorName="blue1">
						{fontSizeLabel}
					</ThemedText>
					<IconChevronRight color={colors.blue2} style={styles.docChevron} />
				</ThemedView>
			</ThemedView>

			<ThemedView variant="divider" colorName="blue1" />

			<ThemedView>
				<ThemedView style={styles.subsectionRow}>
					<ThemedText variant="H2" tx="display.interface.fontSize" colorName="blue2" />

					<ThemedText variant="H4" colorName="blue1">
						{fontSizeLabel}
					</ThemedText>
				</ThemedView>

				<Slider
					minimumValue={0}
					maximumValue={FONT_SIZE_OPTIONS.length - 1}
					step={1}
					value={fontSizeIndex}
					onValueChange={(index) => {
						const option = FONT_SIZE_OPTIONS[index]

						if (option) {
							setFontSize(option.value)
						}
					}}
					minimumTrackTintColor={colors.blue2}
					maximumTrackTintColor={colors.blue1}
					style={styles.fontSizeSlider}
					thumbTintColor={colors.blue2}
				/>
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

			<ThemedText
				variant="H1"
				colorName="false"
				onPress={() =>
					speak(language === "pl" ? "Czytanie ekranu jest włączone" : "Screen reading is enabled")
				}
			>
				{" "}
				PRESS ME TO TEST TTS !!!!!!
			</ThemedText>

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

			<ThemedText variant="H2" colorName="blue2">
				Test date - remove after done testing:{" "}
				{formatDate(testDate, "numeric", new Date(), dateFormat)}
			</ThemedText>

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
			/>

			<SettingsOptionModal
				visible={openModal === "fontSize"}
				title={t("display.modals.chooseFontSize")}
				options={translatedFontSizeOptions}
				selectedValue={fontSize}
				onSelect={(value) => {
					setFontSize(value)
					setOpenModal(null)
				}}
				onClose={() => setOpenModal(null)}
			/>
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
})
