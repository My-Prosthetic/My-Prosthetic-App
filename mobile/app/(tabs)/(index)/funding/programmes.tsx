import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../../context/ThemeContext';
import fundingConfig from '../../../../config/fundingConfig.json';

const prototypeColors = {
  screenBackground: '#D6EEFC',
  cardBackground: '#EAF6FE',

  primaryText: '#052D8F',
  secondaryText: '#1967C8',

  badgeBackground: '#B6D3F6',
  badgeText: '#052D8F',

  buttonBackground: '#052D8F',
  buttonText: '#FAF9EE',
  buttonBorder: '#F0EDCC',
};

export default function ProgrammesScreen() {
  const { t } = useTranslation();
  const { colors, themeType } = useTheme();
  const router = useRouter();

  const programmes = fundingConfig.programmes;

  const translate = (key: string) => t(key as any);

  const isHighContrast = themeType === 'high-contrast';

  const screenBackground = isHighContrast
    ? colors.background
    : prototypeColors.screenBackground;

  const cardBackground = isHighContrast
    ? colors.backgroundSecondary
    : prototypeColors.cardBackground;

  const primaryText = isHighContrast
    ? colors.textPrimary
    : prototypeColors.primaryText;

  const secondaryText = isHighContrast
    ? colors.textSecondary
    : prototypeColors.secondaryText;

  const badgeBackground = isHighContrast
    ? colors.backgroundTertiary
    : prototypeColors.badgeBackground;

  const badgeText = isHighContrast
    ? colors.textPrimary
    : prototypeColors.badgeText;

  const buttonBackground = isHighContrast
    ? colors.primary
    : prototypeColors.buttonBackground;

  const buttonText = isHighContrast
    ? '#000000'
    : prototypeColors.buttonText;

  const buttonBorder = isHighContrast
    ? colors.textPrimary
    : prototypeColors.buttonBorder;

  const sectionKeys = [
    ...new Set(
      programmes.map((programme) => programme.sectionKey)
    ),
  ];

  const renderProgrammeCard = (
    programme: (typeof programmes)[number]
  ) => {
    const programmeTitle = translate(programme.titleKey);

    return (
      <TouchableOpacity
        key={programme.id}
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: cardBackground,
            borderColor: isHighContrast
            ? colors.primary
            : '#6981BC',
          },
        ]}
        onPress={() =>
          router.push({
            pathname: '/funding/[programmeId]',
            params: {
              programmeId: programme.id,
            },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={t(
          'funding.showProgrammeDetails',
          {
            programme: programmeTitle,
          }
        )}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeBackground,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: badgeText },
              ]}
            >
              {translate(programme.badgeKey)}
            </Text>
          </View>

          <Text
            style={[
              styles.cardTitle,
              { color: primaryText },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {programmeTitle}
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: secondaryText },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {translate(programme.shortDescriptionKey)}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={primaryText}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: screenBackground,
        },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {sectionKeys.map((sectionKey) => (
        <View
          key={sectionKey}
          style={styles.section}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: secondaryText },
            ]}
          >
            {translate(sectionKey)}
          </Text>

          {programmes
            .filter(
              (programme) =>
                programme.sectionKey === sectionKey
            )
            .map(renderProgrammeCard)}
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: buttonBackground,
            borderColor: buttonBorder,
          },
        ]}
        activeOpacity={0.85}
        onPress={() =>
          router.replace('/funding/accumulated_funds')
        }
        accessibilityRole="button"
        accessibilityLabel={t('funding.addFunds')}
      >
        <Ionicons
          name="add"
          size={26}
          color={buttonText}
        />

        <Text
          style={[
            styles.addButtonText,
            { color: buttonText },
          ]}
        >
          {t('funding.addFunds')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0.48,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 104,
    marginBottom: 14,
  },

  cardContent: {
    flex: 1,
    paddingRight: 12,
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 8,
  },

  badgeText: {
    fontFamily: 'Afacad_400Regular',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0.56,
    textAlign: 'center',
  },

  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.64,
    textTransform: 'uppercase',
    marginBottom: 8,
    flexShrink: 1,
  },

  cardDescription: {
    fontFamily: 'Afacad_400Regular',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.56,
    flexShrink: 1,
  },

  addButton: {
    height: 60,
    borderRadius: 18,
    borderWidth: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 2,
},

  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
    flexShrink: 1,
  },
});