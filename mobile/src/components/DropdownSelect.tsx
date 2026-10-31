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
	variant?: "default" | "incident"
	renderChevron?: (isOpen: boolean) => React.ReactNode
	renderCreateIcon?: () => React.ReactNode
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
	variant = "default",
	renderChevron,
	renderCreateIcon,
}: DropdownSelectProps<T>) {
	const { colors } = useTheme()
	const styles = getStyles(colors)
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState("")

	const isIncident = variant === "incident"

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

	if (isIncident) {
		return (
			<View style={[styles.incidentShell, !isOpen && styles.incidentShellClosed]}>
				<Pressable
					onPress={() => setIsOpen((open) => !open)}
					style={[
						styles.incidentTrigger,
						!isOpen && styles.incidentTriggerClosed,
						headerStyleProps?.style,
					]}
				>
					<ThemedText variant="H3" colorName="graphite0" style={styles.incidentTriggerText}>
						{selectedOption?.label ?? placeholder}
					</ThemedText>

					{renderChevron ? (
						renderChevron(isOpen)
					) : (
						<IconChevronDown color={colors.blue1} width={28} height={28} />
					)}
				</Pressable>

				{isOpen && (
					<View style={styles.incidentMenu}>
						<ScrollView
							nestedScrollEnabled
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						>
							{search !== undefined && (
								<View style={styles.searchContainer}>
									<IconSearch
										color={colors.blue1}
										width={18}
										height={18}
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
								const isSelected =
									getOptionKey(option.value) ===
									(value === undefined ? undefined : getOptionKey(value))

								return (
									<Pressable
										key={getOptionKey(option.value)}
										onPress={() => {
											onChange(option.value)
											setIsOpen(false)
											setQuery("")
										}}
										style={[styles.incidentOption, isSelected && styles.incidentSelectedOption]}
									>
										<ThemedText
											variant="H3"
											colorName="graphite0"
											style={styles.incidentOptionText}
										>
											{option.label}
										</ThemedText>
									</Pressable>
								)
							})}

							{customLast && (
								<Pressable
									onPress={async () => {
										setIsOpen(false)
										setQuery("")
										await customLast.onPress()
									}}
									style={[styles.incidentCustomLastItem, customLast.style]}
								>
									{renderCreateIcon?.()}

									<ThemedText
										tx={customLast.tx}
										variant="H3"
										colorName="graphite0"
										style={styles.incidentCustomLastText}
									/>
								</Pressable>
							)}
						</ScrollView>
					</View>
				)}
			</View>
		)
	}

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

				{renderChevron ? renderChevron(isOpen) : <IconChevronDown color={colors.blue1} />}
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
							const isSelected =
								getOptionKey(option.value) ===
								(value === undefined ? undefined : getOptionKey(value))

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
								{renderCreateIcon?.()}
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

		incidentShell: {
			zIndex: 2,
			borderWidth: 1.25,
			borderColor: colors.blue1,
			borderRadius: 18,
			backgroundColor: colors.bg_0,
			overflow: "hidden",
		},
		incidentShellClosed: {
			borderWidth: 0,
			backgroundColor: "transparent",
			overflow: "visible",
		},
		incidentTrigger: {
			minHeight: 48,
			paddingHorizontal: 20,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			backgroundColor: colors.bg_0,
			borderWidth: 1.25,
			borderColor: colors.blue1,
			borderRadius: 18,
			marginHorizontal: -1.25,
			marginTop: -1.25,
		},
		incidentTriggerClosed: {
			marginHorizontal: 0,
			marginTop: 0,
		},
		incidentTriggerText: {
			flexShrink: 1,
			fontSize: 18,
			lineHeight: 24,
		},
		incidentMenu: {
			backgroundColor: colors.bg_0,
			maxHeight: 260,
			paddingHorizontal: 20,
		},
		incidentOption: {
			minHeight: 43,
			justifyContent: "center",
			borderBottomWidth: 1,
			borderBottomColor: colors.blue0,
		},
		incidentSelectedOption: {
			backgroundColor: colors.bg_0,
		},
		incidentOptionText: {
			fontSize: 18,
			lineHeight: 24,
		},
		incidentCustomLastItem: {
			minHeight: 56,
			flexDirection: "row",
			alignItems: "center",
			gap: 14,
			backgroundColor: colors.bg_0,
		},
		incidentCustomLastText: {
			flexShrink: 1,
			fontSize: 18,
			lineHeight: 24,
		},
	})
}
