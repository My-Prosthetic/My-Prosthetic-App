import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { DropdownOption, DropdownSelect } from '@/src/components/DropdownSelect';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from '@/src/components/DatePicker';
import { formatDate } from '@/src/utils/dateFormatter';

import { db } from '@/db/client';
import { deposits } from '@/db/schema/funding/deposits';

type FundingSource = 'family' | 'fundraiser' | 'grant' | 'savings' | 'other';

export default function NewDepositScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const fundingSources: DropdownOption<FundingSource>[] = [
    { value: 'family', label: t('funds.sources.family') },
    { value: 'fundraiser', label: t('funds.sources.fundraiser') },
    { value: 'grant', label: t('funds.sources.grant') },
    { value: 'savings', label: t('funds.sources.savings') },
    { value: 'other', label: t('funds.sources.other') },
  ];
  
  const params = useLocalSearchParams<{ goalId?: string }>();
  const goalId = Number.isSafeInteger(Number(params.goalId)) && Number(params.goalId) > 0
    ? Number(params.goalId)
    : null;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [fundingSource, setFundingSource] = useState<FundingSource>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSaveDeposit = async () => {
    if (isSubmitting) {
      return;
    }

    if (goalId === null) {
      Alert.alert(t('common.error'), t('funds.goalNotFound'));
      return;
    }

    // 1. Walidacja
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

      await db.insert(deposits).values({
        goalId: goalId,
        source: fundingSource,
        amount: Math.round(centAmount),
        assignedAt: selectedDate.toISOString(),
        note: note.trim() || null,
      });

      // 3. Powrót do poprzedniego ekranu
      router.back();
    } catch (error) {
      console.error('Błąd podczas zapisu wpłaty:', error);
      Alert.alert(t('common.error'), t('funds.saveDepositError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView colorName="tertiary_base_2" variant="background" style={{ justifyContent: 'space-between' }}>
      <View>
        {/* Źródło finansowania */}
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

        {/* Kwota */}
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.grantedAmount" />
          <ThemedView
            variant="wide"
            colorName="tertiary_base_3"
            borderColor="primary_base_2"
            style={{
              borderWidth: 1,
              justifyContent: 'space-between',
              flexDirection: 'row',
              height: 50,
              paddingVertical: 0,
            }}
          >
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.primary_base}
              style={styles.amountInput}
            />
            <ThemedText variant="subTitle1" colorName="primary_base_2">
              PLN
            </ThemedText>
          </ThemedView>
        </View>

        {/* Data */}
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.decisionDate" />
          <ThemedView
            borderColor="primary_base_2"
            colorName="tertiary_base_3"
            variant="wide"
            onPress={() => setDateModalVisible(true)}
            style={{
              borderWidth: 1,
              justifyContent: 'space-between',
              paddingVertical: 0,
              paddingHorizontal: 10,
            }}
          >
            <ThemedText variant="main1Button" colorName="primary_base">
              {formatDate(selectedDate, 'numeric')}
            </ThemedText>
            <Ionicons name="chevron-down" size={32} color={colors.primary_base} />
          </ThemedView>
        </View>

        {/* Notatka */}
        <View style={styles.formSection}>
          <ThemedText variant="tab1Category" colorName="secondary_base_0c" style={{ marginBottom: 8 }} tx="funds.additionalNote" />
          <ThemedView
            variant="wide"
            colorName="tertiary_base_3"
            borderColor="primary_base_2"
            style={{
              borderWidth: 1,
              justifyContent: 'space-between',
              paddingVertical: 0,
              paddingHorizontal: 10,
            }}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              keyboardType="default"
              placeholder={t('funds.notePlaceholder')}
              placeholderTextColor={colors.primary_base}
              style={styles.noteInput}
              multiline={true}
            />
          </ThemedView>
        </View>
      </View>

      <View style={styles.actions}>
        <ThemedView
          variant="wide"
          colorName="primary_base"
          borderColor="accent_base"
          style={styles.primaryAction}
          onPress={isSubmitting ? undefined : handleSaveDeposit}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.accent_base_2} />
          ) : (
            <>
              <ThemedText colorName="accent_base_2" style={{ paddingHorizontal: 10 }}>+</ThemedText>
              <ThemedText variant="main1Button" colorName="accent_base_2" tx="funds.addToWallet" />
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

      <DatePickerModal
        visible={dateModalVisible}
        initialDate={selectedDate}
        onClose={() => setDateModalVisible(false)}
        onSave={(date) => {
          setSelectedDate(date);
        }}
      />
    </ThemedView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    formSection: {
      marginTop: 15,
    },
    content: {
      padding: 16,
      gap: 24,
      paddingBottom: 32,
    },
    noteInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      width: '100%',
      color: colors.primary_base_1,
      fontFamily: 'Afacad-Medium',
      fontSize: 16,
    },
    fieldGroup: {
      gap: 8,
      zIndex: 1,
    },
    amountInput: {
      flex: 1,
      padding: 0,
      color: colors.primary_base,
      fontFamily: 'Inter-SemiBold',
      fontSize: 22,
    },
    staticField: {
      minHeight: 52,
      borderWidth: 1.5,
      borderColor: colors.primary_base,
      borderRadius: 16,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    actions: {
      gap: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    primaryAction: {
      width: '100%',
      marginVertical: 0,
      borderWidth: 1.5,
      borderRadius: 24,
    },
    cancelAction: {
      padding: 8,
    },
  });