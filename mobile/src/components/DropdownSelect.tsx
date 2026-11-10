import { useState, useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, View, StyleProp, ViewStyle } from "react-native"
import { ParseKeys } from "i18next"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedViewProps } from "@/src/components/ThemedView"
import { ThemeColors, useTheme } from "@/context/ThemeContext"

import IconChevronDown from "@/assets/icons/chevron-down.svg"
import IconSearch from "@/assets/icons/search.svg"
import IconPlus from "@/assets/icons/plus.svg"
import { ThemedInput } from "./ThemedInput"

const ROW_HEIGHT = 44
const VISIBLE_ROWS = 4.5

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

	const hasSearch = search !== undefined
	const selectedKey = value === undefined ? undefined : getOptionKey(value)
	const selectedOption = options.find((option) => getOptionKey(option.value) === selectedKey)

	const filteredOptions = useMemo(() => {
		const trimmed = query.trim().toLowerCase()
		if (!hasSearch || !trimmed) return options

		return options.filter((option) => option.label.toLowerCase().includes(trimmed))
	}, [options, hasSearch, query])

	const close = () => {
		setIsOpen(false)
		setQuery("")
	}

	const rowStyle = (index: number) => [styles.row, index > 0 && styles.rowDivider]
	const firstOptionIndex = hasSearch ? 1 : 0

	return (
		<View style={[styles.shell, headerStyleProps?.style]}>
			<Pressable onPress={() => (isOpen ? close() : setIsOpen(true))} style={styles.trigger}>
				<ThemedText variant="H3" colorName="graphite0" numberOfLines={1} style={styles.triggerText}>
					{selectedOption?.label ?? placeholder}
				</ThemedText>
				<IconChevronDown color={colors.blue1} />
			</Pressable>

			{isOpen && (
				<ScrollView
					style={styles.menu}
					nestedScrollEnabled
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					{hasSearch && (
						<View style={[styles.row, { gap: 0 }]}>
							<IconSearch color={colors.blue1} width={18} height={18} style={styles.searchIcon} />
							<ThemedInput
								variant="search"
								placeholder={search}
								value={query}
								onChangeText={setQuery}
								viewStyle={styles.searchInput}
							/>
						</View>
					)}

					{filteredOptions.map((option, index) => {
						const key = getOptionKey(option.value)

						return (
							<Pressable
								key={key}
								onPress={() => {
									onChange(option.value)
									close()
								}}
								style={[
									rowStyle(firstOptionIndex + index),
									key === selectedKey && styles.selectedRow,
								]}
							>
								<ThemedText variant="H3" colorName="graphite0" numberOfLines={1}>
									{option.label}
								</ThemedText>
							</Pressable>
						)
					})}

					{customLast && (
						<Pressable
							onPress={async () => {
								close()
								await customLast.onPress()
							}}
							style={[
								rowStyle(firstOptionIndex + filteredOptions.length),
								{ marginBottom: 5 },
								customLast.style,
							]}
						>
							<IconPlus color={colors.blue1} />
							<ThemedText tx={customLast.tx} variant="H3" colorName="graphite0" numberOfLines={1} />
						</Pressable>
					)}
				</ScrollView>
			)}
		</View>
	)
}

const getStyles = (colors: ThemeColors) => {
	const styles = StyleSheet.create({
		shell: {
			borderWidth: 1,
			borderColor: colors.blue1,
			borderRadius: 18,
			backgroundColor: colors.bg_0,
			overflow: "hidden",
		},
		trigger: {
			minHeight: ROW_HEIGHT,
			paddingHorizontal: 20,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		triggerText: {
			flexShrink: 1,
		},
		menu: {
			maxHeight: ROW_HEIGHT * VISIBLE_ROWS,
			borderTopWidth: 1,
			borderTopColor: colors.blue1,
		},
		row: {
			height: ROW_HEIGHT,
			paddingHorizontal: 20,
			flexDirection: "row",
			alignItems: "center",
			gap: 15,
		},
		rowDivider: {
			borderTopWidth: 1,
			borderTopColor: colors.blue0,
		},
		selectedRow: {
			backgroundColor: colors.blue1,
		},
		searchIcon: {
			marginRight: 8,
		},
		searchInput: {
			backgroundColor: "transparent",
			borderWidth: 0,
		},
	})
	return styles
}
