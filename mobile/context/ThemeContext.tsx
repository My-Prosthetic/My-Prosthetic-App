import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ThemeColors {
primary_base: string;
primary_base_1: string;
primary_base_2: string;
primary_base_3: string;
primary_base_4: string;
secondary_base_0c: string;
secondary_base: string;
secondary_base_3: string;
tertiary_base_1: string;
tertiary_base_2: string;
tertiary_base_3: string;
accent_base: string;
accent_base_1: string;
accent_base_2: string;
warning: string;
false: string;
}

export const lightTheme: ThemeColors = {
  primary_base: "#052D8F",
  primary_base_1: "#3757A5",
  primary_base_2: "#6981BC",
  primary_base_3: "#9BABD2",
  primary_base_4: "#CDD5E9",
  secondary_base_0c: "#1967C8",
  secondary_base: "#4990E8",
  secondary_base_3: "#B6D3F6",
  tertiary_base_1: "#C1E5FB",
  tertiary_base_2: "#D6EEFC",
  tertiary_base_3: "#EAF6FE",
  accent_base: "#F0EDCC",
  accent_base_1: "#F5F3DD",
  accent_base_2: "#FAF9EE",
  warning: "#ED9D1D",
  false: "#B51932",
};

export const highContrastTheme: ThemeColors = {
  primary_base: "#001A5E",
  primary_base_1: "#0B3C9E",
  primary_base_2: "#4A70D0",
  primary_base_3: "#8AA3E4",
  primary_base_4: "#E6EDF8",
  secondary_base_0c: "#0047AB",
  secondary_base: "#0C68E9",
  secondary_base_3: "#CCE4FF",
  tertiary_base_1: "#A3D9FF",
  tertiary_base_2: "#E0F2FE",
  tertiary_base_3: "#FFFFFF",
  accent_base: "#FFF59D",
  accent_base_1: "#FFF9C4",
  accent_base_2: "#FFFFFF",
  warning: "#FF8C00",
  false: "#B51932",
};

type ThemeType = 'light' | 'high-contrast';

interface ThemeContextType {
  themeType: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');

  const colors = themeType === 'high-contrast' ? highContrastTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeType, colors, setTheme : setThemeType }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme musi być użyty wewnątrz ThemeProvider');
  }
  return context;
};