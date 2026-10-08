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
import { Ionicons } from "@expo/vector-icons"
import { ParseKeys } from "i18next"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemeColors, useTheme } from "@/context/ThemeContext"

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
	search?: string
	customLast?: CustomLastConfig
}

export function DropdownSelect<T>({
	placeholder,
	options,
	value,
	onChange,
	getOptionKey = (option) => String(option),
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

	const handleToggleOpen = () => {
		setIsOpen((prev) => {
			if (prev) {
				setQuery("")
			}
			return !prev
		})
	}

	return (
		<View style={styles.wrapper}>
			<Pressable onPress={handleToggleOpen} style={styles.trigger}>
				<ThemedText variant="main1Button" colorName="primary_base">
					{selectedOption?.label ?? placeholder}
				</ThemedText>
				<Ionicons
					name={isOpen ? "chevron-up" : "chevron-down"}
					size={20}
					color={colors.primary_base}
				/>
			</Pressable>
			{isOpen && (
				<ThemedView colorName="tertiary_base_3" style={styles.menu}>
					<ScrollView
						nestedScrollEnabled
						showsVerticalScrollIndicator
						keyboardShouldPersistTaps="handled"
					>
						{search !== undefined && (
							<View style={styles.searchContainer}>
								<Ionicons
									name="search"
									size={18}
									color={colors.primary_base}
									style={styles.searchIcon}
								/>
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
									<ThemedText variant="body1Regular" colorName="primary_base">
										{option.label}
									</ThemedText>
									{isSelected && (
										<Ionicons name="checkmark" size={18} color={colors.primary_base} />
									)}
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
			height: 50,
			borderWidth: 1,
			borderColor: colors.primary_base_2,
			backgroundColor: colors.tertiary_base_3,
			borderRadius: 16,
			paddingHorizontal: 16,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		menu: {
			marginTop: 4,
			borderWidth: 1,
			borderColor: colors.primary_base,
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
			backgroundColor: colors.primary_base_4,
		},
		customLastItem: {
			minHeight: 48,
			paddingHorizontal: 16,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
		},
	})
