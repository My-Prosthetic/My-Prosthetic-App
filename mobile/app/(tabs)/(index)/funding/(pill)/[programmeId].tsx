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

import fundingConfig from '@/config/fundingConfig.json';

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

const prototypeColors = {
  screenBackground: '#D6EEFC',

  boxBackground: '#EAF6FE',
  boxBorder: '#6981BC',

  primaryText: '#052D8F',
  secondaryText: '#1967C8',
  subtitleText: '#6981BC',

  buttonBackground: '#052D8F',
  buttonText: '#FAF9EE',
  buttonBorder: '#F0EDCC',

  stepCircleBackground: '#EAF6FE',
};

export default function ProgrammeDetailsScreen() {
  const { t } = useTranslation();

  const { programmeId } = useLocalSearchParams<{
    programmeId: string;
  }>();

  const programmes =
    fundingConfig.programmes as Programme[];

  const programme = programmes.find(
    (item) => item.id === programmeId
  );

  const translate = (key?: string) =>
    key ? t(key as any) : '';

  const screenBackground = prototypeColors.screenBackground;
  const boxBackground = prototypeColors.boxBackground;
  const boxBorder = prototypeColors.boxBorder;
  const primaryText = prototypeColors.primaryText;
  const secondaryText = prototypeColors.secondaryText;
  const subtitleText = prototypeColors.subtitleText;
  const buttonBackground = prototypeColors.buttonBackground;
  const buttonText = prototypeColors.buttonText;
  const buttonBorder = prototypeColors.buttonBorder;

  const openExternalUrl = async (
    url?: string
  ) => {
    if (!url) {
      return;
    }

    const supported =
      await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  if (!programme) {
    return (
      <View
        style={[
          styles.notFoundContainer,
          {
            backgroundColor:
              screenBackground,
          },
        ]}
      >
        <Text
          style={[
            styles.notFoundText,
            { color: primaryText },
          ]}
        >
          {t('funding.notFound')}
        </Text>
      </View>
    );
  }

  const details = programme.details;

  const renderSummaryRows = () => {
    if (
      !details.summaryRows ||
      details.summaryRows.length === 0
    ) {
      return null;
    }

    return (
      <View
        style={[
          styles.summaryBox,
          {
            backgroundColor: boxBackground,
            borderColor: boxBorder,
          },
        ]}
      >
        {details.summaryRows.map(
          (row, index) => (
            <View
              key={`${row.labelKey}-${index}`}
            >
              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={[
                    styles.summaryLabel,
                    {
                      color:
                        primaryText,
                    },
                  ]}
                >
                  {translate(
                    row.labelKey
                  )}
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        primaryText,
                    },
                  ]}
                >
                  {translate(
                    row.valueKey
                  )}
                </Text>
              </View>

              {index <
                details.summaryRows!
                  .length -
                  1 && (
                <View
                  style={[
                    styles.summaryDivider,
                    {
                      backgroundColor: '#9BABD2',

                    },
                  ]}
                />
              )}
            </View>
          )
        )}
      </View>
    );
  };

  const renderSteps = () => {
  if (
    details.type !== 'steps' ||
    !details.steps
  ) {
    return null;
  }

  return (
    <>
      <Text
        style={[
          styles.sectionTitle,
          { color: secondaryText },
        ]}
      >
        {translate(details.sectionTitleKey)}
      </Text>

      <View style={styles.stepsContainer}>
        {details.steps.map((step, index) => (
          <View
            key={step.number}
            style={styles.stepRow}
          >
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepNumber,
                  {
                    backgroundColor:
                      prototypeColors.stepCircleBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: primaryText },
                  ]}
                >
                  {step.number}
                </Text>
              </View>

              {index < details.steps!.length - 1 && (
                <View style={styles.stepDots}>
                  <View style={styles.stepDot} />
                  <View style={styles.stepDot} />
                  <View style={styles.stepDot} />
                  <View style={styles.stepDot} />
                </View>
              )}
            </View>

            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: primaryText },
                ]}
              >
                {translate(step.titleKey)}
              </Text>

              <Text
                style={[
                  styles.stepDescription,
                  { color: secondaryText },
                ]}
              >
                {translate(step.descriptionKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {details.externalUrl &&
        details.externalButtonLabelKey && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              openExternalUrl(details.externalUrl)
            }
            style={[
              styles.mainButton,
              {
                backgroundColor: buttonBackground,
                borderColor: buttonBorder,
              },
            ]}
            accessibilityRole="link"
            accessibilityLabel={translate(
              details.externalButtonLabelKey
            )}
          >
            <Text
              style={[
                styles.mainButtonText,
                { color: buttonText },
              ]}
            >
              {translate(
                details.externalButtonLabelKey
              )}
            </Text>
          </TouchableOpacity>
        )}
    </>
  );
};

  const renderEligibility = () => {
    if (
      details.type !== 'eligibility'
    ) {
      return null;
    }

    return (
      <>
        <Text
          style={[
            styles.sectionTitle,
            { color: secondaryText },
          ]}
        >
          {translate(
            details.sectionTitleKey
          )}
        </Text>

        <View
          style={[
            styles.eligibilityBox,
            {
              backgroundColor:
                boxBackground,
              borderColor: boxBorder,
            },
          ]}
        >
          {details.eligibilityKeys?.map(
            (key) => (
              <View
                key={key}
                style={
                  styles.eligibilityRow
                }
              >
                <Text
                  style={[
                    styles.bullet,
                    {
                      color:
                        primaryText,
                    },
                  ]}
                >
                  •
                </Text>

                <Text
                  style={[
                    styles.eligibilityText,
                    {
                      color:
                        primaryText,
                    },
                  ]}
                >
                  {translate(key)}
                </Text>
              </View>
            )
          )}
        </View>

        {details.actionSectionTitleKey && (
          <Text
            style={[
              styles.actionSectionTitle,
              { color: secondaryText },
            ]}
          >
            {translate(
              details.actionSectionTitleKey
            )}
          </Text>
        )}

        {details.externalUrl &&
          details.externalButtonLabelKey && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                openExternalUrl(
                  details.externalUrl
                )
              }
              style={[
                styles.actionButton,
                {
                  backgroundColor:
                    buttonBackground,
                  borderColor:
                    buttonBorder,
                },
              ]}
              accessibilityRole="link"
              accessibilityLabel={translate(
                details.externalButtonLabelKey
              )}
            >
              <View
                style={
                  styles.actionButtonContent
                }
              >
                <Text
  style={[
    styles.actionButtonTitle,
    { color: buttonText },
  ]}
  numberOfLines={1}>
  {translate(details.externalButtonLabelKey)}
</Text>

                {details.externalButtonDescriptionKey && (
                  <Text
                    style={[
                      styles.actionButtonDescription,
                      {
                        color:
                          buttonText,
                      },
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
                size={20}
                color={buttonText}
              />
            </TouchableOpacity>
          )}
      </>
    );
  };

  const renderFoundations = () => {
    if (
      details.type !== 'foundations'
    ) {
      return null;
    }

    return (
      <>
        <Text
          style={[
            styles.sectionTitle,
            { color: secondaryText },
          ]}
        >
          {translate(
            details.sectionTitleKey
          )}
        </Text>

        <View>
          {details.foundations?.map(
            (foundation) => {
              const foundationName =
                translate(
                  foundation.nameKey
                );

              return (
                <TouchableOpacity
                  key={foundation.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    openExternalUrl(
                      foundation.externalUrl
                    )
                  }
                  style={[
                    styles.foundationItem,
                    {
                      borderBottomColor:
                        '#9BABD2',
                    },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={t(
                    'funding.openFoundation',
                    {
                      foundation:
                        foundationName,
                    }
                  )}
                >
                  <Text
                    style={[
                      styles.foundationName,
                      {
                        color:
                          primaryText,
                      },
                    ]}
                  >
                    {foundationName}
                  </Text>

                  <Text
                    style={[
                      styles.foundationDescription,
                      {
                        color:
                          secondaryText,
                      },
                    ]}
                  >
                    {translate(
                      foundation.descriptionKey
                    )}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </>
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor:
            screenBackground,
        },
      ]}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.programmeTitle,
          { color: primaryText },
        ]}
      >
        {translate(details.titleKey)}
      </Text>

      <Text
        style={[
          styles.programmeSubtitle,
          { color: subtitleText },
        ]}
      >
        {translate(details.subtitleKey)}
      </Text>

      {renderSummaryRows()}

      {renderSteps()}

      {renderEligibility()}

      {renderFoundations()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 40,
  },

  programmeTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 20,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  programmeSubtitle: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: 0.68,
    marginBottom: 24,
  },

  summaryBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 28,
  },

  summaryRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  summaryLabel: {
    fontFamily: 'Afacad_400Regular',
    fontSize: 16,
    lineHeight: 20,
    flexShrink: 1,
  },

  summaryValue: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: 0.68,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '58%',
  },

  summaryDivider: {
    height: 1,
  },

  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 14,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  stepsContainer: {
    gap: 0,
    marginBottom: 26,
  },

stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

stepIndicator: {
  width: 30,
  alignItems: 'center',
  marginRight: 12,
  flexShrink: 0,
},

stepNumber: {
  width: 30,
  height: 30,
  borderRadius: 15,

  borderWidth: 0,

  alignItems: 'center',
  justifyContent: 'center',
},

stepNumberText: {
  fontFamily: 'Afacad_600SemiBold',
  fontSize: 16,
  lineHeight: 18,
},

stepDots: {
  alignItems: 'center',
  justifyContent: 'space-evenly',
  height: 38,
  paddingVertical: 5,
},

stepDot: {
  width: 3,
  height: 3,
  borderRadius: 1.5,
  backgroundColor: '#E0E0E0',
},

stepContent: {
  flex: 1,
  paddingTop: 2,
  paddingBottom: 14,
},

stepTitle: {
  fontFamily: 'Afacad_600SemiBold',
  fontSize: 17,
  lineHeight: 20,
  letterSpacing: 0.68,
  marginBottom: 3,
  flexShrink: 1,
},

stepDescription: {
  fontFamily: 'Afacad_400Regular',
  fontSize: 14,
  lineHeight: 18,
  letterSpacing: 0.56,
  flexShrink: 1,
},

  mainButton: {
  height: 60,
  borderRadius: 18,
  borderWidth: 3,

  alignItems: 'center',
  justifyContent: 'center',

  paddingHorizontal: 16,
  paddingVertical: 8,

  marginTop: 2,
},

  mainButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.64,
    textTransform: 'uppercase',
    textAlign: 'center',
    flexShrink: 1,
  },

  eligibilityBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 28,
    justifyContent: 'center',

  },

  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  bullet: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 17,
    lineHeight: 20,
    marginRight: 4,
  },

  eligibilityText: {
    fontFamily: 'Afacad_400Regular',
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },

  actionSectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 14,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  actionButton: {
  minHeight: 72,
  borderRadius: 18,
  borderWidth: 3,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 8,
},

actionButtonContent: {
  flex: 1,
  paddingRight: 6,
  paddingLeft: 6,
},

actionButtonTitle: {
  fontFamily: 'Afacad_600SemiBold',
  fontSize: 15,
  lineHeight: 20,
  letterSpacing: 0.68,
  marginBottom: 2,
  flexShrink: 1,
},

actionButtonDescription: {
  fontFamily: 'Afacad_400Regular',
  fontSize: 13,
  lineHeight: 17,
  letterSpacing: 0.56,
  flexShrink: 1,
},

  foundationItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  foundationName: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: 0.68,
    marginBottom: 3,
  },

  foundationDescription: {
    fontFamily: 'Afacad_400Regular',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.56,
  },

  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  notFoundText: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 17,
    lineHeight: 21,
    textAlign: 'center',
  },
});