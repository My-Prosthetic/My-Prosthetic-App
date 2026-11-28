import React, { useState, useEffect, useRef } from "react"
import { TextInput, StyleSheet, StyleProp, ViewStyle } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { ThemedView } from "./ThemedView"

import IconSearch from "@/assets/icons/search.svg"

interface ThemedSearchProps {
	value?: string
	defaultValue?: string
	onChangeText?: (text: string) => void
	onDebouncedSearch?: (text: string) => void
	debounceTimeMs?: number
	placeholder?: string
	disabled?: boolean
	style?: StyleProp<ViewStyle>
}

export default function ThemedSearch({
	value,
	defaultValue = "",
	onChangeText,
	onDebouncedSearch,
	debounceTimeMs = 300,
	placeholder,
	disabled = false,
	style,
}: ThemedSearchProps) {
	const { colors } = useTheme()

	const isControlled = value !== undefined
	const [internalValue, setInternalValue] = useState(defaultValue)
	const currentValue = isControlled ? value : internalValue

	const isFirstRender = useRef(true)
	const debounceRef = useRef(onDebouncedSearch)

	useEffect(() => {
		debounceRef.current = onDebouncedSearch
	})

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		const handler = setTimeout(() => {
			debounceRef.current?.(currentValue)
		}, debounceTimeMs)

		return () => clearTimeout(handler)
	}, [currentValue, debounceTimeMs])

	const handleChangeText = (text: string) => {
		if (!isControlled) {
			setInternalValue(text)
		}
		onChangeText?.(text)
	}

	return (
		<ThemedView
			variant="wide"
			colorName="bg_0"
			borderColor="blue1"
			style={[styles.container, disabled && styles.disabled, style]}
		>
			<IconSearch width={20} height={20} color={colors.blue1} />

			<TextInput
				value={currentValue}
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
