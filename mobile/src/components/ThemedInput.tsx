import { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from "react-native"
import { ThemedView } from "./ThemedView"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

export type ThemedInputVariant = "email" | "password" | "regular" | "note" | "search"

export interface ThemedInputProps extends TextInputProps {
	variant: ThemedInputVariant
	textStyle?: StyleProp<TextStyle>
	viewStyle?: StyleProp<ViewStyle>
}

export const ThemedInput = ({ variant, textStyle, viewStyle, ...props }: ThemedInputProps) => {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const variantConfigs: Record<ThemedInputVariant, TextInputProps> = {
		email: {
			placeholder: t("signup.emailPlaceholder"),
			keyboardType: "email-address",
			autoCapitalize: "none",
		},
		password: {
			placeholder: "••••••••",
			secureTextEntry: true,
			autoCapitalize: "none",
			autoCorrect: false,
		},
		regular: {
			autoCapitalize: "words",
			autoCorrect: true,
		},
		note: {},
		search: {},
	}

	const variantProps = variantConfigs[variant]

	const commonTextStyle: TextStyle = {
		fontSize: 16,
		lineHeight: 20,
		fontFamily: "Cabin-Medium",
		width: "100%",
		paddingLeft: 16,
	}

	return (
		<ThemedView
			variant="wide"
			colorName="bg_0"
			borderColor="blue1"
			style={[{ minHeight: 48, borderRadius: 15 }, viewStyle]}
		>
			<TextInput
				{...variantProps}
				{...props}
				placeholderTextColor={colors.graphite0}
				style={[commonTextStyle, textStyle]}
			/>
		</ThemedView>
	)
}
