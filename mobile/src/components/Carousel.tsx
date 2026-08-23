import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, PanResponder } from 'react-native';
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
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalLength - 1;
  const isPlusCard = renderPlus && currentIndex === items.length;
  const changeIndex = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= totalLength) {
      return;
    }

    setCurrentIndex(newIndex);
    setExternalIndex?.(newIndex);
  }, [setExternalIndex, totalLength]);
  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < 50) {
          return;
        }

        changeIndex(currentIndex + (gestureState.dx < 0 ? 1 : -1));
      },
    }),
    [changeIndex, currentIndex]
  );

  if (totalLength === 0) {
    return null;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Lewa strzałka */}
      <View style={styles.arrowSlot}>
        <Pressable
          disabled={!hasPrev}
          style={({ pressed }) => [
            { opacity: !hasPrev ? 0 : pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            changeIndex(currentIndex - 1);
          }}
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
            changeIndex(currentIndex + 1);
          }}
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