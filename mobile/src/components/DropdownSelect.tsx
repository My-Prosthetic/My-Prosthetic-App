import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemeColors, useTheme } from '@/context/ThemeContext';

export interface DropdownOption<T> {
  label: string;
  value: T;
}

interface DropdownSelectProps<T> {
  label: string;
  placeholder: string;
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  getOptionKey?: (value: T) => string;
}

export function DropdownSelect<T>({
  placeholder,
  options,
  value,
  onChange,
  getOptionKey = (option) => String(option),
}: DropdownSelectProps<T>) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setIsOpen((open) => !open)}
        style={styles.trigger}
      >
        <ThemedText
          variant="main1Button"
          colorName='primary_base'
        >
          {selectedOption?.label ?? placeholder}
        </ThemedText>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary_base}
        />
      </Pressable>
      {isOpen && (
        <ThemedView colorName="tertiary_base_3" style={styles.menu}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={getOptionKey(option.value)}
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={[styles.option, isSelected && styles.selectedOption]}
                >
                  <ThemedText variant="body1Regular" colorName="primary_base">
                    {option.label}
                  </ThemedText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={colors.primary_base} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </ThemedView>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
      zIndex: 2,
    },
    trigger: {
      height: 50,
      borderWidth: 1,
      borderColor: colors.primary_base_2,
      backgroundColor: colors.tertiary_base_3,
      borderRadius: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menu: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.primary_base,
      borderRadius: 16,
      paddingVertical: 4,
      maxHeight: 176,
      overflow: 'hidden',
    },
    option: {
      minHeight: 48,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedOption: {
      backgroundColor: colors.primary_base_4,
    },
  });
