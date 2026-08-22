import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ParseKeys, TOptions } from 'i18next';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

type Variant = 
  | 'title' 
  | 'tab1Category' 
  | 'main1Button' 
  | 'subTitle1' 
  | 'subTitle2'
  | 'body1Regular';

interface ThemedTextProps extends TextProps {
  tx?: ParseKeys;
  txOptions?: TOptions;
  variant?: Variant;
  colorName?: keyof ThemeColors;
  children?: React.ReactNode;
}

export const ThemedText = ({
  tx,
  txOptions,
  variant = 'title',
  colorName = 'primary_base',
  style,
  children,
  ...props
}: ThemedTextProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const content = tx ? t(tx, txOptions) : children;

  return (
    <Text
      style={[
        typography[variant],
        { color: colors[colorName] },
        style,
      ]}
      {...props}
    >
      {content}
    </Text>
  );
};

const typography = StyleSheet.create({
  title: {
    fontFamily: 'Afacad-Medium',
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  tab1Category: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  main1Button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  subTitle1: {
    fontFamily: 'Afacad-SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.68,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  subTitle2: {
    fontFamily: 'Afacad-Regular',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.56,
  },
  body1Regular: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
  },
});