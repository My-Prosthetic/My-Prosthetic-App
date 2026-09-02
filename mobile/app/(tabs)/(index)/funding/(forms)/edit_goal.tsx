import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { goals } from '@/db/schema/funding/goals';

type Goal = typeof goals.$inferSelect;

export default function EditGoalScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { goalId } = useLocalSearchParams<{ goalId?: string }>();
  const id = Number(goalId);
  const [goal, setGoal] = useState<Goal>();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const result = await db.select().from(goals).where(eq(goals.id, id));
        const savedGoal = result[0];
        if (!savedGoal) {
          Alert.alert(t('common.error'), t('funds.goalNotFound'));
          router.back();
          return;
        }

        setGoal(savedGoal);
        setName(savedGoal.name);
        setAmount(String(savedGoal.amount % 100 !== 0 ? (savedGoal.amount/100).toFixed(2) : savedGoal.amount/100));
        setNote(savedGoal.note ?? '');
      } catch (error) {
        console.error('Błąd podczas pobierania celu:', error);
        Alert.alert(t('common.error'), t('funds.loadGoalError'));
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, [id]);

  const handleUpdateGoal = async () => {
    if (isSubmitting) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(t('common.error'), t('funds.emptyGoalNameError'));
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('funds.invalidGoalAmountError'));
      return;
    }
    const centAmount = parsedAmount*100;

    try {
      setIsSubmitting(true);
      await db.update(goals).set({
        name: name.trim(),
        amount: Math.round(centAmount),
        note: note.trim() || null,
      }).where(eq(goals.id, id));
      router.back();
    } catch (error) {
      console.error('Błąd podczas aktualizacji celu:', error);
      Alert.alert(t('common.error'), t('funds.updateGoalError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGoal = () => {
    if (isSubmitting) {
      return;
    }

    Alert.alert(
      t('funds.deleteGoalTitle'),
      t('funds.deleteGoalMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (isSubmitting) {
              return;
            }

            try {
              setIsSubmitting(true);
              await db.delete(goals).where(eq(goals.id, id));
              router.back();
            } catch (error) {
              console.error('Błąd podczas usuwania celu:', error);
              Alert.alert(t('common.error'), t('funds.deleteGoalError'));
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !goal) {
    return (
      <ThemedView colorName="tertiary_base_2" variant="background" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary_base} />
      </ThemedView>
    );
  }

  return (
    <ThemedView colorName="tertiary_base_2" variant="background" style={{ justifyContent: 'space-between' }}>
      <View>
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.goalName" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={{ borderWidth: 1, paddingVertical: 0 }}>
            <TextInput value={name} onChangeText={setName} style={styles.textInput} />
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.goalAmount" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={{ borderWidth: 1, justifyContent: 'space-between', flexDirection: 'row', height: 50, paddingVertical: 0 }}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} />
            <ThemedText variant="subTitle1" colorName="primary_base_2">PLN</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.additionalNote" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={{ borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 }}>
            <TextInput value={note} onChangeText={setNote} placeholder={t('funds.notePlaceholder')} placeholderTextColor={colors.primary_base} style={styles.noteInput} multiline />
          </ThemedView>
        </View>
      </View>

      <View style={styles.actions}>
        <ThemedView variant="narrow" colorName="primary_base" borderColor="accent_base" onPress={isSubmitting ? undefined : handleUpdateGoal}>
          {isSubmitting ? <ActivityIndicator color={colors.accent_base} /> :
            <ThemedText variant="main1Button" colorName="accent_base" tx="common.save" />
          }
        </ThemedView>
        <ThemedText variant="main1Button" colorName="false" style={{ padding: 8 }} onPress={deleteGoal} tx="common.delete" />
      </View>
    </ThemedView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  formSection: { marginTop: 15 },
  fieldLabel: { marginBottom: 8 },
  textInput: { width: '100%', padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 18 },
  amountInput: { flex: 1, padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 22 },
  noteInput: { minHeight: 80, textAlignVertical: 'top', width: '100%', color: colors.primary_base_1, fontFamily: 'Afacad-Medium', fontSize: 16 },
  actions: { gap: 16, marginBottom: 16, alignItems: 'center' },
});
