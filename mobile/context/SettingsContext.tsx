import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react"
import i18n from "@/translations/i18n"

export type DateFormat = "YYYY-MM-DD" | "DD-MM-YYYY" | "MM-DD-YYYY"
export type Language = "pl" | "en"
export type FontSize = "small" | "medium" | "large" | "extra-large"

interface SettingsContextType {
	language: Language
	setLanguage: (language: Language) => void

	dateFormat: DateFormat
	setDateFormat: (format: DateFormat) => void

	fontSize: FontSize
	setFontSize: (fontSize: FontSize) => void

	ttsEnabled: boolean
	setTtsEnabled: (ttsEnabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const DATE_FORMAT_STORAGE_KEY = "dateFormat"
const LANGUAGE_STORAGE_KEY = "language"
const FONT_SIZE_STORAGE_KEY = "fontSize"
const TTS_ENABLED_STORAGE_KEY = "ttsEnabled"

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>("pl")
	const [dateFormat, setDateFormatState] = useState<DateFormat>("YYYY-MM-DD")
	const [fontSize, setFontSizeState] = useState<FontSize>("medium")
	const [ttsEnabled, setTtsEnabledState] = useState(false)

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const savedDateFormat = await AsyncStorage.getItem(DATE_FORMAT_STORAGE_KEY)
				const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
				const savedFontSize = await AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY)
				const savedTtsEnabled = await AsyncStorage.getItem(TTS_ENABLED_STORAGE_KEY)

				if (savedLanguage === "pl" || savedLanguage === "en") {
					setLanguageState(savedLanguage)
					await i18n.changeLanguage(savedLanguage)
				}

				if (
					savedDateFormat === "YYYY-MM-DD" ||
					savedDateFormat === "DD-MM-YYYY" ||
					savedDateFormat === "MM-DD-YYYY"
				) {
					setDateFormatState(savedDateFormat)
				}

				if (
					savedFontSize === "small" ||
					savedFontSize === "medium" ||
					savedFontSize === "large" ||
					savedFontSize === "extra-large"
				) {
					setFontSizeState(savedFontSize)
				}

				if (savedTtsEnabled !== null) {
					setTtsEnabledState(savedTtsEnabled === "true")
				}
			} catch (error) {
				console.error("Failed to load settings:", error)
			}
		}

		void loadSettings()
	}, [])

	const setDateFormat = (format: DateFormat) => {
		setDateFormatState(format)

		void AsyncStorage.setItem(DATE_FORMAT_STORAGE_KEY, format)
	}

	const setLanguage = (language: Language) => {
		setLanguageState(language)

		void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
		void i18n.changeLanguage(language)
	}

	const setFontSize = (fontSize: FontSize) => {
		setFontSizeState(fontSize)

		void AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize)
	}

	const setTtsEnabled = (enabled: boolean) => {
		setTtsEnabledState(enabled)
		void AsyncStorage.setItem(TTS_ENABLED_STORAGE_KEY, String(enabled))
	}

	return (
		<SettingsContext.Provider
			value={{
				dateFormat,
				setDateFormat,
				language,
				setLanguage,
				fontSize,
				setFontSize,
				ttsEnabled,
				setTtsEnabled,
			}}
		>
			{children}
		</SettingsContext.Provider>
	)
}

export function useSettings() {
	const context = useContext(SettingsContext)

	if (!context) {
		throw new Error("useSettings must be used inside SettingsProvider")
	}

	return context
}
