import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react"
import i18n from "@/translations/i18n"

export type DateFormat = "YYYY-MM-DD" | "DD-MM-YYYY" | "MM-DD-YYYY"
export type Language = "pl" | "en"

interface SettingsContextType {
	language: Language
	setLanguage: (language: Language) => void

	dateFormat: DateFormat
	setDateFormat: (format: DateFormat) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const DATE_FORMAT_STORAGE_KEY = "dateFormat"

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>("pl")
	const [dateFormat, setDateFormatState] = useState<DateFormat>("YYYY-MM-DD")

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const savedLanguage = await AsyncStorage.getItem("language")

				const savedDateFormat = await AsyncStorage.getItem("dateFormat")

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

		void AsyncStorage.setItem("language", language)
		void i18n.changeLanguage(language)
	}

	return (
		<SettingsContext.Provider
			value={{
				dateFormat,
				setDateFormat,
				language,
				setLanguage,
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
