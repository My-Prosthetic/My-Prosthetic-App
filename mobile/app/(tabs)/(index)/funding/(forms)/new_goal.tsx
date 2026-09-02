import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { goals } from '@/db/schema/funding/goals';

export default function NewGoalScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveGoal = async () => {
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
    const centAmount = parsedAmount * 100;

    try {
      setIsSubmitting(true);
      await db.insert(goals).values({
        name: name.trim(),
        amount: Math.round(centAmount),
        note: note.trim() || null,
      });
      router.back();
    } catch (error) {
      console.error('Błąd podczas zapisu celu:', error);
      Alert.alert(t('common.error'), t('funds.saveGoalError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView colorName="tertiary_base_2" variant="background" style={styles.screen}>
      <View>
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.goalName" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={{ borderWidth: 1, paddingVertical: 0 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('funds.goalNamePlaceholder')}
              placeholderTextColor={colors.primary_base}
              style={styles.textInput}
            />
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.goalAmount" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.amountField}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.primary_base}
              style={styles.amountInput}
            />
            <ThemedText variant="subTitle1" colorName="primary_base_2">PLN</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.additionalNote" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.noteField}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('funds.notePlaceholder')}
              placeholderTextColor={colors.primary_base}
              style={styles.noteInput}
              multiline
            />
          </ThemedView>
        </View>
      </View>

      <View style={styles.actions}>
        <ThemedView
          variant="narrow"
          colorName="primary_base"
          borderColor="accent_base"
          onPress={isSubmitting ? undefined : handleSaveGoal}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.accent_base_2} />
          ) : (
            <>
              <ThemedText colorName="accent_base_2" style={{paddingHorizontal: 10}}>+</ThemedText>
              <ThemedText variant="main1Button" colorName="accent_base_2" tx="funds.addGoalAction" />
            </>
          )}
        </ThemedView>
        <ThemedText
          variant="main1Button"
          colorName="primary_base"
          style={styles.cancelAction}
          onPress={() => router.back()}
          tx="common.cancel"
        />
      </View>
    </ThemedView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  formSection: { marginTop: 15 },
  fieldLabel: { marginBottom: 8 },
  amountField: { borderWidth: 1, justifyContent: 'space-between', flexDirection: 'row', height: 50, paddingVertical: 0 },
  noteField: { borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 },
  textInput: { width: '100%', padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 18 },
  amountInput: { flex: 1, padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 22 },
  noteInput: { minHeight: 80, textAlignVertical: 'top', width: '100%', color: colors.primary_base_1, fontFamily: 'Afacad-Medium', fontSize: 16 },
  actions: { gap: 16, marginBottom: 16, alignItems: 'center' },
  cancelAction: { padding: 8 },
});
