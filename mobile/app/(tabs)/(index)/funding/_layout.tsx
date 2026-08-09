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
import { useFonts } from 'expo-font';

import {
  Afacad_400Regular,
  Afacad_500Medium,
  Afacad_600SemiBold,
} from '@expo-google-fonts/afacad';

import {
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useTheme } from '../../../../context/ThemeContext';

const prototypeColors = {
  screenBackground: '#D6EEFC',

  headerBackground: '#052D8F',
  headerText: '#F0EDCC',

  toggleBorder: '#1967C8',

  toggleActiveBackground: '#052D8F',
  toggleActiveText: '#FAF9EE',

  toggleInactiveBackground: '#EAF6FE',
  toggleInactiveText: '#1967C8',
};

export default function FundingTabsLayout() {
  const [fontsLoaded] = useFonts({
    Afacad_400Regular,
    Afacad_500Medium,
    Afacad_600SemiBold,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { t } = useTranslation();
  const { colors, themeType } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  if (!fontsLoaded) {
    return null;
  }

  const isHighContrast = themeType === 'high-contrast';

  const isAccumulated =
    pathname.includes('accumulated_funds');

  const isProgrammeDetails =
    !pathname.includes('programmes') &&
    !pathname.includes('accumulated_funds');

  const screenBackground = isHighContrast
    ? colors.background
    : prototypeColors.screenBackground;

  const headerBackground = isHighContrast
    ? colors.primary
    : prototypeColors.headerBackground;

  const headerText = isHighContrast
    ? '#000000'
    : prototypeColors.headerText;

  const toggleBorder = isHighContrast
    ? colors.primary
    : prototypeColors.toggleBorder;

  const toggleInactiveBackground = isHighContrast
    ? colors.backgroundSecondary
    : prototypeColors.toggleInactiveBackground;

  const activeToggleBackground = isHighContrast
    ? colors.primary
    : prototypeColors.toggleActiveBackground;

  const activeToggleText = isHighContrast
    ? '#000000'
    : prototypeColors.toggleActiveText;

  const inactiveToggleText = isHighContrast
    ? colors.textPrimary
    : prototypeColors.toggleInactiveText;

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: screenBackground },
      ]}
    >
      <View
        style={[
          styles.topHeader,
          { backgroundColor: headerBackground },
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
            color={headerText}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: headerText },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
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
              {
                borderColor: toggleBorder,
                backgroundColor: toggleInactiveBackground,
              },
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
                  backgroundColor: activeToggleBackground,
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
                      ? activeToggleText
                      : inactiveToggleText,
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
                  backgroundColor: activeToggleBackground,
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
                      ? activeToggleText
                      : inactiveToggleText,
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
    paddingHorizontal: 52,
    paddingTop: 20,
    paddingBottom: 12,
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
    bottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
},

  headerTitle: {
    fontFamily: 'Afacad_500Medium',
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 1.2,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
  },

  toggleWrapper: {
    paddingHorizontal: 29,
    marginTop: 16,
    marginBottom: 8,
  },

  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    borderWidth: 2,
    padding: 3,
    minHeight: 44,
},

toggleButton: {
  flex: 1,
  minHeight: 38,
  paddingHorizontal: 6,
  paddingVertical: 7,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
},

toggleText: {
  fontFamily: 'Inter_700Bold',
  fontSize: 13,
  lineHeight: 17,
  textAlign: 'center',
  flexShrink: 1,
},

  contentContainer: {
    flex: 1,
  },
});