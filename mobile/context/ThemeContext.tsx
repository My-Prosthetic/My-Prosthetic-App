import React, { createContext, useContext, useState, ReactNode } from "react"

export interface ThemeColors {
	primary_base: string
	primary_base_1: string
	primary_base_2: string
	primary_base_3: string
	primary_base_4: string
	secondary_base_0c: string
	secondary_base: string
	secondary_base_2: string
	secondary_base_3: string
	tertiary_base_1: string
	tertiary_base_2: string
	tertiary_base_3: string
	accent_base: string
	accent_base_1: string
	accent_base_2: string
	warning: string
	false: string
	false_1: string
	false_2: string
	neutral_text: string
	neutral_gray: string
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
	primary_base: "#052D8F",
	primary_base_1: "#3757A5",
	primary_base_2: "#6981BC",
	primary_base_3: "#9BABD2",
	primary_base_4: "#CDD5E9",
	secondary_base_0c: "#1967C8",
	secondary_base: "#4990E8",
	secondary_base_2: "#92BCF1",
	secondary_base_3: "#B6D3F6",
	tertiary_base_1: "#C1E5FB",
	tertiary_base_2: "#D6EEFC",
	tertiary_base_3: "#EAF6FE",
	accent_base: "#F0EDCC",
	accent_base_1: "#F5F3DD",
	accent_base_2: "#FAF9EE",
	warning: "#ED9D1D",
	false: "#B51932",
	false_1: "#C0392B",
	false_2: "#FF6B6B",
	neutral_text: "#000000",
	neutral_gray: "#A4A4A4",
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

//TODO upewnić się że darkTheme dobrze spełnia swoją funkcję, szczególnie w zestawieniu z tekstem
export const darkTheme: ThemeColors = {
	primary_base: "#7A9BEA",
	primary_base_1: "#5B7DD1",
	primary_base_2: "#3F5DA8",
	primary_base_3: "#2B4177",
	primary_base_4: "#1C2A4F",

	secondary_base_0c: "#2F7BE0",
	secondary_base: "#5A9DF0",
	secondary_base_2: "#2E5F9E",
	secondary_base_3: "#234A7C",

	tertiary_base_1: "#1B3D5C",
	tertiary_base_2: "#16314A",
	tertiary_base_3: "#122638",

	accent_base: "#4A4626",
	accent_base_1: "#38351E",
	accent_base_2: "#2A2817",

	warning: "#F5B041",
	false: "#E5546B",
	false_1: "#E8685A",
	false_2: "#FF8A8A",
	true: "#34C77B",

	neutral_text: "#E8EDF5",
	neutral_gray: "#8A93A3",

	bg_0: "#0B1220",
	bg_1: "#121A2B",
	bg_2: "#1B2538",

	blue0: "#12324A",
	blue1: "#5E9BC2",
	blue2: "#4DA6DE",
	graphite0: "#A9B6CC",
	magenta0: "#D177DD",
}

//TODO upewnić się że wysoki kontrast dobrze spełnia swoją funkcję, szczególnie w zestawieniu z tekstem
export const highContrastTheme: ThemeColors = {
	primary_base: "#001A5E",
	primary_base_1: "#0B3C9E",
	primary_base_2: "#4A70D0",
	primary_base_3: "#8AA3E4",
	primary_base_4: "#E6EDF8",
	secondary_base_0c: "#0047AB",
	secondary_base: "#0C68E9",
	secondary_base_2: "#7AB0F3",
	secondary_base_3: "#CCE4FF",
	tertiary_base_1: "#A3D9FF",
	tertiary_base_2: "#E0F2FE",
	tertiary_base_3: "#FFFFFF",
	accent_base: "#FFF59D",
	accent_base_1: "#FFF9C4",
	accent_base_2: "#FFFFFF",
	warning: "#FF8C00",
	false: "#B51932",
	false_1: "#C0392B",
	false_2: "#FF6B6B",
	neutral_text: "#000000",
	neutral_gray: "#7A7A7A",
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

export const highContrastDarkTheme: ThemeColors = {
	primary_base: "#8CAEFF",
	primary_base_1: "#6F95F5",
	primary_base_2: "#5078DC",
	primary_base_3: "#1A3A8F",
	primary_base_4: "#0A1A4D",

	secondary_base_0c: "#3D8BFF",
	secondary_base: "#66AEFF",
	secondary_base_2: "#0F4C9E",
	secondary_base_3: "#0A3570",

	tertiary_base_1: "#0A3F6B",
	tertiary_base_2: "#062C4C",
	tertiary_base_3: "#031A2E",

	accent_base: "#5C5500",
	accent_base_1: "#3D3800",
	accent_base_2: "#262300",

	warning: "#FFB000",
	false: "#FF5C77",
	false_1: "#FF7A66",
	false_2: "#FFA3A3",
	true: "#2EDB84",

	neutral_text: "#FFFFFF",
	neutral_gray: "#BDBDBD",

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
	const [colorMode, setColorMode] = useState<ColorMode>("light")
	const [highContrast, setHighContrast] = useState(false)
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
