import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../../context/ThemeContext';
import fundingConfig from '../../../../config/fundingConfig.json';

type SummaryRow = {
  labelKey: string;
  valueKey: string;
};

type Step = {
  number: number;
  titleKey: string;
  descriptionKey: string;
};

type Foundation = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  externalUrl: string;
};

type ProgrammeDetails = {
  type: 'steps' | 'eligibility' | 'foundations';
  titleKey: string;
  subtitleKey: string;

  summaryRows?: SummaryRow[];

  sectionTitleKey?: string;

  steps?: Step[];

  eligibilityKeys?: string[];

  actionSectionTitleKey?: string;

  externalButtonLabelKey?: string;
  externalButtonDescriptionKey?: string;
  externalUrl?: string;

  foundations?: Foundation[];
};

type Programme = {
  id: string;
  sectionKey: string;
  badgeKey: string;
  titleKey: string;
  shortDescriptionKey: string;
  details: ProgrammeDetails;
};

export default function ProgrammeDetailsScreen() {
  const { t } = useTranslation();
  const { colors, themeType } = useTheme();

  const { programmeId } = useLocalSearchParams<{
    programmeId: string;
  }>();

  const programmes = fundingConfig.programmes as Programme[];

  const programme = programmes.find(
    (item) => item.id === programmeId
  );

  const translate = (key?: string) =>
    key ? t(key as any) : '';

  const onPrimary =
    themeType === 'high-contrast' ? '#000000' : '#FFFFFF';

  if (!programme) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[
            styles.errorText,
            { color: colors.textPrimary },
          ]}
        >
          {t('funding.notFound')}
        </Text>
      </View>
    );
  }

  const { details } = programme;

  const openExternalUrl = async (url?: string) => {
    if (!url) {
      return;
    }

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  const renderSummaryRows = () => {
    if (!details.summaryRows?.length) {
      return null;
    }

    return (
      <View
        style={[
          styles.summaryBox,
          { borderColor: colors.primary },
        ]}
      >
        {details.summaryRows.map((row, index) => (
          <View
            key={`${row.labelKey}-${index}`}
            style={[
              styles.summaryRow,
              index !== details.summaryRows!.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.textSecondary },
              ]}
            >
              {translate(row.labelKey)}:
            </Text>

            <Text
              style={[
                styles.summaryValue,
                { color: colors.textPrimary },
              ]}
            >
              {translate(row.valueKey)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderNfzDetails = () => (
    <>
      {renderSummaryRows()}

      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary },
        ]}
      >
        {translate(details.sectionTitleKey)}
      </Text>

      <View style={styles.stepsContainer}>
        {details.steps?.map((step) => (
          <View key={step.number} style={styles.stepRow}>
            <View
              style={[
                styles.stepNumber,
                {
                  backgroundColor: colors.backgroundTertiary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepNumberText,
                  { color: colors.textPrimary },
                ]}
              >
                {step.number}
              </Text>
            </View>

            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: colors.textPrimary },
                ]}
              >
                {translate(step.titleKey)}
              </Text>

              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {translate(step.descriptionKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {details.externalUrl && (
        <TouchableOpacity
          style={[
            styles.mainButton,
            { backgroundColor: colors.primary },
          ]}
          activeOpacity={0.85}
          onPress={() =>
            openExternalUrl(details.externalUrl)
          }
          accessibilityRole="link"
          accessibilityLabel={translate(
            details.externalButtonLabelKey
          )}
        >
          <Text
            style={[
              styles.mainButtonText,
              { color: onPrimary },
            ]}
          >
            {translate(details.externalButtonLabelKey)}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderPfronDetails = () => (
    <>
      {renderSummaryRows()}

      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary },
        ]}
      >
        {translate(details.sectionTitleKey)}
      </Text>

      <View
        style={[
          styles.infoBox,
          { borderColor: colors.primary },
        ]}
      >
        {details.eligibilityKeys?.map((key) => (
          <Text
            key={key}
            style={[
              styles.bulletText,
              { color: colors.textPrimary },
            ]}
          >
            • {translate(key)}
          </Text>
        ))}
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary },
        ]}
      >
        {translate(details.actionSectionTitleKey)}
      </Text>

      {details.externalUrl && (
        <TouchableOpacity
          style={[
            styles.actionCard,
            { backgroundColor: colors.primary },
          ]}
          activeOpacity={0.85}
          onPress={() =>
            openExternalUrl(details.externalUrl)
          }
          accessibilityRole="link"
          accessibilityLabel={translate(
            details.externalButtonLabelKey
          )}
        >
          <View style={styles.actionCardText}>
            <Text
              style={[
                styles.actionTitle,
                { color: onPrimary },
              ]}
            >
              {translate(details.externalButtonLabelKey)}
            </Text>

            {details.externalButtonDescriptionKey && (
              <Text
                style={[
                  styles.actionDescription,
                  { color: onPrimary },
                ]}
              >
                {translate(
                  details.externalButtonDescriptionKey
                )}
              </Text>
            )}
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color={onPrimary}
          />
        </TouchableOpacity>
      )}
    </>
  );

  const renderFoundationsDetails = () => (
    <>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary },
        ]}
      >
        {translate(details.sectionTitleKey)}
      </Text>

      <View>
        {details.foundations?.map((foundation) => {
          const foundationName = translate(
            foundation.nameKey
          );

          return (
            <TouchableOpacity
              key={foundation.id}
              style={[
                styles.foundationItem,
                { borderBottomColor: colors.primary },
              ]}
              activeOpacity={0.75}
              onPress={() =>
                openExternalUrl(foundation.externalUrl)
              }
              accessibilityRole="link"
              accessibilityLabel={t(
                'funding.openFoundation',
                {
                  foundation: foundationName,
                }
              )}
            >
              <Text
                style={[
                  styles.foundationName,
                  { color: colors.textPrimary },
                ]}
              >
                {foundationName}
              </Text>

              <Text
                style={[
                  styles.foundationDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {translate(foundation.descriptionKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.programmeTitle,
          { color: colors.textPrimary },
        ]}
      >
        {translate(details.titleKey)}
      </Text>

      <Text
        style={[
          styles.programmeSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        {translate(details.subtitleKey)}
      </Text>

      <View style={styles.detailsContent}>
        {details.type === 'steps' &&
          renderNfzDetails()}

        {details.type === 'eligibility' &&
          renderPfronDetails()}

        {details.type === 'foundations' &&
          renderFoundationsDetails()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  programmeTitle: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },

  programmeSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
    flexShrink: 1,
  },

  detailsContent: {
    marginTop: 22,
  },

  summaryBox: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 22,
    overflow: 'hidden',
  },

  summaryRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },

  summaryLabel: {
    fontSize: 12,
    flex: 1,
    flexShrink: 1,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    flexShrink: 1,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },

  stepsContainer: {
    gap: 16,
    marginBottom: 24,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 28,
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },

  stepDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    flexShrink: 1,
  },

  infoBox: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    marginBottom: 22,
  },

  bulletText: {
    fontSize: 12,
    lineHeight: 22,
    flexShrink: 1,
  },

  mainButton: {
    minHeight: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },

  mainButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },

  actionCard: {
    borderRadius: 13,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionCardText: {
    flex: 1,
    paddingRight: 8,
  },

  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },

  actionDescription: {
    fontSize: 10,
    marginTop: 3,
    flexShrink: 1,
  },

  foundationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  foundationName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },

  foundationDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
    flexShrink: 1,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});