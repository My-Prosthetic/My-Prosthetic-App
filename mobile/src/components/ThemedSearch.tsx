import React, { useState, useEffect, useRef } from "react"
import { TextInput, StyleSheet } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { ThemedView } from "./ThemedView"

import IconSearch from "@/assets/icons/search.svg"

interface ThemedSearchProps {
	value?: string
	onChangeText?: (text: string) => void
	onDebouncedSearch?: (text: string) => void
	debounceTimeMs?: number
	placeholder?: string
	disabled?: boolean
}

export default function ThemedSearch({
	value: externalValue,
	onChangeText,
	onDebouncedSearch,
	debounceTimeMs = 300,
	placeholder = "Szukaj...",
	disabled = false,
}: ThemedSearchProps) {
	const { colors } = useTheme()
	const [internalValue, setInternalValue] = useState(externalValue || "")
	const [prevExternalValue, setPrevExternalValue] = useState(externalValue)

	const isFirstRender = useRef(true)

	if (externalValue !== undefined && externalValue !== prevExternalValue) {
		setPrevExternalValue(externalValue)
		setInternalValue(externalValue)
	}

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		const handler = setTimeout(() => {
			onDebouncedSearch?.(internalValue)
		}, debounceTimeMs)

		return () => clearTimeout(handler)
	}, [internalValue, debounceTimeMs, onDebouncedSearch])

	const handleChangeText = (text: string) => {
		if (externalValue === undefined) {
			setInternalValue(text)
		}
		onChangeText?.(text)
	}

	const actualValue = externalValue !== undefined ? externalValue : internalValue

	return (
		<ThemedView
			variant="wide"
			colorName="bg_0"
			borderColor="blue1"
			style={[styles.container, disabled && styles.disabled]}
		>
			<IconSearch width={20} height={20} color={colors.blue1} />

			<TextInput
				value={actualValue}
				onChangeText={handleChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.blue1}
				editable={!disabled}
				style={[styles.input, { color: colors.graphite0 }]}
			/>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
	},
	disabled: {
		opacity: 0.5,
	},
	input: {
		fontSize: 16,
		lineHeight: 20,
		fontFamily: "Cabin-Medium",
		flex: 1,
		paddingLeft: 16,
		paddingVertical: 10,
	},
})
