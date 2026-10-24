import React, { useState, useMemo } from "react"
import {
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
	StyleProp,
	ViewStyle,
} from "react-native"
import { ParseKeys } from "i18next"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView, ThemedViewProps } from "@/src/components/ThemedView"
import { ThemeColors, useTheme } from "@/context/ThemeContext"

import IconChevronDown from "@/assets/icons/chevron-down.svg"
import IconSearch from "@/assets/icons/search.svg"

export interface DropdownOption<T> {
	label: string
	value: T
}

export interface CustomLastConfig {
	tx: ParseKeys
	onPress: () => void | Promise<unknown>
	style?: StyleProp<ViewStyle>
}

interface DropdownSelectProps<T> {
	label?: string
	placeholder: string
	options: DropdownOption<T>[]
	value?: T
	onChange: (value: T) => void
	getOptionKey?: (value: T) => string
	headerStyleProps?: ThemedViewProps
	search?: string
	customLast?: CustomLastConfig
}

export function DropdownSelect<T>({
	placeholder,
	options,
	value,
	onChange,
	getOptionKey = (option) => String(option),
	headerStyleProps,
	search,
	customLast,
}: DropdownSelectProps<T>) {
	const { colors } = useTheme()
	const styles = getStyles(colors)
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState("")

	const selectedOption =
		value === undefined
			? undefined
			: options.find((option) => getOptionKey(option.value) === getOptionKey(value))

	const filteredOptions = useMemo(() => {
		if (!search || !query.trim()) return options
		return options.filter((option) =>
			option.label.toLowerCase().includes(query.trim().toLowerCase())
		)
	}, [options, search, query])

	return (
		<View style={styles.wrapper}>
			<ThemedView
				variant="wide"
				colorName="bg_0"
				borderColor="blue1"
				onPress={() => setIsOpen((open) => !open)}
				style={[styles.trigger, headerStyleProps]}
			>
				<ThemedText variant="H3" colorName="graphite0">
					{selectedOption?.label ?? placeholder}
				</ThemedText>
				<IconChevronDown color={colors.blue1} />
			</ThemedView>
			{isOpen && (
				<ThemedView colorName="bg_0" style={styles.menu} borderColor="blue1">
					<ScrollView
						nestedScrollEnabled
						showsVerticalScrollIndicator
						keyboardShouldPersistTaps="handled"
					>
						{search !== undefined && (
							<View style={styles.searchContainer}>
								<IconSearch color={colors.blue1} width={18} height={18} style={styles.searchIcon} />
								<TextInput
									style={styles.searchInput}
									placeholder={search}
									placeholderTextColor={colors.primary_base_2}
									value={query}
									onChangeText={setQuery}
									autoCorrect={false}
								/>
							</View>
						)}
						{filteredOptions.map((option) => {
							const isSelected = option.value === value
							return (
								<Pressable
									key={getOptionKey(option.value)}
									onPress={() => {
										onChange(option.value)
										setIsOpen(false)
										setQuery("")
									}}
									style={[styles.option, isSelected && styles.selectedOption]}
								>
									<ThemedText variant="H3" colorName="graphite0">
										{option.label}
									</ThemedText>
								</Pressable>
							)
						})}
						{customLast && (
							<ThemedView
								colorName="primary_base"
								onPress={async () => {
									setIsOpen(false)
									setQuery("")
									await customLast.onPress()
								}}
								style={[styles.customLastItem, customLast.style]}
							>
								<ThemedText tx={customLast.tx} variant="body1Regular" colorName="tertiary_base_3" />
							</ThemedView>
						)}
					</ScrollView>
				</ThemedView>
			)}
		</View>
	)
}

const getStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		wrapper: {
			gap: 8,
			zIndex: 2,
		},
		trigger: {
			minHeight: 44,
			borderRadius: 15,
			paddingHorizontal: 16,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		menu: {
			marginTop: 4,
			borderRadius: 16,
			maxHeight: 220,
			overflow: "hidden",
		},
		searchContainer: {
			flexDirection: "row",
			alignItems: "center",
			borderBottomWidth: 1,
			borderBottomColor: colors.primary_base_2,
			paddingHorizontal: 16,
			paddingVertical: 8,
		},
		searchIcon: {
			marginRight: 8,
		},
		searchInput: {
			flex: 1,
			height: 36,
			color: colors.primary_base,
			fontFamily: "Inter-Regular",
			fontSize: 14,
			padding: 0,
		},
		option: {
			minHeight: 48,
			paddingHorizontal: 16,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		selectedOption: {
			backgroundColor: colors.blue1,
		},
		customLastItem: {
			minHeight: 48,
			paddingHorizontal: 16,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
		},
	})
