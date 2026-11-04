import React, { useEffect, useRef, useState } from "react"
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import IconX from "@/assets/icons/x.svg"

export interface HourPickerModalProps {
	visible: boolean
	onClose: () => void
	onSave: (hour: number, minute: number) => void
	initialHour?: number
	initialMinute?: number
}

interface TimePickerContentProps {
	selectedHour: number
	selectedMinute: number
	onSelectHour: (hour: number) => void
	onSelectMinute: (minute: number) => void
	onCancel: () => void
	onApply: () => void
	visible: boolean
}

interface TimeWheelProps {
	count: number
	selectedValue: number
	onSelect: (value: number) => void
	visible: boolean
}

const WHEEL_ROW_HEIGHT = 48
const WHEEL_VERTICAL_PADDING = WHEEL_ROW_HEIGHT

function formatTwoDigits(value: number): string {
	return String(value).padStart(2, "0")
}

function TimeWheel({ count, selectedValue, onSelect, visible }: TimeWheelProps) {
	const scrollViewRef = useRef<ScrollView>(null)
	const middleCycleOffset = (count + selectedValue) * WHEEL_ROW_HEIGHT

	useEffect(() => {
		if (visible) {
			scrollViewRef.current?.scrollTo({ y: middleCycleOffset, animated: false })
		}
	}, [middleCycleOffset, visible])

	const handleScrollEnd = (offsetY: number) => {
		const index = Math.round(offsetY / WHEEL_ROW_HEIGHT)
		const value = ((index % count) + count) % count
		onSelect(value)
		scrollViewRef.current?.scrollTo({
			y: (count + value) * WHEEL_ROW_HEIGHT,
			animated: false,
		})
	}

	return (
		<ScrollView
			ref={scrollViewRef}
			style={styles.wheel}
			contentContainerStyle={styles.wheelContent}
			showsVerticalScrollIndicator={false}
			snapToInterval={WHEEL_ROW_HEIGHT}
			decelerationRate="fast"
			bounces={false}
			onMomentumScrollEnd={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
			onScrollEndDrag={(event) => {
				if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.01) {
					handleScrollEnd(event.nativeEvent.contentOffset.y)
				}
			}}
		>
			<View style={styles.wheelSpacer} />
			{Array.from({ length: count * 3 }, (_, index) => {
				const value = index % count
				const isSelected = value === selectedValue

				return (
					<Pressable key={index} style={styles.wheelItem} onPress={() => onSelect(value)}>
						<View style={isSelected ? styles.centerItem : styles.sideItem}>
							<ThemedText variant="H0" colorName={isSelected ? "blue2" : "blue1"}>
								{formatTwoDigits(value)}
							</ThemedText>
						</View>
					</Pressable>
				)
			})}
			<View style={styles.wheelSpacer} />
		</ScrollView>
	)
}

function TimePickerContent({
	selectedHour,
	selectedMinute,
	onSelectHour,
	onSelectMinute,
	onCancel,
	onApply,
	visible,
}: TimePickerContentProps) {
	const { colors } = useTheme()

	const formattedTime = `${formatTwoDigits(selectedHour)}:${formatTwoDigits(selectedMinute)}`

	return (
		<ThemedView colorName="bg_1" style={styles.card}>
			<ThemedText variant="H2" colorName="blue2" style={styles.headerTitle}>
				Wybierz godzinę
			</ThemedText>

			<View style={styles.pickerSection}>
				{/* Podświetlona centralna belka wyboru */}
				<ThemedView colorName="tertiary_base_2" style={styles.activeSelectionBackground} />

				<View style={styles.column}>
					<TimeWheel
						count={24}
						selectedValue={selectedHour}
						onSelect={onSelectHour}
						visible={visible}
					/>
				</View>

				{/* Separator dwukropek */}
				<View style={styles.separatorContainer}>
					<ThemedText variant="H0" colorName="blue2">
						:
					</ThemedText>
				</View>

				<View style={styles.column}>
					<TimeWheel
						count={60}
						selectedValue={selectedMinute}
						onSelect={onSelectMinute}
						visible={visible}
					/>
				</View>
			</View>

			<View style={styles.actionsContainer}>
				<ThemedView
					colorName="bg_0"
					style={styles.actionButton}
					borderColor="graphite0"
					onPress={onCancel}
				>
					<View style={styles.cancelButtonContent}>
						<IconX color={colors.graphite0} width={16} height={16} />
						<ThemedText variant="H3" colorName="graphite0">
							Anuluj
						</ThemedText>
					</View>
				</ThemedView>

				<ThemedView colorName="blue2" style={styles.actionButton} onPress={onApply}>
					<View style={styles.applyButtonContent}>
						<ThemedText variant="H2" colorName="bg_0">
							Wprowadź
						</ThemedText>
						<ThemedText variant="H2" colorName="bg_0">
							{formattedTime}
						</ThemedText>
					</View>
				</ThemedView>
			</View>
		</ThemedView>
	)
}

export function HourPickerModal({
	visible,
	onClose,
	onSave,
	initialHour = 15,
	initialMinute = 30,
}: HourPickerModalProps) {
	const insets = useSafeAreaInsets()
	const [selectedHour, setSelectedHour] = useState<number>(initialHour)
	const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute)

	const handleOpen = () => {
		setSelectedHour(initialHour)
		setSelectedMinute(initialMinute)
	}

	const handleApply = () => {
		//TODO
		onSave(selectedHour, selectedMinute)
		onClose()
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			navigationBarTranslucent={Platform.OS === "android"}
			onRequestClose={onClose}
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
				<Pressable style={styles.backdrop} onPress={onClose} />
				<TimePickerContent
					selectedHour={selectedHour}
					selectedMinute={selectedMinute}
					onSelectHour={setSelectedHour}
					onSelectMinute={setSelectedMinute}
					onCancel={onClose}
					onApply={handleApply}
					visible={visible}
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
		gap: 16,
	},
	headerTitle: {
		textAlign: "center",
		marginBottom: 4,
	},
	pickerSection: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		height: 150,
	},
	activeSelectionBackground: {
		position: "absolute",
		width: "100%",
		height: 48,
		borderRadius: 16,
	},
	column: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1,
	},
	wheel: {
		width: "100%",
		height: 144,
	},
	wheelContent: {
		flexGrow: 1,
	},
	wheelSpacer: {
		height: WHEEL_VERTICAL_PADDING,
	},
	wheelItem: {
		height: WHEEL_ROW_HEIGHT,
		alignItems: "center",
		justifyContent: "center",
	},
	separatorContainer: {
		alignItems: "center",
		justifyContent: "center",
		width: 24,
		zIndex: 1,
	},
	sideItem: {
		height: 44,
		justifyContent: "center",
		alignItems: "center",
		opacity: 0.6,
	},
	centerItem: {
		height: 48,
		justifyContent: "center",
		alignItems: "center",
	},
	actionsContainer: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
		marginTop: 8,
	},
	actionButton: {
		flex: 1,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 14,
		paddingHorizontal: 12,
	},
	cancelButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	applyButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
})
