import { Text, TextProps, StyleSheet, Pressable } from "react-native"
import { useTranslation } from "react-i18next"
import { ParseKeys, TOptions } from "i18next"
import { useTheme, ThemeColors } from "@/context/ThemeContext"

type Variant =
	"H0" | "H1" | "H2" | "H3" | "H4" | "H5" | "title" | "tab1Category" | "main1Button" | "subTitle1" | "subTitle2" | "body1Regular" | "basic1"

interface ThemedTextProps extends TextProps {
	tx?: ParseKeys
	txOptions?: TOptions
	variant?: Variant
	colorName?: keyof ThemeColors
	onPress?: () => void
	children?: React.ReactNode
}

export const ThemedText = ({
	tx,
	txOptions,
	variant = "title",
	colorName = "primary_base",
	onPress,
	style,
	children,
	...props
}: ThemedTextProps) => {
	const { colors } = useTheme()
	const { t } = useTranslation()

	const content = tx ? t(tx, txOptions) : children


	if (onPress) {
		return (
			<Pressable onPress={onPress} accessibilityRole="button" style={styles.hitbox}>
				<Text style={[{color: colors[colorName], textAlignVertical: "center"}, typography[variant], style]} {...props}>
					{content}
				</Text>
			</Pressable>
		)
	}

	return (
		<Text style={[{color: colors[colorName], textAlignVertical: "center"}, typography[variant], style]} {...props}>
			{content}
		</Text>
	)
}

const styles = StyleSheet.create({
    hitbox: {
        minWidth: 48,
        minHeight: 48,
        justifyContent: "center",
        alignItems: "center",
    },
})

const typography = StyleSheet.create({
	H0: {
		fontFamily: "Montserrat-Bold",
		fontSize: 22,
		lineHeight: 27.5,
	},
	H1: {
		fontFamily: "Montserrat-SemiBold",
		fontSize: 13,
		lineHeight: 16.25,
		letterSpacing: 0.26,
		textTransform: "uppercase",
	},
	H2: {
		fontFamily: "Cabin-Bold",
		fontSize: 14,
		lineHeight: 17.5,
		letterSpacing: 0.42,
	},
	H3: {
		fontFamily: "Cabin-Medium",
		fontSize: 16,
		lineHeight: 20,
		letterSpacing: 0.48,
	},
	H4: {
		fontFamily: "Montserrat-Regular",
		fontSize: 12,
		lineHeight: 15,
	},
	H5: {
		fontFamily: "Montserrat-Bold",
		fontSize: 12,
		lineHeight: 15,
	},
	title: {
		fontFamily: "Afacad-Medium",
		fontSize: 30,
		lineHeight: 34,
		letterSpacing: 1.2,
		textTransform: "uppercase",
		textAlign: "center",
		textAlignVertical: "center",
	},
	tab1Category: {
		fontFamily: "Inter-SemiBold",
		fontSize: 12,
		lineHeight: 16,
		letterSpacing: 0.48,
		textTransform: "uppercase",
		textAlign: "left",
		textAlignVertical: "center",
	},
	main1Button: {
		fontFamily: "Inter-SemiBold",
		fontSize: 18,
		lineHeight: 22,
		letterSpacing: 0.72,
		textTransform: "uppercase",
		textAlign: "center",
		textAlignVertical: "center",
	},
	subTitle1: {
		fontFamily: "Afacad-SemiBold",
		fontSize: 17,
		lineHeight: 20,
		letterSpacing: 0.68,
		textAlign: "left",
		textAlignVertical: "center",
	},
	subTitle2: {
		fontFamily: "Afacad-Regular",
		fontSize: 14,
		lineHeight: 18,
		letterSpacing: 0.56,
		textAlign: "left",
		textAlignVertical: "center",
	},
	body1Regular: {
		fontFamily: "Inter-Regular",
		fontSize: 14,
		lineHeight: 18,
		letterSpacing: 0,
		textAlign: "left",
		textAlignVertical: "center",
	},
	basic1: {
		fontFamily: "Afacad-Regular",
		fontSize: 16,
		lineHeight: 20,
		letterSpacing: 0,
		textAlign: "left",
		textAlignVertical: "center",
	},
})
