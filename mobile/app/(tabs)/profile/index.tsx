import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../context/ThemeContext';
import { ThemedView } from '../../../components/ThemedView';

const prototypeColors = {
  screenBackground: '#D6EEFC',
  cardBackground: '#EAF6FE',
  primaryText: '#052D8F',
  secondaryText: '#1967C8',
  headerBackground: '#052D8F',
  headerText: '#F0EDCC',
  historyCardBackground: '#F5F3DD',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, themeType } = useTheme();
  const router = useRouter();

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

  const headerBackground = isHighContrast
    ? colors.background
    : prototypeColors.headerBackground;

  const headerText = isHighContrast
    ? colors.textPrimary
    : prototypeColors.headerText;

  const tagStyle = {
    backgroundColor: cardBackground,
    borderColor: colors.primary,
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: screenBackground },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
          >
            <Ionicons
              name="chevron-back"
              size={26}
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
            minimumFontScale={0.8}
          >
            {t('profile.title')}
          </Text>
        </View>

        {/* K-Levels */}
        <View style={[styles.section, styles.firstSection]}>
          <Text
            accessibilityRole="header"
            style={[
              styles.sectionTitle,
              { color: secondaryText },
            ]}
          >
            {t('profile.activity')}
          </Text>

          <ThemedView
            size="wide"
            style={[
              styles.activityDropdown,
              { backgroundColor: cardBackground },
            ]}
            onPress={() => {
              // TODO: rozwijanie listy K-Levels
            }}
            accessibilityRole="button"
          >
            <View style={styles.dropdownContent} />

            <Ionicons
              name="chevron-down"
              size={30}
              color={primaryText}
            />
          </ThemedView>
        </View>

        {/* Schorzenia i alergie */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[
              styles.sectionTitle,
              { color: secondaryText },
            ]}
          >
            {t('profile.diseases')}
          </Text>

          <ThemedView
            size="wide"
            style={{ backgroundColor: screenBackground }}
          >
          {/* TODO: import danych z bazy */}
          </ThemedView>
        </View>

        {/* Stale przyjmowane leki */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[
              styles.sectionTitle,
              { color: secondaryText },
            ]}
          >
            {t('profile.medications')}
          </Text>

          <ThemedView
            size="wide"
            style={{ backgroundColor: screenBackground }}
          >
            {/* TODO: import danych z bazy */}
          </ThemedView>

          <ThemedView
            size="tag"
            style={[styles.actionTag, tagStyle]}
            onPress={() => {
              // TODO: dodawanie leku
            }}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tagText,
                { color: primaryText },
              ]}
            >
              {t('profile.addMedication')}
            </Text>

            <Ionicons
              name="add-outline"
              size={20}
              color={colors.primary}
            />
          </ThemedView>
        </View>

        {/* Akcje profilu */}
        <View style={styles.utilitiesContainer}>
          <ProfileMenuCard
            label={t('profile.history')}
            // TODO: zamienić na dane z bazy
            subtitle={t('profile.historyEntries')}
            backgroundColor={prototypeColors.historyCardBackground}
            textColor={primaryText}
            iconColor={colors.primary}
            onPress={() => {
              router.push('/profile/measurements')
            }}
          />

          <ThemedView
            size="tag"
            style={[
              styles.actionTag,
              tagStyle,
              { backgroundColor: prototypeColors.historyCardBackground },
            ]}
            onPress={() => {
              // TODO: dodawanie pomiaru
            }}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tagText,
                { color: primaryText },
              ]}
            >
              {t('profile.addMeasurement')}
            </Text>

            <Ionicons
              name="add-outline"
              size={20}
              color={colors.primary}
            />
          </ThemedView>

          <ProfileMenuCard
            label={t('profile.recommendations')}
            subtitle={t('profile.recommendationsEntries')}
            backgroundColor={cardBackground}
            textColor={primaryText}
            iconColor={colors.primary}
            hasNewEntries
            onPress={() => {
              router.push('/profile/recommendations')
            }}
          />

          <ProfileMenuCard
            label={t('profile.notes')}
            subtitle={t('profile.notesEntries')}
            backgroundColor={cardBackground}
            textColor={primaryText}
            iconColor={colors.primary}
            onPress={() => {
              router.push('/profile/technical-notes')
            }}
          />

          {/* Dodaj plik */}
          <View style={styles.addFileSection}>
            <TouchableOpacity
              style={styles.addFileRow}
              onPress={() => {
                // TODO: dodawanie pliku
              }}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.addFileIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={24}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={[
                  styles.addFileTitle,
                  { color: primaryText },
                ]}
              >
                {t('profile.newFile')}
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.addFileDescription,
                { color: secondaryText },
              ]}
            >
              {t('profile.fileDescription')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

interface ProfileMenuCardProps {
  label: string;
  subtitle?: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
  hasNewEntries?: boolean;
  onPress: () => void;
}

function ProfileMenuCard({
  label,
  subtitle,
  backgroundColor,
  textColor,
  iconColor,
  hasNewEntries,
  onPress,
}: ProfileMenuCardProps) {
  return (
  <ThemedView
    size="wide"
    style={[
      styles.utilityCard,
      { backgroundColor },
    ]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <View style={styles.utilityTextContainer}>
      <Text
        style={[
          styles.utilityText,
          { color: textColor },
        ]}
      >
        {label}
      </Text>

      <View style={styles.subtitleRow}>
        {hasNewEntries && <View style={styles.newEntryDot} />}

        {subtitle && (
          <Text style={styles.utilitySubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>

    <Ionicons
      name="chevron-forward"
      size={30}
      color={iconColor}
    />
  </ThemedView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
    width: '100%',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  topHeader: {
    width: '100%',
    minHeight: 86,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  backButton: {
    position: 'absolute',
    left: 16,
    top: 18,
    bottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  headerTitle: {
    fontFamily: 'Afacad_500Medium',
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: 1.2,
    textAlign: 'center',
    fontWeight: '500',
  },

  section: {
    width: '100%',
    paddingHorizontal: 28,
    marginBottom: 14,
  },

  firstSection: {
    marginTop: 20,
  },

  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 14,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  activityDropdown: {
    width: '100%',
    minHeight: 60,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  dropdownContent: {
    flex: 1,
  },

  utilitiesContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },

  utilityCard: {
  width: '100%',
  marginBottom: 12,
  justifyContent: 'space-between',

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 5,
  elevation: 4,
},

  utilityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },

  actionTag: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    borderWidth: 1,
  },

  tagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginRight: 6,
  },

  addFileSection: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },

  addFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  addFileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  addFileTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 19,
    textTransform: 'uppercase',
  },

  addFileDescription: {
    width: 190,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  utilityTextContainer: {
    flex: 1,
  },

  utilitySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },

  subtitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

  newEntryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
    marginTop: 6,
  },

});