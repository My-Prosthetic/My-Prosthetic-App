import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../../context/ThemeContext';
import { useRouter } from 'expo-router';

import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db, expoDb } from '../../../db/client';
import { users } from '../../../db/schema';
import migrations from '../../../drizzle/migrations'

//TODO widok protezy jako component, generowany na podstawie aktualnie zaznaczonej protezy, z możliwością przesuwania między nimi
//TODO zdefiniowaćtype User do userList i userName -> userLogged typu <User>
//TODO pasek ostatniej aktywności: 1. poprawić layout   2. Możliwość generowania dowolnie długiej listy na podstawie danych/json

export default function HomeScreen() {
  const { success, error } = useMigrations(db, migrations);
  const [userList, setUserList] = useState<{ id: number; name: string }[]>([]);
  const [userName, setUserName] = useState<string>('(init value)');

  const { t } = useTranslation();
  const { colors, themeType, setTheme } = useTheme();

  const styles = getStyles(colors, themeType);

  const router = useRouter();

  // Funkcja odczytująca użytkowników z bazy danych
  const fetchUsers = async () => {
    try {
      const allUsers = await db.select().from(users);
      setUserList(allUsers);
      
      if (allUsers.length > 0) {
        setUserName(allUsers[allUsers.length - 1].name);
      } else {
        setUserName('(pusta baza)');
      }
    } catch (err) {
      console.error("Błąd odczytu z bazy:", err);
    }
  };

  // Automatyczny odczyt po załadowaniu bazy i wykonaniu migracji
  useEffect(() => {
    if (success) {
      fetchUsers();
    }
  }, [success]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{t('home.dbMigrationErr')}{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>{t('home.dbInit')}</Text>
      </View>
    );
  }

  // 2. Funkcja dodająca testowy rekord (striggeruje odczytanie z bazy jako osobny proces)
  const handleAddUser = async () => {
    try {
      const testName = 'Tym';
      
      await db
        .insert(users)
        .values({ name: testName });

      // Odczyt z bazy jako osobny, następujący po sobie proces
      await fetchUsers();

    } catch (err) {
      console.error("Błąd zapisu:", err);
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ----------------- NAGŁÓWEK (CZEŚĆ USER!) ----------------- */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerGreeting}>{t('home.greeting')}</Text>
          <Text style={styles.headerName}>{userName}!</Text>
        </View>
        <TouchableOpacity style={styles.handIconContainer} onPress={handleAddUser}>
          <Ionicons name="hand-left" size={48} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ----------------- SEKCJA: MOJE PROTEZY ----------------- */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{t('home.myProsthetics')}</Text>
        
        <View style={styles.carouselRow}>
          {/* Lewa strzałka karuzeli */}
          <TouchableOpacity style={styles.carouselArrow}>
            <Ionicons name="chevron-back" size={32} color={colors.primary} />
          </TouchableOpacity>

          {/* Główna karta protezy */}
          <View style={styles.prostheticCard}>
            {/* Logo protezy */}
            <Image
              source={require('../../../assets/mp_logo_accent.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.prostheticCardText}>OBJ: Proteza codzienna</Text>
          </View>

          {/* Prawa strzałka karuzeli */}
          <TouchableOpacity style={styles.carouselArrow}>
            <Ionicons name="chevron-forward" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ----------------- SEKCJA: SZYBKIE PRZYCISKI AKCJI ----------------- */}
      <View style={styles.actionButtonsRow}>
        {/* Przycisk: Dodaj Pomiar */}
        <TouchableOpacity style={styles.actionButtonLeft}>
          <Text style={styles.actionButtonText}>{t('home.addMeasure')}</Text>
        </TouchableOpacity>

        {/* Przycisk: Dodaj Incydent */}
        <TouchableOpacity style={styles.actionButtonRight}>
          <Text style={styles.actionButtonText}>{t('home.addIncident')}</Text>
        </TouchableOpacity>
      </View>

      {/* ----------------- SEKCJA: OSTATNIA AKTYWNOŚĆ ----------------- */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 8 }]}>
        {t('home.lastActivity')}
      </Text>
      <View style={[styles.sectionContainer, { marginBottom: 0, paddingVertical: 10 }]}>
        <View style={styles.activityCard}>
          {/* Element osi czasu 1: Pomiar kikuta */}
          <View style={styles.activityRow}>
            <View style={styles.activityContent}>
              <Text style={styles.activityLabel}>Ostatni pomiar kikuta:</Text>
              <Text style={styles.activityValue}>Dzisiaj, 08:30</Text>
            </View>
          </View>

          {/* Element osi czasu 2: Ostatni incydent */}
          <View style={styles.activityRow}>
            <View style={styles.activityContent}>
              <Text style={styles.activityLabel}>Ostatni incydent:</Text>
              <Text style={styles.activityValue}>5 dni temu</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Link: Pokaż całą historię */}
      <TouchableOpacity style={styles.historyLink}>
        <Text style={styles.historyLinkText}>Pokaż całą historię</Text>
      </TouchableOpacity>

      {/* ----------------- SEKCJA: UTILITY BUTTONS (NA DOLE) ----------------- */}
      <View style={styles.utilitiesContainer}>
        {/* Przycisk: Dofinansowania */}
        <TouchableOpacity onPress={() => router.push('../funding/accumulated_funds')} style={styles.utilityButton}>
          <View style={styles.utilityLeftContent}>
            <View style={styles.utilityIconBg}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.utilityText}>{t('home.funding')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Przycisk: Moje pliki i zdjęcia */}
        <TouchableOpacity style={styles.utilityButton}>
          <View style={styles.utilityLeftContent}>
            <View style={styles.utilityIconBg}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.utilityText}>{t('home.myFiles')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ----------------- PROSTY PRZEŁĄCZNIK MOTYWU (DEWELOPERSKI) ----------------- */}
      <TouchableOpacity 
        style={styles.themeToggleDevButton}
        onPress={() => setTheme(themeType === 'light' ? 'high-contrast' : 'light')}
      >
        <Text style={styles.themeToggleDevButtonText}>
          {themeType === 'light' ? 'Zmień na wysoki kontrast 🌙' : 'Zmień na jasny motyw ☀️'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors, themeType: 'light' | 'high-contrast') => {
  const isHighContrast = themeType === 'high-contrast';

  return StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingHorizontal: 24,
      paddingTop: 50,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerGreeting: {
      fontSize: 28,
      fontWeight: '300',
      color: colors.primary,
      letterSpacing: 1.5,
    },
    headerName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      letterSpacing: 1.5,
    },
    handIconContainer: {
      transform: [{ rotate: '-45deg' }],
    },
    sectionContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 40,
      marginBottom: 24,
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 10, // Dodano padding, aby strzałki nie wystawały
      width: '100%',
      // Zamiana boxShadow na standardowe właściwości React Native
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textPrimary,
      letterSpacing: 2,
      marginBottom: 16,
      textAlign: 'center',
    },
    carouselRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between', // Zmieniono na space-between dla lepszego rozkładu
      width: '100%',
    },
    carouselArrow: {
      padding: 5,
    },
    prostheticCard: {
      width: 200, // Zmniejszono nieco kartę, aby wszystko się mieściło
      height: 200,
      backgroundColor: colors.primary,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
      borderWidth: isHighContrast ? 2 : 0,
      borderColor: colors.textPrimary,
    },
    logoImage: {
      width: 120,
      height: 120,
      marginBottom: 10,
    },
    prostheticCardText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accentPrimary,
      textAlign: 'center',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 28,
      width: '100%',
    },
    actionButtonLeft: {
      flex: 0.47,
      height: 70,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: isHighContrast ? 2 : 0,
      borderColor: colors.textPrimary,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    actionButtonRight: {
      flex: 0.47,
      height: 70,
      backgroundColor: colors.accentPrimary,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    activityCard: {
      width: '100%',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      paddingHorizontal: 10,
      borderWidth: isHighContrast ? 2 : 0,
      borderColor: colors.textPrimary,
    },
    activityRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    activityContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    activityLabel: {
      fontSize: 14,
      color: colors.primary,
    },
    activityValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
    },
    historyLink: {
      marginTop: 10,
      alignSelf: 'flex-end',
    },
    historyLinkText: {
      padding: 10,
      fontSize: 13,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    utilitiesContainer: {
      width: '100%',
      marginTop: 20,
    },
    utilityButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: isHighContrast ? 2 : 0,
      borderColor: colors.textPrimary,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    utilityLeftContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    utilityIconBg: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    utilityText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.primary,
    },
    themeToggleDevButton: {
      paddingVertical: 8,
      alignSelf: 'center',
      opacity: 0.6,
    },
    themeToggleDevButtonText: {
      fontSize: 12,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
  });
};
