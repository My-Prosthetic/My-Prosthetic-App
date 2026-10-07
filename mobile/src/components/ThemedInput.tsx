import { TextInput, TextInputProps } from "react-native"
import { ThemedView } from "./ThemedView"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"

export type ThemedInputVariant = "email" | "password" | "regular" | "note" | "search"

export interface ThemedInputProps extends TextInputProps {
	variant: ThemedInputVariant
}

export const ThemedInput = ({ variant, ...props }: ThemedInputProps) => {
	const { t } = useTranslation()
	const { colors } = useTheme()

	switch (variant) {
		case "email":
			return (
				<ThemedView
					variant="wide"
					colorName="bg_0"
					borderColor="blue1"
					style={{
						minHeight: 48,
						borderRadius: 15,
					}}
				>
					<TextInput
						placeholder={t("signup.emailPlaceholder")}
						placeholderTextColor={colors.graphite0}
						keyboardType="email-address"
						autoCapitalize="none"
						style={{
							fontSize: 16,
							lineHeight: 20,
							fontFamily: "Cabin-Medium",
							width: "100%",
							paddingLeft: 16,
						}}
						{...props}
					/>
				</ThemedView>
			)
		case "password":
			return (
				<ThemedView
					variant="wide"
					colorName="bg_0"
					borderColor="blue1"
					style={{
						minHeight: 48,
						borderRadius: 15,
					}}
				>
					<TextInput
						placeholder="••••••••"
						placeholderTextColor={colors.graphite0}
						secureTextEntry
						autoCapitalize="none"
						autoCorrect={false}
						style={{
							width: "100%",
							paddingLeft: 16,
						}}
						{...props}
					/>
				</ThemedView>
			)

		case "regular":
			return (
				<ThemedView
					variant="wide"
					colorName="bg_0"
					borderColor="blue1"
					style={{
						minHeight: 48,
						borderRadius: 15,
					}}
				>
					<TextInput
						placeholderTextColor={colors.graphite0}
						autoCapitalize="words"
						autoCorrect
						style={{
							fontSize: 16,
							lineHeight: 20,
							fontFamily: "Cabin-Medium",
							width: "100%",
							paddingLeft: 16,
						}}
						{...props}
					/>
				</ThemedView>
			)
		//TODO rest of the variants
		// case "note":
		//     return {
		//         // placeholder: t("signup.notePlaceholder"),
		//         multiline: true,
		//     }
		// case "search":
		//     return {
		//         // placeholder: t("common.searchPlaceholder"),
		//         keyboardType: "default" as const,
		//         returnKeyType: "search" as const,
		//     }
		// default:
		//     return {}
	}
}
