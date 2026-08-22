import React, { ReactElement, useState } from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  renderPlus?: () => React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  setExternalIndex?: (newIndex: number) => void;
}

export function Carousel<T>({
  items,
  renderItem,
  renderPlus,
  cardStyle,
  setExternalIndex
}: CarouselProps<T>): ReactElement | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colors } = useTheme();
  const totalLength = renderPlus ? items.length + 1 : items.length;

  if (totalLength === 0) {
    return null;
  }

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalLength - 1;
  const isPlusCard = renderPlus && currentIndex === items.length;

  return (
    <View style={styles.container}>
      {/* Lewa strzałka */}
      <View style={styles.arrowSlot}>
        <Pressable
          disabled={!hasPrev}
          style={({ pressed }) => [
            { opacity: !hasPrev ? 0 : pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            setCurrentIndex((prev) => prev - 1)
            setExternalIndex ? setExternalIndex(currentIndex - 1) : null
            }
          }
        >
          <Ionicons name="chevron-back" size={30} color={colors.primary_base} />
        </Pressable>
      </View>

      {/* Środkowa karta */}
      <View style={[styles.card, cardStyle]}>
        {isPlusCard ? renderPlus() : renderItem(items[currentIndex])}
      </View>

      {/* Prawa strzałka */}
      <View style={styles.arrowSlot}>
        <Pressable
          disabled={!hasNext}
          style={({ pressed }) => [
            { opacity: !hasNext ? 0 : pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            setCurrentIndex((prev) => prev + 1)
            setExternalIndex ? setExternalIndex(currentIndex + 1) : null
            }
          }
        >
          <Ionicons name="chevron-forward" size={30} color={colors.primary_base} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowSlot: {
    alignItems: 'center',
    padding: 2
  },
  card: {
  },
  cardText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#111',
  },
});