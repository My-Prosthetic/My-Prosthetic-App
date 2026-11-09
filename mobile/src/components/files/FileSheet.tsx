import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { ParseKeys } from "i18next"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "../ThemedText"
import { ThemedView } from "../ThemedView"

export function FileSheet({
	title,
	onClose,
	children,
	busy = false,
	visible = true,
	onDismiss,
}: {
	title: ParseKeys
	onClose: () => void
	children: ReactNode
	busy?: boolean
	visible?: boolean
	onDismiss?: () => void
}) {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const insets = useSafeAreaInsets()
	return (
		<Modal
			visible={visible}
			onDismiss={onDismiss}
			transparent
			animationType="slide"
			statusBarTranslucent
			navigationBarTranslucent
			onRequestClose={() => {
				if (!busy) onClose()
			}}
		>
			<View style={styles.root}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t("common.cancel")}
					disabled={busy}
					onPress={onClose}
					style={[StyleSheet.absoluteFill, { backgroundColor: colors.graphite0, opacity: 0.6 }]}
				/>
				<KeyboardAvoidingView
					pointerEvents="box-none"
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.keyboard}
				>
					<ThemedView
						accessibilityViewIsModal
						colorName="bg_1"
						style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: "92%" }]}
					>
						<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
							<ThemedText
								tx={title}
								variant="H1"
								colorName="blue2"
								style={styles.title}
								accessibilityRole="header"
							/>
							{children}
						</ScrollView>
					</ThemedView>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	)
}

export function FileSheetButton({
	tx,
	onPress,
	secondary = false,
	disabled = false,
}: {
	tx: ParseKeys
	onPress: () => void | Promise<void>
	secondary?: boolean
	disabled?: boolean
}) {
	const { highContrast } = useTheme()
	return (
		<ThemedView
			colorName={secondary ? (highContrast ? "bg_2" : "blue0") : "blue2"}
			onPress={onPress}
			disabled={disabled}
			style={[styles.button, disabled && styles.disabled]}
			accessibilityState={{ disabled }}
		>
			<ThemedText
				tx={tx}
				variant="H1"
				colorName={secondary ? "graphite0" : "bg_0"}
				style={styles.buttonText}
			/>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	root: { flex: 1, justifyContent: "flex-end" },
	keyboard: { justifyContent: "flex-end", flex: 1 },
	card: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		paddingTop: 28,
	},
	content: { paddingHorizontal: "8%", gap: 20, paddingBottom: 12 },
	title: { textAlign: "center", marginBottom: 14, fontSize: 14, lineHeight: 20 },
	button: {
		width: "73%",
		alignSelf: "center",
		minHeight: 50,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 2,
	},
	buttonText: { textAlign: "center" },
	disabled: { opacity: 0.5 },
})
