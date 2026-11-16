import React, { createContext, ReactNode, useContext, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export interface ThemeColors {
	warning: string
	false: string
	true: string
	bg_0: string
	bg_1: string
	bg_2: string
	blue0: string
	blue1: string
	blue2: string
	graphite0: string
	magenta0: string
}

export const lightTheme: ThemeColors = {
	warning: "#ED9D1D",
	false: "#B51932",
	true: "#15A959",
	bg_0: "#FAFCFF",
	bg_1: "#F1F6FB",
	bg_2: "#E0E6EE",
	blue0: "#D3EEFF",
	blue1: "#72AACC",
	blue2: "#065A8E",
	graphite0: "#2B3A51",
	magenta0: "#B74CC5",
}

// TODO: verify dark theme contrast, especially text readability
export const darkTheme: ThemeColors = {
	warning: "#F5B041",
	false: "#E5546B",
	true: "#34C77B",
	bg_0: "#0B1220",
	bg_1: "#121A2B",
	bg_2: "#1B2538",
	blue0: "#12324A",
	blue1: "#5E9BC2",
	blue2: "#4DA6DE",
	graphite0: "#A9B6CC",
	magenta0: "#D177DD",
}

// TODO: verify high contrast theme, especially text readability
export const highContrastTheme: ThemeColors = {
	warning: "#FF8C00",
	false: "#B51932",
	true: "#15A959",
	bg_0: "#FAFCFF",
	bg_1: "#F1F6FB",
	bg_2: "#E0E6EE",
	blue0: "#000080",
	blue1: "#000080",
	blue2: "#000080",
	graphite0: "#121212",
	magenta0: "#F2CA19",
}

// TODO: verify high contrast theme, especially text readability
export const highContrastDarkTheme: ThemeColors = {
	warning: "#FFB000",
	false: "#FF5C77",
	true: "#2EDB84",
	bg_0: "#000000",
	bg_1: "#080C14",
	bg_2: "#121926",
	blue0: "#00315A",
	blue1: "#7FC3F0",
	blue2: "#66D0FF",
	graphite0: "#D5DEEC",
	magenta0: "#F08CFF",
}

type ColorMode = "light" | "dark"

interface ThemeContextType {
	colorMode: ColorMode
	highContrast: boolean
	colors: ThemeColors
	setColorMode: (mode: ColorMode) => void
	setHighContrast: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const COLOR_MODE_STORAGE_KEY = "colorMode"
const HIGH_CONTRAST_STORAGE_KEY = "highContrast"

const getThemeColors = (colorMode: ColorMode, highContrast: boolean): ThemeColors => {
	if (colorMode === "dark" && highContrast) {
		return highContrastDarkTheme
	}

	if (highContrast) {
		return highContrastTheme
	}

	if (colorMode === "dark") {
		return darkTheme
	}

	return lightTheme
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [colorMode, setColorModeState] = useState<ColorMode>("light")

	const [highContrast, setHighContrastState] = useState(false)

	useEffect(() => {
		const loadTheme = async () => {
			try {
				const savedColorMode = await AsyncStorage.getItem(COLOR_MODE_STORAGE_KEY)

				const savedHighContrast = await AsyncStorage.getItem(HIGH_CONTRAST_STORAGE_KEY)

				if (savedColorMode === "light" || savedColorMode === "dark") {
					setColorModeState(savedColorMode)
				}

				if (savedHighContrast !== null) {
					setHighContrastState(savedHighContrast === "true")
				}
			} catch (error) {
				console.error("Failed to load theme settings:", error)
			}
		}

		void loadTheme()
	}, [])

	const setColorMode = (mode: ColorMode) => {
		setColorModeState(mode)

		void AsyncStorage.setItem(COLOR_MODE_STORAGE_KEY, mode)
	}

	const setHighContrast = (enabled: boolean) => {
		setHighContrastState(enabled)

		void AsyncStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(enabled))
	}

	const colors = getThemeColors(colorMode, highContrast)

	return (
		<ThemeContext.Provider
			value={{
				colorMode,
				highContrast,
				colors,
				setColorMode,
				setHighContrast,
			}}
		>
			{children}
		</ThemeContext.Provider>
	)
}

export const useTheme = () => {
	const context = useContext(ThemeContext)

	if (!context) {
		throw new Error("useTheme musi być użyty wewnątrz ThemeProvider")
	}

	return context
}
