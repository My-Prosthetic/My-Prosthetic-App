import {
	View,
	StyleSheet,
	TouchableOpacity,
	StyleProp,
	ViewStyle,
	useWindowDimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { ParseKeys } from "i18next"
import { useTheme, ThemeColors } from "@/context/ThemeContext"
import { ThemedText } from "./ThemedText"

export type HeaderVariant = "prominent" | "transparent"

interface ThemedHeaderProps {
	tx?: ParseKeys
	variant?: HeaderVariant
	onBack?: () => void
	style?: StyleProp<ViewStyle>
}

export const ThemedHeader = ({ tx, variant = "prominent", onBack, style }: ThemedHeaderProps) => {
	const router = useRouter()
	const { colors } = useTheme()
	const { width } = useWindowDimensions()

	const handleBack = () => {
		if (onBack) {
			onBack()
		} else {
			router.back()
		}
	}

	const isTransparent = variant === "transparent"

	const backgroundColor = isTransparent ? "transparent" : colors.primary_base
	const contentColorName: keyof ThemeColors = isTransparent ? "primary_base" : "accent_base"
	const contentColor = colors[contentColorName]

	return (
		<View
			style={[
				variant === "prominent" ? styles.prominentHeader : styles.transparentHeader,
				{ backgroundColor, width, alignSelf: "center" },
				style,
			]}
		>
			<View style={styles.container}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={handleBack}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Ionicons name="chevron-back" size={28} color={contentColor} />
				</TouchableOpacity>

				<View style={styles.titleContainer} pointerEvents="box-none">
					<ThemedText
						tx={tx}
						variant="title"
						colorName={contentColorName}
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.7}
					/>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	prominentHeader: {
		minHeight: 100,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		flexDirection: "column",
		justifyContent: "flex-end",
		paddingBottom: 20,
	},
	transparentHeader: {},
	container: {
		flexDirection: "row",
		alignItems: "center",
	},
	backButton: {
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 10,
	},
	titleContainer: {
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		left: 0,
		right: 0,
		paddingLeft: 20,
	},
})
