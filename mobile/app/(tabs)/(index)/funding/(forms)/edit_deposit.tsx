import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { DropdownOption, DropdownSelect } from '@/src/components/DropdownSelect';
import { DatePickerModal } from '@/src/components/DatePicker';
import { formatDate } from '@/src/utils/dateFormatter';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { deposits } from '@/db/schema/funding/deposits';

type FundingSource = 'family' | 'fundraiser' | 'grant' | 'savings' | 'other';
type Deposit = typeof deposits.$inferSelect;

export default function EditDepositScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { depositId } = useLocalSearchParams<{ depositId?: string }>();
  const id = Number.isSafeInteger(Number(depositId)) && Number(depositId) > 0
    ? Number(depositId)
    : null;
  const [deposit, setDeposit] = useState<Deposit>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [fundingSource, setFundingSource] = useState<FundingSource>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fundingSources: DropdownOption<FundingSource>[] = [
    { value: 'family', label: t('funds.sources.family') },
    { value: 'fundraiser', label: t('funds.sources.fundraiser') },
    { value: 'grant', label: t('funds.sources.grant') },
    { value: 'savings', label: t('funds.sources.savings') },
    { value: 'other', label: t('funds.sources.other') },
  ];

  useEffect(() => {
    const fetchDeposit = async () => {
      if (id === null) {
        Alert.alert(t('common.error'), t('funds.depositNotFound'));
        setIsLoading(false);
        router.back();
        return;
      }

      try {
        const result = await db.select().from(deposits).where(eq(deposits.id, id));
        const savedDeposit = result[0];
        if (!savedDeposit) {
          Alert.alert(t('common.error'), t('funds.depositNotFound'));
          router.back();
          return;
        }

        setDeposit(savedDeposit);
        setAmount(String(savedDeposit.amount % 100 !== 0 ? (savedDeposit.amount/100).toFixed(2) : savedDeposit.amount/100));
        setNote(savedDeposit.note ?? '');
        setSelectedDate(new Date(savedDeposit.assignedAt));
        setFundingSource(
          fundingSources.find((source) => source.value === savedDeposit.source)?.value
          ?? 'other',
        );
      } catch (error) {
        console.error('Błąd podczas pobierania wpłaty:', error);
        Alert.alert(t('common.error'), t('funds.loadDepositError'));
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeposit();
  }, [id, t]);

  const handleUpdateDeposit = async () => {
    if (isSubmitting) {
      return;
    }

    if (id === null) {
      Alert.alert(t('common.error'), t('funds.depositNotFound'));
      return;
    }

    if (!fundingSource) {
      Alert.alert(t('common.error'), t('funds.chooseFundingSourceError'));
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('funds.invalidAmountError'));
      return;
    }
    const centAmount = parsedAmount*100;

    try {
      setIsSubmitting(true);
      await db.update(deposits).set({
        source: fundingSource,
        amount: Math.round(centAmount),
        assignedAt: selectedDate.toISOString(),
        note: note.trim() || null,
      }).where(eq(deposits.id, id));
      router.back();
    } catch (error) {
      console.error('Błąd podczas aktualizacji wpłaty:', error);
      Alert.alert(t('common.error'), t('funds.updateDepositError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDeposit = () => {
    if (isSubmitting) {
      return;
    }

    Alert.alert(
      t('funds.deleteDepositTitle'),
      t('funds.deleteDepositMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (isSubmitting || id === null) {
              return;
            }

            try {
              setIsSubmitting(true);
              await db.delete(deposits).where(eq(deposits.id, id));
              router.back();
            } catch (error) {
              console.error('Błąd podczas usuwania wpłaty:', error);
              Alert.alert(t('common.error'), t('funds.deleteDepositError'));
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !deposit) {
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
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.fundingSource" />
          <DropdownSelect
            label={t('funds.fundingSource')}
            placeholder={t('funds.select')}
            options={fundingSources}
            value={fundingSource}
            onChange={setFundingSource}
          />
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.grantedAmount" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.inputField}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} />
            <ThemedText variant="subTitle1" colorName="primary_base_2">PLN</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.decisionDate" />
          <ThemedView borderColor="primary_base_2" colorName="tertiary_base_3" variant="wide" onPress={() => setDateModalVisible(true)} style={styles.dateField}>
            <ThemedText variant="main1Button" colorName="primary_base">{formatDate(selectedDate, 'numeric')}</ThemedText>
            <Ionicons name="chevron-down" size={32} color={colors.primary_base} />
          </ThemedView>
        </View>

        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.additionalNote" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.noteField}>
            <TextInput value={note} onChangeText={setNote} placeholder={t('funds.notePlaceholder')} placeholderTextColor={colors.primary_base} style={styles.noteInput} multiline />
          </ThemedView>
        </View>
      </View>

      <View style={styles.actions}>
        <ThemedView variant="narrow" colorName="primary_base" borderColor="accent_base" onPress={isSubmitting ? undefined : handleUpdateDeposit}>
          {isSubmitting ? <ActivityIndicator color={colors.accent_base} /> :
            <ThemedText variant="main1Button" colorName="accent_base" tx="common.save" />
          }
        </ThemedView>
        <ThemedText variant="main1Button" colorName="false" style={styles.cancelAction} onPress={deleteDeposit} tx="common.delete" />
      </View>

      <DatePickerModal visible={dateModalVisible} initialDate={selectedDate} onClose={() => setDateModalVisible(false)} onSave={setSelectedDate} />
    </ThemedView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  formSection: { marginTop: 15 },
  inputField: { borderWidth: 1, justifyContent: 'space-between', flexDirection: 'row', height: 50, paddingVertical: 0 },
  dateField: { borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 },
  noteField: { borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 },
  amountInput: { flex: 1, padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 22 },
  noteInput: { minHeight: 80, textAlignVertical: 'top', width: '100%', color: colors.primary_base_1, fontFamily: 'Afacad-Medium', fontSize: 16 },
  actions: { gap: 16, marginBottom: 16, alignItems: 'center' },
  cancelAction: { padding: 8 },
});
