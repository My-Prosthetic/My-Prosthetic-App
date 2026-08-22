import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { Carousel } from '@/src/components/Carousel';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function AccumulatedFundsScreen() {

  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <ThemedView colorName='tertiary_base_2' variant='background'>
      <ThemedText variant='tab1Category' colorName='secondary_base_0c' tx="funds.addNewGoal" />
    </ThemedView>
  );
}


const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  carouselCard: {
    width: '100%'
  },
  carouselOutline: {
    borderWidth: 2,
    borderColor: colors.primary_base
  }
});
