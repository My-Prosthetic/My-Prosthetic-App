import { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from "react-native"
import { ThemedView } from "./ThemedView"
import { ThemedText } from "./ThemedText"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

export type ThemedInputVariant = "email" | "password" | "regular" | "note" | "search" | "money"

export interface ThemedInputProps extends TextInputProps {
	variant: ThemedInputVariant
	currency?: string
	textStyle?: StyleProp<TextStyle>
	viewStyle?: StyleProp<ViewStyle>
}

export const ThemedInput = ({
	variant,
	currency,
	textStyle,
	viewStyle,
	...props
}: ThemedInputProps) => {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const variantConfigs: Record<ThemedInputVariant, TextInputProps> = {
		email: {
			placeholder: t("signup.emailPlaceholder"),
			keyboardType: "email-address",
			autoCapitalize: "none",
		},
		password: {
			placeholder: t("signup.passwordPlaceholder"),
			secureTextEntry: true,
			autoCapitalize: "none",
			autoCorrect: false,
		},
		regular: {
			autoCapitalize: "words",
			autoCorrect: true,
		},
		note: {
			textAlignVertical: "top",
		},
		search: {},
		money: {
			keyboardType: "numeric",
		},
	}

	const variantStyles: Record<ThemedInputVariant, ViewStyle> = {
		email: {},
		password: {},
		regular: {},
		note: {
			minHeight: 90,
		},
		search: {},
		money: {
			flexDirection: "row",
		},
	}

	const variantProps = variantConfigs[variant]
	const variantStyleProps = variantStyles[variant]

	const commonTextStyle: TextStyle = {
		fontSize: 16,
		lineHeight: 20,
		fontFamily: "Cabin-Medium",
		flex: 1,
		paddingLeft: 16,
		color: colors.graphite0,
	}

	return (
		<ThemedView
			variant="wide"
			colorName="bg_1"
			borderColor="blue1"
			style={[{ minHeight: 44, borderRadius: 15 }, variantStyleProps, viewStyle]}
		>
			<TextInput
				{...variantProps}
				{...props}
				placeholderTextColor={colors.graphite0}
				style={[commonTextStyle, textStyle]}
			/>
			{variant === "money" && (
				<ThemedText variant="H3" colorName="blue1" style={{ paddingRight: 16 }}>
					{currency}
				</ThemedText>
			)}
		</ThemedView>
	)
}
