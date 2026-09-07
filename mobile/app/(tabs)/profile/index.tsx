import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ThemedView
      colorName="tertiary_base_2"
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView
          colorName="primary_base"
          style={styles.topHeader}
        >
          <ThemedView
            colorName="primary_base"
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={colors.accent_base}
            />
          </ThemedView>

          <ThemedText
            tx="profile.title"
            variant="title"
            colorName="accent_base"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          />
        </ThemedView>

        {/* K-Levels */}
        <View style={[styles.section, styles.firstSection]}>
          <ThemedText
            tx="profile.activity"
            variant="tab1Category"
            colorName="secondary_base_0c"
            accessibilityRole="header"
            style={styles.sectionTitle}
          />

          <ThemedView
            variant="wide"
            colorName="tertiary_base_3"
            style={styles.activityDropdown}
            onPress={() => {
              // TODO: rozwijanie listy K-Levels
            }}
            accessibilityRole="button"
          >
            <View style={styles.dropdownContent} />

            <Ionicons
              name="chevron-down"
              size={30}
              color={colors.primary_base}
            />
          </ThemedView>
        </View>

        {/* Schorzenia i alergie */}
        <View style={styles.section}>
          <ThemedText
            tx="profile.diseases"
            variant="tab1Category"
            colorName="secondary_base_0c"
            accessibilityRole="header"
            style={styles.sectionTitle}
          />

          <ThemedView
            variant="wide"
            colorName="tertiary_base_2"
          >
            {/* TODO: import danych z bazy */}
          </ThemedView>
        </View>

        {/* Stale przyjmowane leki */}
        <View style={styles.section}>
          <ThemedText
            tx="profile.medications"
            variant="tab1Category"
            colorName="secondary_base_0c"
            accessibilityRole="header"
            style={styles.sectionTitle}
          />

          <ThemedView
            variant="wide"
            colorName="tertiary_base_2"
          >
            {/* TODO: import danych z bazy */}
          </ThemedView>

          <ThemedView
            variant="tag"
            colorName="tertiary_base_3"
            borderColor="primary_base"
            style={styles.actionTag}
            onPress={() => {
              // TODO: dodawanie leku
            }}
            accessibilityRole="button"
          >
            <ThemedText
              tx="profile.addMedication"
              variant="subTitle2"
              colorName="primary_base"
              style={styles.tagText}
            />

            <Ionicons
              name="add-outline"
              size={20}
              color={colors.primary_base}
            />
          </ThemedView>
        </View>

        {/* Akcje profilu */}
        <View style={styles.utilitiesContainer}>
          <ProfileMenuCard
            label="profile.history"
            subtitle="profile.historyEntries"
            colorName="accent_base_1"
            hasNewEntries={false}
            onPress={() => {
              router.push('/profile/measurements');
            }}
          />

          <ThemedView
            variant="tag"
            colorName="accent_base_1"
            borderColor="primary_base"
            style={styles.actionTag}
            onPress={() => {
              // TODO: dodawanie pomiaru
            }}
            accessibilityRole="button"
          >
            <ThemedText
              tx="profile.addMeasurement"
              variant="subTitle2"
              colorName="primary_base"
              style={styles.tagText}
            />

            <Ionicons
              name="add-outline"
              size={20}
              color={colors.primary_base}
            />
          </ThemedView>

          <ProfileMenuCard
            label="profile.recommendations"
            subtitle="profile.recommendationsEntries"
            colorName="tertiary_base_3"
            hasNewEntries
            onPress={() => {
              router.push('/profile/recommendations');
            }}
          />

          <ProfileMenuCard
            label="profile.notes"
            subtitle="profile.notesEntries"
            colorName="tertiary_base_3"
            onPress={() => {
              router.push('/profile/technical-notes');
            }}
          />

          {/* Dodaj plik */}
          <View style={styles.addFileSection}>
            <ThemedView
              colorName="tertiary_base_2"
              style={styles.addFileRow}
              onPress={() => {
                // TODO: dodawanie pliku
              }}
              accessibilityRole="button"
            >
              <ThemedView
                colorName="primary_base"
                style={styles.addFileIcon}
              >
                <Ionicons
                  name="add-outline"
                  size={24}
                  color={colors.accent_base_2}
                />
              </ThemedView>

              <ThemedText
                tx="profile.newFile"
                variant="main1Button"
                colorName="primary_base"
              />
            </ThemedView>

            <ThemedText
              tx="profile.fileDescription"
              variant="subTitle1"
              colorName="secondary_base_0c"
              style={styles.addFileDescription}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

interface ProfileMenuCardProps {
  label:
    | 'profile.history'
    | 'profile.recommendations'
    | 'profile.notes';

  subtitle:
    | 'profile.historyEntries'
    | 'profile.recommendationsEntries'
    | 'profile.notesEntries';

  colorName:
    | 'accent_base_1'
    | 'tertiary_base_3';

  hasNewEntries?: boolean;
  onPress: () => void;
}

function ProfileMenuCard({
  label,
  subtitle,
  colorName,
  hasNewEntries = false,
  onPress,
}: ProfileMenuCardProps) {
  const { colors } = useTheme();

  return (
    <ThemedView
      variant="wide"
      colorName={colorName}
      style={styles.utilityCard}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.utilityTextContainer}>
        <ThemedText
          tx={label}
          variant="subTitle1"
          colorName="primary_base"
          style={styles.utilityText}
        />

        <View style={styles.subtitleRow}>
          {hasNewEntries && (
            <View style={styles.newEntryDot} />
          )}

          <ThemedText
            tx={subtitle}
            variant="subTitle2"
            colorName="primary_base"
            style={styles.utilitySubtitle}
          />
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={30}
        color={colors.primary_base}
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

  section: {
    width: '100%',
    paddingHorizontal: 28,
    marginBottom: 14,
  },

  firstSection: {
    marginTop: 20,
  },

  sectionTitle: {
    marginBottom: 14,
  },

  activityDropdown: {
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

  utilityTextContainer: {
    flex: 1,
  },

  utilityText: {
    textAlign: 'left',
  },

  utilitySubtitle: {
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
    marginTop: 4,
  },

  actionTag: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    borderWidth: 1,
  },

  tagText: {
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

  addFileDescription: {
    width: 190,
    textAlign: 'center',
  },
});