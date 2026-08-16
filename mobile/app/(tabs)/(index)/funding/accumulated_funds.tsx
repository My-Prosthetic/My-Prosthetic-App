import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';

export default function AccumulatedFundsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ThemedView colorName='tertiary_base_2' size='background'>
      <ThemedView colorName='primary_base' size='wide'>
        <ThemedText variant='subTitle1' colorName='tertiary_base_1' tx='screens.accumulatedTitle'></ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  }
});
