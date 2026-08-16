import React from 'react';
import {
  View,
  ViewProps,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

export type ThemedViewSize = 'none' | 'wide' | 'narrow' | 'background' | 'tag';

export interface ThemedViewProps extends Omit<PressableProps, 'style'> {
  colorName?: keyof ThemeColors;
  size?: ThemedViewSize;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const ThemedView = ({
  colorName = 'primary_base',
  size = 'none',
  onPress,
  style,
  children,
  ...props
}: ThemedViewProps) => {
  const { colors } = useTheme();

  const getElementStyle = (pressed = false ): StyleProp<ViewStyle> => [
    styles.base,
    sizes[size],
    { backgroundColor: colors[colorName] },
    pressed && styles.pressed,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => getElementStyle(pressed)}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={getElementStyle()} {...props as ViewProps}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'column',
  },
  pressed: {
    opacity: 0.75,
  },
});

const sizes = StyleSheet.create({
  none: {},
tag: {
  alignSelf: 'flex-start',
  paddingVertical: 6,
  paddingHorizontal: 16,
  minHeight: 34,
  borderRadius: 9999,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
  narrow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    width: '70%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  wide: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    flex: 1,
    padding: 16,
    paddingHorizontal: 32,
  },
});