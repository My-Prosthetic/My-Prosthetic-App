import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Slot,
  useRouter,
  usePathname,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../../context/ThemeContext';

export default function FundingTabsLayout() {
  const { t } = useTranslation();
  const { colors, themeType } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isAccumulated =
    pathname.includes('accumulated_funds');

  const isProgrammeDetails =
    !pathname.includes('programmes') &&
    !pathname.includes('accumulated_funds');

  const onPrimary =
    themeType === 'high-contrast'
      ? '#000000'
      : '#FFFFFF';

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        style={[
          styles.topHeader,
          { backgroundColor: colors.primary },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('funding.back')}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={onPrimary}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: onPrimary },
          ]}
        >
          {isProgrammeDetails
            ? t('funding.detailsHeader')
            : t('funding.header')}
        </Text>
      </View>

      {!isProgrammeDetails && (
        <View style={styles.toggleWrapper}>
          <View
            style={[
              styles.toggleContainer,
              { borderColor: colors.primary },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.replace('/funding/programmes')
              }
              style={[
                styles.toggleButton,
                !isAccumulated && {
                  backgroundColor: colors.primary,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{
                selected: !isAccumulated,
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: !isAccumulated
                      ? onPrimary
                      : colors.primary,
                  },
                ]}
              >
                {t('funding.availableProgrammes')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.replace(
                  '/funding/accumulated_funds'
                )
              }
              style={[
                styles.toggleButton,
                isAccumulated && {
                  backgroundColor: colors.primary,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{
                selected: isAccumulated,
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: isAccumulated
                      ? onPrimary
                      : colors.primary,
                  },
                ]}
              >
                {t('funding.accumulatedFunds')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 56,
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 12,
  },

  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    paddingTop: 24,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textAlign: 'center',
    flexShrink: 1,
  },

  toggleWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    borderWidth: 1.5,
    padding: 3,
  },

  toggleButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },

  contentContainer: {
    flex: 1,
  },
});