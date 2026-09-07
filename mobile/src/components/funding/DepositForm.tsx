import React, { useEffect, useState, useMemo } from 'react';
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
import { FUNDING_SOURCE_IDS, FundingSource, getFundingSourceOptions } from '@/src/constants/fundingSources';

type Deposit = typeof deposits.$inferSelect;

interface DepositFormProps {
  mode: 'create' | 'edit';
}

export function DepositForm({ mode }: DepositFormProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ goalId?: string; depositId?: string }>();
  const goalId = mode === 'create'
    ? Number.isSafeInteger(Number(params.goalId)) && Number(params.goalId) > 0 ? Number(params.goalId) : null
    : null;
  const depositId = mode === 'edit'
    ? Number.isSafeInteger(Number(params.depositId)) && Number(params.depositId) > 0 ? Number(params.depositId) : null
    : null;
  const [deposit, setDeposit] = useState<Deposit>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [fundingSource, setFundingSource] = useState<FundingSource>();
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const options = useMemo(() => getFundingSourceOptions(t), [t]);

  useEffect(() => {
    if (mode !== 'edit') return;

    const fetchDeposit = async () => {
      if (depositId === null) {
        Alert.alert(t('common.error'), t('funds.depositNotFound'));
        setIsLoading(false);
        router.back();
        return;
      }

      try {
        const result = await db.select().from(deposits).where(eq(deposits.id, depositId));
        const savedDeposit = result[0];
        if (!savedDeposit) {
          Alert.alert(t('common.error'), t('funds.depositNotFound'));
          router.back();
          return;
        }

        setDeposit(savedDeposit);
        setAmount(String(savedDeposit.amount / 100));
        setNote(savedDeposit.note ?? '');
        setSelectedDate(new Date(savedDeposit.assignedAt));
        setFundingSource(
        (FUNDING_SOURCE_IDS as readonly string[]).includes(savedDeposit.source)
            ? (savedDeposit.source as FundingSource)
            : 'other'
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
  }, [depositId, mode, t]);

  const handleSave = async () => {
    if (isSubmitting) return;
    if (mode === 'create' && goalId === null) {
      Alert.alert(t('common.error'), t('funds.goalNotFound'));
      return;
    }
    if (mode === 'edit' && depositId === null) {
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

    try {
      setIsSubmitting(true);
      const values = {
        source: fundingSource,
        amount: Math.round(parsedAmount * 100),
        assignedAt: selectedDate.toISOString(),
        note: note.trim() || null,
      };

      if (mode === 'create') {
        await db.insert(deposits).values({ goalId: goalId!, ...values });
      } else {
        await db.update(deposits).set(values).where(eq(deposits.id, depositId!));
      }

      router.back();
    } catch (error) {
      console.error('Błąd podczas zapisu wpłaty:', error);
      Alert.alert(t('common.error'), t(mode === 'create' ? 'funds.saveDepositError' : 'funds.updateDepositError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (isSubmitting || mode !== 'edit' || depositId === null) return;

    Alert.alert(t('funds.deleteDepositTitle'), t('funds.deleteDepositMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            await db.delete(deposits).where(eq(deposits.id, depositId));
            router.back();
          } catch (error) {
            console.error('Błąd podczas usuwania wpłaty:', error);
            Alert.alert(t('common.error'), t('funds.deleteDepositError'));
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  if (isLoading || (mode === 'edit' && !deposit)) {
    return <ThemedView colorName="tertiary_base_2" variant="background" style={styles.loading}><ActivityIndicator color={colors.primary_base} /></ThemedView>;
  }

  return (
    <ThemedView colorName="tertiary_base_2" variant="background" style={styles.screen}>
      <View>
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.fundingSource" />
          <DropdownSelect label={t('funds.fundingSource')} placeholder={t('funds.select')} options={options} value={fundingSource} onChange={setFundingSource} />
        </View>
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.grantedAmount" />
          <ThemedView variant="wide" colorName="tertiary_base_3" borderColor="primary_base_2" style={styles.amountField}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.primary_base} style={styles.amountInput} />
            <ThemedText variant="subTitle1" colorName="primary_base_2">PLN</ThemedText>
          </ThemedView>
        </View>
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={styles.fieldLabel} tx="funds.decisionDate" />
          <ThemedView borderColor="primary_base_2" colorName="tertiary_base_3" variant="wide" onPress={() => setDateModalVisible(true)} style={styles.dateField}>
            <ThemedText variant="main1Button" colorName="primary_base">{formatDate(selectedDate, 'numeric')}</ThemedText>
            <Ionicons name="chevron-down" size={32} color={colors.primary_base} />
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
        <ThemedView variant={mode === "create" ? "wide" : "narrow"} colorName="primary_base" borderColor="accent_base" onPress={isSubmitting ? undefined : handleSave}>
          {isSubmitting ? <ActivityIndicator color={colors.accent_base} /> : (
            <>
              {mode === 'create' && <ThemedText colorName="accent_base_2" style={{ paddingHorizontal: 10 }}>+</ThemedText>}
              <ThemedText variant="main1Button" colorName="accent_base" tx={mode === 'create' ? 'funds.addToWallet' : 'common.save'} />
            </>
          )}
        </ThemedView>
        <ThemedText variant="main1Button" colorName={mode === 'edit' ? 'false' : 'primary_base'} style={styles.cancelAction} onPress={mode === 'edit' ? handleDelete : () => router.back()} tx={mode === 'edit' ? 'common.delete' : 'common.cancel'} />
      </View>
      <DatePickerModal visible={dateModalVisible} initialDate={selectedDate} onClose={() => setDateModalVisible(false)} onSave={setSelectedDate} />
    </ThemedView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  formSection: { marginTop: 15 },
  fieldLabel: { marginBottom: 8 },
  amountField: { borderWidth: 1, justifyContent: 'space-between', flexDirection: 'row', height: 50, paddingVertical: 0 },
  dateField: { borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 },
  noteField: { borderWidth: 1, justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 10 },
  amountInput: { flex: 1, padding: 0, color: colors.primary_base, fontFamily: 'Inter-SemiBold', fontSize: 22 },
  noteInput: { minHeight: 80, textAlignVertical: 'top', width: '100%', color: colors.primary_base_1, fontFamily: 'Afacad-Medium', fontSize: 16 },
  actions: { gap: 16, marginBottom: 16, alignItems: 'center' },
  cancelAction: { padding: 8 },
});