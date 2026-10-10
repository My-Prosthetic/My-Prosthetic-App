import { View, StyleSheet, StyleProp, ViewStyle, Platform } from "react-native"
import { useRouter } from "expo-router"
import { ParseKeys } from "i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { ThemedText } from "./ThemedText"

import IconChevronLeft from "@/assets/icons/chevron-left.svg"
import { ThemedView } from "./ThemedView"

interface ThemedHeaderProps {
	tx?: ParseKeys
	onBack?: () => void
	style?: StyleProp<ViewStyle>
}

export const ThemedHeader = ({ tx, onBack, style }: ThemedHeaderProps) => {
	const router = useRouter()
	const { colors } = useTheme()
	const { status } = useAuth()
	const insets = useSafeAreaInsets()

	const handleBack = () => {
		if (onBack) {
			onBack()
		} else {
			router.back()
		}
	}

	const shadowStyle = Platform.select({
		ios: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 3 },
			shadowOpacity: 0.15,
			shadowRadius: 10,
		},
		android: {
			elevation: 2,
		},
		default: {
			elevation: 2,
		},
	}) as ViewStyle

	return (
		<View
			style={[
				styles.header,
				{ paddingTop: status !== "GUEST" ? insets.top + 15 : 20, backgroundColor: colors.bg_0 },
				shadowStyle,
				style,
			]}
		>
			<View style={styles.container}>
				<ThemedView
					style={styles.backButton}
					onPress={handleBack}
					hitSlop={{ top: 15, bottom: 15, left: 13, right: 13 }}
				>
					<IconChevronLeft color={colors.blue2} height={18} />
				</ThemedView>

				<View style={styles.titleContainer} pointerEvents="box-none">
					<ThemedText
						tx={tx}
						variant="H0"
						colorName="blue2"
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
	header: {
		alignSelf: "center",
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
		paddingBottom: 20,
		width: "100%",
	},
	container: {
		flexDirection: "row",
		alignItems: "center",
	},
	backButton: {
		justifyContent: "center",
		alignItems: "center",
		paddingLeft: 15,
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
