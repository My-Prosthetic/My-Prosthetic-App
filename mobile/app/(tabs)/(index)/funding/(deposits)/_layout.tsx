import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';

//TODO nie korzystam tu z tabs, tylko trochę "sztucznie" zmieniam ścieżki. Czy nie sprawia to, że tracę cache co zdziałałem na tej ścieżce przeskakują między ekranami?
//TODO kolory

export default function FundingTabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.tertiary_base_2 || '#E5F0FF' }]}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.accent_base} />
        </TouchableOpacity>
        <ThemedText
          variant='title'
          colorName='accent_base'
          tx={pathname.includes('edit_deposit') ? 'funds.editFundsTitle' : 'funds.addFundsTitle'}
        />
      </View>

      <View style={styles.contentContainer}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    backgroundColor: '#002B9A', // Granatowe tło
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  toggleWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#4285F4',
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#002B9A',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextInactive: {
    color: '#3B82F6',
  },
  contentContainer: {
    flex: 1,
  },
});