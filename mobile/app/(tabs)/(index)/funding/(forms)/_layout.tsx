import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/src/components/ThemedText';

export default function FundingFormsLayout() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const pathname = usePathname();
  const isDeposit = pathname.includes('deposit');
  const isEdit = pathname.includes('edit');
  const getTitleTx = () => {
    switch (true) {
      case isDeposit && isEdit:
        return 'funds.editFundsTitle';
      case isDeposit && !isEdit:
        return 'funds.addFundsTitle';
      case !isDeposit && isEdit:
        return 'funds.editGoalTitle';
      default:
        return 'funds.addGoalTitle';
    }
  };

  const titleTx = getTitleTx();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.tertiary_base_2 || '#E5F0FF' }]}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.accent_base} />
        </TouchableOpacity>
        <ThemedText variant="title" colorName="accent_base" tx={titleTx} />
      </View>

      <View style={styles.contentContainer}>
        <Slot />
      </View>
    </View>
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