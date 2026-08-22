import React, { useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, View, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { eq } from 'drizzle-orm';

import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { Carousel } from '@/src/components/Carousel';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

import { db } from '@/db/client';
import { goals } from '@/db/schema/funding/goals';
import { deposits } from '@/db/schema/funding/deposits';

import { seedFundingData } from '@/tymon/mockDeposits';

type Goal = typeof goals.$inferSelect;
type Deposit = typeof deposits.$inferSelect;

export default function AccumulatedFundsScreen() {
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [depositsList, setDepositsList] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  
  const currentGoal: Goal | undefined = goalsList[currentGoalIndex];
  const accumulatedDeposit = depositsList.reduce(
    (total, item: Deposit) => total + (item.amount || 0),
    0
  );

  const { colors } = useTheme();
  const styles = getStyles(colors);

  const fetchGoals = async () => {
    try {
      const data = await db.select().from(goals);
      setGoalsList(data);
    } catch (error) {
      console.error('Błąd podczas pobierania celów:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async (goalId: number) => {
    try {
      const data = await db.select().from(deposits).where(eq(deposits.goalId, goalId));
      setDepositsList(data);
    } catch (error) {
      console.error('Błąd podczas pobierania wpłat:', error);
    }
  };

  const progressPercentage = currentGoal?.amount 
    ? Math.min((accumulatedDeposit / currentGoal.amount) * 100, 100) 
    : 0;

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (currentGoal?.id) {
        fetchDeposits(currentGoal.id);
      } else {
        setDepositsList([]);
      }
    }, [currentGoal?.id])
  );

  const renderPlus = () => (
    <ThemedView variant="wide" colorName="tertiary_base_3" style={styles.carouselOutline}>
      <ThemedText onPress={() => router.push('../new_goal')} colorName="primary_base" tx="funds.addGoal" />
    </ThemedView>
  );

  const renderGoal = (item: Goal) => (
    <ThemedView key={item.id} variant="wide" colorName="tertiary_base_3" style={styles.carouselOutline}>
      <ThemedText colorName="primary_base">{item.name}</ThemedText>
    </ThemedView>
  );

  return (

      <ThemedView colorName="tertiary_base_2" variant="background" style={styles.container}>
        <ThemedText
          variant="tab1Category"
          colorName="secondary_base_0c"
          tx="funds.prostheticBudget"
          style={{ marginBottom: 6 }}
        />

        {/*KARUZELA*/}
        {loading ? (
          <ActivityIndicator color={colors.primary_base} style={{ marginVertical: 20 }} />
        ) : (
          <View style={{ marginBottom: 6 }}>
            <Carousel
              items={goalsList}
              renderItem={renderGoal}
              renderPlus={renderPlus}
              cardStyle={styles.carouselCard}
              setExternalIndex={setCurrentGoalIndex}
            />
          </View>
        )}

        {currentGoal !== undefined &&
        <>

        {/*ILE ZEBRANO*/}
        <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_3" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <ThemedText variant="body1Regular" colorName="secondary_base_0c" tx="funds.collected" />
              <ThemedText variant="main1Button" style={{fontSize: 24, paddingTop: 6}} colorName="primary_base">
                {accumulatedDeposit.toLocaleString('pl-PL')} zł
              </ThemedText>
            </View>
            <ThemedView variant='tag' colorName='primary_base_4' style={{marginVertical: 0}}>
              <ThemedText variant="main1Button" colorName="primary_base" style={{fontSize: 10}} tx="funds.datePlaceholder" />
            </ThemedView>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </ThemedView>

          {/*LISTA ZAPISANYCH WPŁAT*/}
        <ThemedText
          variant="tab1Category"
          colorName="secondary_base_0c"
          style={{ marginBottom: 6 }}
          tx="funds.savedSources"
        />
      <ScrollView
      showsVerticalScrollIndicator={true}
      >
        <View>
          {depositsList.map((deposit) => (
            <Pressable
              key={deposit.id}
              style={styles.depositItem}
              onPress={() => router.push(`../edit_deposit?depositId=${deposit.id}`)}
            >
              <ThemedText variant="subTitle1" colorName="primary_base" style={{paddingVertical: 10}}>
                {deposit.source || 'Wpłata'}
              </ThemedText>
              <ThemedText variant="body1Regular" colorName="primary_base">
                {((deposit).amount || 0).toLocaleString('pl-PL')} zł
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/*DODAJ UZYSKANE ŚRODKI*/}
        <ThemedView 
          variant="wide" 
          colorName="primary_base" 
          borderColor="accent_base" 
          onPress={() => router.push(`../new_deposit?goalId=${currentGoal.id}`)}
          style={{marginVertical: 16}}
        >
          <ThemedText 
            colorName="accent_base_2" 
          >
            +
          </ThemedText>
          <ThemedText 
            variant="main1Button" 
            tx="funds.addDeposit" 
            colorName="accent_base_2" 
          >
          </ThemedText>
        </ThemedView>
      </>}
    </ThemedView>
  ); 
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    carouselCard: {
      width: '100%',
      height: 100,
    },
    carouselOutline: {
      borderWidth: 2,
      borderColor: colors.primary_base,
      padding: 16,
      borderRadius: 16,
      height: '100%',
    },
    summaryCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      flexDirection: 'column',
      marginBottom: 6,
    },
    summaryHeader: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: colors.primary_base_4,
      borderRadius: 4,
      overflow: 'hidden',
      width: '100%',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary_base,
      borderRadius: 4,
    },
    depositItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.primary_base_3,
    },
  });