import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/src/components/ThemedText';
import { useTranslation } from 'react-i18next';

export default function FundingFormsLayout() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();

return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.tertiary_base_2 },
        header: ({ options }) => (
          <View style={[ styles.topHeader , { backgroundColor: colors.primary_base} ]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color={colors.accent_base} />
            </TouchableOpacity>
            <ThemedText variant="title" colorName="accent_base">
              {options.title}
            </ThemedText>
          </View>
        ),
      }}
    >
      <Stack.Screen name="new_goal" options={{ title: t('funds.addGoalTitle') }} />
      <Stack.Screen name="edit_goal" options={{ title: t('funds.editGoalTitle') }} />
      <Stack.Screen name="new_deposit" options={{ title: t('funds.addFundsTitle') }} />
      <Stack.Screen name="edit_deposit" options={{ title: t('funds.editFundsTitle') }} />
    </Stack>
  );
}

const getStyles = (colors: ThemeColors) => {
  return (
    StyleSheet.create(
      {
        safeArea: {
          flex: 1,
        },
        topHeader: {
          backgroundColor: colors.primary_base,
          height: 100,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          paddingHorizontal: 16,
          position: 'relative',
          paddingTop: 20,
        },
        backButton: {
          position: 'absolute',
          left: 16,
          padding: 4,
          paddingTop: 24,
        },
        contentContainer: {
          flex: 1,
        },
      }
    )
  )
};