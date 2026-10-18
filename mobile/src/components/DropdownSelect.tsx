import React from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView, ThemedViewProps } from "@/src/components/ThemedView"
import { ThemeColors, useTheme } from "@/context/ThemeContext"

import IconChevronDown from "@/assets/icons/chevron-down.svg"

export interface DropdownOption<T> {
	label: string
	value: T
}

interface DropdownSelectProps<T> {
	label: string
	placeholder: string
	options: DropdownOption<T>[]
	value?: T
	onChange: (value: T) => void
	getOptionKey?: (value: T) => string
	headerStyleProps?: ThemedViewProps
}

export function DropdownSelect<T>({
	placeholder,
	options,
	value,
	onChange,
	getOptionKey = (option) => String(option),
	headerStyleProps,
}: DropdownSelectProps<T>) {
	const { colors } = useTheme()
	const styles = getStyles(colors)
	const [isOpen, setIsOpen] = React.useState(false)
	const selectedOption =
		value === undefined
			? undefined
			: options.find((option) => getOptionKey(option.value) === getOptionKey(value))

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
					<ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
						{options.map((option) => {
							const isSelected = option.value === value
							return (
								<Pressable
									key={getOptionKey(option.value)}
									onPress={() => {
										onChange(option.value)
										setIsOpen(false)
									}}
									style={[styles.option, isSelected && styles.selectedOption]}
								>
									<ThemedText variant="H3" colorName="graphite0">
										{option.label}
									</ThemedText>
								</Pressable>
							)
						})}
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
			maxHeight: 176,
			overflow: "hidden",
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
	})
