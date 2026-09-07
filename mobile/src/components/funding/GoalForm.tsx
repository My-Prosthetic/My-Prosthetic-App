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

interface GoalFormProps {
  mode: 'create' | 'edit';
}

export function GoalForm({ mode }: GoalFormProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { goalId } = useLocalSearchParams<{ goalId?: string }>();
  const id = mode === 'edit'
    ? Number.isSafeInteger(Number(goalId)) && Number(goalId) > 0
      ? Number(goalId)
      : null
    : null;
  const [goal, setGoal] = useState<Goal>();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== 'edit') {
      return;
    }

    const fetchGoal = async () => {
      if (id === null) {
        Alert.alert(t('common.error'), t('funds.goalNotFound'));
        setIsLoading(false);
        router.back();
        return;
      }

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
        setAmount(String(savedGoal.amount / 100));
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
  }, [id, mode, t]);

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    if (mode === 'edit' && id === null) {
      Alert.alert(t('common.error'), t('funds.goalNotFound'));
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

    try {
      setIsSubmitting(true);
      const values = {
        name: name.trim(),
        amount: Math.round(parsedAmount * 100),
        note: note.trim() || null,
      };

      if (mode === 'create') {
        await db.insert(goals).values(values);
      } else {
        await db.update(goals).set(values).where(eq(goals.id, id!));
      }

      router.back();
    } catch (error) {
      console.error('Błąd podczas zapisu celu:', error);
      Alert.alert(
        t('common.error'),
        t(mode === 'create' ? 'funds.saveGoalError' : 'funds.updateGoalError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (isSubmitting || mode !== 'edit' || id === null) {
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

  if (isLoading || (mode === 'edit' && !goal)) {
    return (
      <ThemedView colorName="tertiary_base_2" variant="background" style={styles.loading}>
        <ActivityIndicator color={colors.primary_base} />
      </ThemedView>
    );
  }

  return (
    <ThemedView colorName="tertiary_base_2" variant="background" style={styles.screen}>
      <View>
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.goalName" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.textField}>
            <TextInput value={name} onChangeText={setName} placeholder={t('funds.goalNamePlaceholder')} placeholderTextColor={colors.primary_base} style={styles.textInput} />
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.goalAmount" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.amountField}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.primary_base} style={styles.amountInput} />
            <ThemedText variant="subTitle1" colorName="primary_base_2">PLN</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.additionalNote" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.noteField}>
            <TextInput value={note} onChangeText={setNote} placeholder={t('funds.notePlaceholder')} placeholderTextColor={colors.primary_base} style={styles.noteInput} multiline />
          </ThemedView>
        </View>
      </View>

      <View style={styles.actions}>
        <ThemedView variant="narrow" colorName="primary_base" borderColor="accent_base" onPress={isSubmitting ? undefined : handleSave}>
          {isSubmitting ? <ActivityIndicator color={colors.accent_base_2} /> :
            <ThemedText variant="main1Button" colorName="accent_base_2" tx={mode === 'create' ? 'funds.addGoalAction' : 'common.save'} />
          }
        </ThemedView>
        <ThemedText variant="main1Button" colorName={mode === 'edit' ? 'false' : 'primary_base'} style={styles.cancelAction} onPress={mode === 'edit' ? handleDelete : () => router.back()} tx={mode === 'edit' ? 'common.delete' : 'common.cancel'} />
      </View>
    </ThemedView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  formSection: { marginTop: 15 },
  fieldLabel: { marginBottom: 8 },
  textField: { borderWidth: 1, paddingVertical: 0 },
  amountField: { borderWidth: 1, justifyContent: 'space-between', flexDirection: 'row', height: 50, paddingVertical: 0 },
  noteField: { borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 },
  textInput: { width: '100%', padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 18 },
  amountInput: { flex: 1, padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 22 },
  noteInput: { minHeight: 80, textAlignVertical: 'top', width: '100%', color: colors.primary_base_1, fontFamily: 'Afacad-Medium', fontSize: 16 },
  actions: { gap: 16, marginBottom: 16, alignItems: 'center' },
  cancelAction: { padding: 8 },
});