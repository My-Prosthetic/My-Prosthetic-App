import { useTranslation } from "react-i18next"
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	TextInput,
	View,
} from "react-native"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

interface CustomOptionDialogModalProps {
	visible: boolean
	type: "brand" | "model" | null
	value: string
	onChangeText: (text: string) => void
	onSave: () => void
	onClose: () => void
	isSaving: boolean
}

export function CustomOptionDialogModal({
	visible,
	type,
	value,
	onChangeText,
	onSave,
	onClose,
	isSaving,
}: CustomOptionDialogModalProps) {
	const { colors } = useTheme()
	const { t } = useTranslation()

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.customModalOverlay}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t("common.cancel")}
					onPress={onClose}
					style={StyleSheet.absoluteFill}
				/>
				<View style={[styles.customModalCard, { backgroundColor: colors.tertiary_base_1 }]}>
					<ThemedText variant="subTitle1" colorName="primary_base">
						{type === "brand"
							? t("newComponent.customBrand.title")
							: t("newComponent.customModel.title")}
					</ThemedText>
					<TextInput
						autoFocus
						autoCapitalize="words"
						returnKeyType="done"
						onSubmitEditing={onSave}
						editable={!isSaving}
						value={value}
						onChangeText={onChangeText}
						placeholder={
							type === "brand"
								? t("newComponent.placeholders.brandName")
								: t("newComponent.placeholders.modelName")
						}
						placeholderTextColor={colors.primary_base_3}
						style={[
							styles.customModalInput,
							{
								backgroundColor: colors.tertiary_base_3,
								borderColor: colors.primary_base_2,
								color: colors.primary_base,
							},
						]}
					/>
					<View style={styles.customModalActions}>
						<ThemedView
							variant="narrow"
							colorName="tertiary_base_3"
							onPress={onClose}
							disabled={isSaving}
							style={styles.customModalAction}
						>
							<ThemedText variant="body1Regular" colorName="primary_base">
								{t("common.cancel")}
							</ThemedText>
						</ThemedView>
						<ThemedView
							variant="narrow"
							colorName="primary_base"
							onPress={onSave}
							disabled={!value.trim() || isSaving}
							style={[styles.customModalAction, { backgroundColor: colors.primary_base }]}
						>
							<ThemedText variant="body1Regular" colorName="tertiary_base_3">
								{isSaving ? t("newComponent.saving") : t("common.save")}
							</ThemedText>
						</ThemedView>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}

const styles = StyleSheet.create({
	customModalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	customModalCard: {
		width: "100%",
		maxWidth: 420,
		borderRadius: 20,
		padding: 20,
		gap: 16,
		elevation: 8,
	},
	customModalInput: {
		minHeight: 50,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		fontFamily: "Afacad-Regular",
		fontSize: 17,
	},
	customModalActions: {
		flexDirection: "row",
		gap: 12,
	},
	customModalAction: {
		flex: 1,
		minHeight: 46,
	},
})
