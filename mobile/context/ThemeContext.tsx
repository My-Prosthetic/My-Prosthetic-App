import React, { createContext, useContext, useState, ReactNode } from 'react';

//TODO dopisać tu jeszcze cienie
//TODO? stworzyć komponenty ThemedView i ThemedText, które będą same obsługiwały pobranie funkcji useTheme?


export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  tertiary: string;
  accentPrimary: string;
  accentSecondary: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  background: '#C1E5FB',
  backgroundSecondary: '#D6EEFC',
  backgroundTertiary: '#EAF6FE',
  textPrimary: '#052D8F',
  textSecondary: '#4990E8',
  primary: '#052D8F',
  secondary: '#4990E8',
  tertiary: '#3757A5',
  accentPrimary: '#F5F3DD',
  accentSecondary: '#F0EDCC',
  shadow: '0 0 10px 1px gray',
};

export const highContrastTheme: ThemeColors = {
  background: '#000000',
  backgroundSecondary: '#121212',
  backgroundTertiary: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#FFFF00',
  primary: '#FFFF00',
  secondary: '#0000FF',
  tertiary: '#FFFFFF',
  accentPrimary: '#FF0000',
  accentSecondary: '#FF0000',
  shadow: '0 0 10px 1px gray',
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