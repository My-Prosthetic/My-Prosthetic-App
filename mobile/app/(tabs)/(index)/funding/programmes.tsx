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

export default function ProgrammesScreen() {
  const { t } = useTranslation();
  const { colors, themeType } = useTheme();
  const router = useRouter();

  const programmes = fundingConfig.programmes;

  // Klucze pochodzą z JSON-a, dlatego tłumaczymy je dynamicznie.
  const translate = (key: string) => t(key as any);

  const onPrimary =
    themeType === 'high-contrast' ? '#000000' : '#FFFFFF';

  const sectionKeys = [
    ...new Set(programmes.map((programme) => programme.sectionKey)),
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
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.primary,
          },
        ]}
        onPress={() =>
          router.push({
            pathname: '/funding/[programmeId]',
            params: { programmeId: programme.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={t('funding.showProgrammeDetails', {
          programme: programmeTitle,
        })}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.backgroundTertiary },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: colors.textPrimary },
              ]}
            >
              {translate(programme.badgeKey)}
            </Text>
          </View>

          <Text
            style={[
              styles.cardTitle,
              { color: colors.textPrimary },
            ]}
          >
            {programmeTitle}
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: colors.textSecondary },
            ]}
          >
            {translate(programme.shortDescriptionKey)}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {sectionKeys.map((sectionKey) => (
        <View key={sectionKey} style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textSecondary },
            ]}
          >
            {translate(sectionKey)}
          </Text>

          {programmes
            .filter(
              (programme) => programme.sectionKey === sectionKey
            )
            .map(renderProgrammeCard)}
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: colors.primary },
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
          color={onPrimary}
        />

        <Text
          style={[
            styles.addButtonText,
            { color: onPrimary },
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
    marginBottom: 10,
  },

  cardContent: {
    flex: 1,
    paddingRight: 10,
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginBottom: 5,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    flexShrink: 1,
  },

  cardDescription: {
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
  },

  addButton: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },

  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});