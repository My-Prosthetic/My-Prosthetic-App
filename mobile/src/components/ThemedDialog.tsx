import React, { useState } from "react"
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ParseKeys } from "i18next"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedInput, ThemedInputVariant } from "@/src/components/ThemedInput"

import IconX from "@/assets/icons/x.svg"
import IconCheck from "@/assets/icons/check.svg"

export interface ThemedDialogProps {
	visible: boolean
	titleTx?: ParseKeys
	title?: string
	errorMessageTx?: ParseKeys
	errorMessage?: string
	variant?: ThemedInputVariant
	currency?: string
	initialValue?: string
	validate?: (value: string) => boolean
	onSave: (value: string) => void
	onCancel: () => void
}

interface DialogCardProps {
	titleTx?: ParseKeys
	title?: string
	errorMessageTx?: ParseKeys
	errorMessage?: string
	variant: ThemedInputVariant
	currency?: string
	inputValue: string
	hasError: boolean
	onChangeText: (text: string) => void
	onCancel: () => void
	onConfirm: () => void
}

function DialogCard({
	titleTx,
	title,
	errorMessageTx,
	errorMessage,
	variant,
	currency = "PLN",
	inputValue,
	hasError,
	onChangeText,
	onCancel,
	onConfirm,
}: DialogCardProps) {
	const { colors } = useTheme()

	return (
		<ThemedView colorName="bg_1" borderColor="blue1" style={styles.card}>
			{/* Tytuł modala */}
			<ThemedText tx={titleTx} variant="H0" colorName="blue2" style={styles.title}>
				{title}
			</ThemedText>

			{/* Kontener pola input wraz z walidacją */}
			<View style={styles.inputContainer}>
				<ThemedInput
					variant={variant}
					currency={currency}
					value={inputValue}
					onChangeText={onChangeText}
					viewStyle={styles.inputOverride}
				/>
				{hasError && (errorMessage || errorMessageTx) && (
					<ThemedText tx={errorMessageTx} variant="H4" colorName="false" style={styles.errorText}>
						{errorMessage}
					</ThemedText>
				)}
			</View>

			{/* Przyciski akcji */}
			<View style={styles.actionsContainer}>
				<ThemedView
					colorName="bg_0"
					borderColor="blue2"
					style={styles.actionButton}
					onPress={onCancel}
				>
					<View style={styles.buttonContent}>
						<IconX color={colors.blue2} width={16} height={16} />
						<ThemedText variant="H2" colorName="blue2">
							Anuluj
						</ThemedText>
					</View>
				</ThemedView>

				<ThemedView colorName="blue2" style={styles.actionButton} onPress={onConfirm}>
					<View style={styles.buttonContent}>
						<IconCheck color={colors.bg_0} width={16} height={16} />
						<ThemedText variant="H2" colorName="bg_0">
							Potwierdź
						</ThemedText>
					</View>
				</ThemedView>
			</View>
		</ThemedView>
	)
}

export function ThemedDialog({
	visible,
	titleTx,
	title = "Zdefiniuj cel budżetowy:",
	errorMessageTx,
	errorMessage,
	variant = "money",
	currency,
	initialValue = "",
	validate,
	onSave,
	onCancel,
}: ThemedDialogProps) {
	const insets = useSafeAreaInsets()
	const [inputValue, setInputValue] = useState<string>(initialValue)
	const [hasError, setHasError] = useState<boolean>(false)

	const handleOpen = () => {
		setInputValue(initialValue)
		setHasError(false)
	}

	const handleTextChange = (text: string) => {
		setInputValue(text)
		if (hasError) {
			setHasError(false)
		}
	}

	const handleConfirm = () => {
		//TODO
		if (validate && !validate(inputValue)) {
			setHasError(true)
			return
		}

		onSave(inputValue)
	}

	const handleCancel = () => {
		//TODO
		onCancel()
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			navigationBarTranslucent={Platform.OS === "android"}
			onRequestClose={handleCancel}
			onShow={handleOpen}
		>
			<View
				style={[
					styles.overlay,
					{
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
					},
				]}
			>
				<Pressable style={styles.backdrop} onPress={handleCancel} />
				<DialogCard
					titleTx={titleTx}
					title={title}
					errorMessageTx={errorMessageTx}
					errorMessage={errorMessage}
					variant={variant}
					currency={currency}
					inputValue={inputValue}
					hasError={hasError}
					onChangeText={handleTextChange}
					onCancel={handleCancel}
					onConfirm={handleConfirm}
				/>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		backgroundColor: "rgba(0, 0, 0, 0.4)",
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	card: {
		width: "100%",
		maxWidth: 340,
		paddingHorizontal: 20,
		paddingVertical: 24,
		borderRadius: 24,
		alignItems: "center",
		gap: 20,
	},
	title: {
		textAlign: "center",
		fontSize: 18,
		lineHeight: 22,
	},
	inputContainer: {
		width: "100%",
		gap: 6,
	},
	inputOverride: {
		backgroundColor: "transparent",
	},
	errorText: {
		paddingLeft: 4,
	},
	actionsContainer: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	actionButton: {
		flex: 1,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 22,
		paddingHorizontal: 12,
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
})
