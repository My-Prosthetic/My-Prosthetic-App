import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { useTheme } from '@/context/ThemeContext';
import { formatDate } from '@/src/utils/dateFormatter';
import { useTranslation } from 'react-i18next';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const DAYS_RANGE = 365; // ± 1 rok w obie strony

interface DateOption {
  id: string;
  label: string;
  date: Date;
}

export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedDate: Date) => void;
  initialDate?: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList<DateOption>>(null);

  // Lista generowana raz, z użyciem utila formatDate
  const dateOptions = useMemo<DateOption[]>(() => {
    const options: DateOption[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = -DAYS_RANGE; offset <= DAYS_RANGE; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);

      options.push({
        id: d.toDateString(),
        label: formatDate(d, 'label', today),
        date: d,
      });
    }

    return options;
  }, [t]);

  const [selectedId, setSelectedId] = useState<string>(
    () => (initialDate ? initialDate.toDateString() : dateOptions[DAYS_RANGE].id)
  );

  // Po otwarciu ustawia selekcję na przekazaną datę i przewija widok
  useEffect(() => {
    if (visible) {
      const targetDateString = (initialDate ?? new Date()).toDateString();
      const targetIndex = dateOptions.findIndex((opt) => opt.id === targetDateString);
      const safeIndex = targetIndex !== -1 ? targetIndex : DAYS_RANGE;

      setSelectedId(dateOptions[safeIndex].id);

      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: Math.max(0, safeIndex - 2),
          animated: false,
        });
      }, 50);
    }
  }, [visible]);

  const handleSave = () => {
    const selected = dateOptions.find((d) => d.id === selectedId);
    if (selected) onSave(selected.date);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Kliknięcie poza modalem zamyka okno */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <ThemedView
          colorName="tertiary_base_3"
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, 24) + 40,
              paddingHorizontal: 0,
              marginBottom: -insets.bottom,
            },
          ]}
        >
          {/* Przewijana lista z zakresem roku */}
          <View style={styles.listContainer}>
            <FlatList
              ref={flatListRef}
              data={dateOptions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              initialScrollIndex={DAYS_RANGE - 2}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedId(item.id)}
                    style={[
                      styles.dateRow,
                      isSelected && { backgroundColor: colors.primary_base_1, opacity: 0.5 },
                    ]}
                  >
                    <ThemedText
                      colorName="primary_base"
                      variant="title"
                      style={[
                        styles.dateText,
                        isSelected && styles.selectedDateText,
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Przyciski akcji */}
          <View style={styles.actionsContainer}>
            <ThemedView
              variant="narrow"
              colorName="primary_base"
              borderColor="accent_base"
              onPress={handleSave}
            >
              <ThemedText variant="main1Button" colorName="accent_base" tx="common.save" />
            </ThemedView>

            <ThemedView
              variant="narrow"
              colorName="accent_base_1"
              onPress={onClose}
            >
              <ThemedText variant="main1Button" colorName="primary_base" tx="common.cancel" />
            </ThemedView>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 0,
    paddingHorizontal: 20,
    width: '100%',
  },
  listContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginVertical: 6,
  },
  dateRow: {
    height: ITEM_HEIGHT,
    paddingLeft: 30,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dateText: {
    opacity: 0.8,
    fontSize: 24
  },
  selectedDateText: {
    opacity: 1,
  },
  actionsContainer: {
    marginBottom: 16,
    gap: 10,
    alignItems: 'center',
  },
});