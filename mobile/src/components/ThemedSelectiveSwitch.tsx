import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import { ParseKeys } from "i18next"
import { ThemedText } from "./ThemedText"
import { ThemedView } from "./ThemedView"

export interface ThemedSwitchProps {
	leftLabelWidth?: number
	rightLabelWidth?: number
	leftTx: ParseKeys
	rightTx: ParseKeys
	selectLeft: () => void
	selectRight: () => void
	initialState?: "left" | "right"
	accessibilityLabel?: string
}

export default function ThemedSelectiveSwitch({
	leftLabelWidth = 42,
	rightLabelWidth = 42,
	leftTx,
	rightTx,
	selectLeft,
	selectRight,
	initialState = "left",
	accessibilityLabel,
}: ThemedSwitchProps) {
	const { t } = useTranslation()
	const [selected, setSelected] = useState<"left" | "right">(initialState)

	const isLeft = selected === "left"
	const leftLabelText = t(leftTx)
	const rightLabelText = t(rightTx)
	const currentLabel = isLeft ? leftLabelText : rightLabelText

	const handleOnToggle = () => {
		if (isLeft) {
			setSelected("right")
			selectRight()
		} else {
			setSelected("left")
			selectLeft()
		}
	}

	return (
		<ThemedView
			onPress={handleOnToggle}
			accessible
			accessibilityRole="switch"
			aria-checked={!isLeft}
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ text: currentLabel }}
			style={styles.container}
		>
			<ThemedText
				tx={leftTx}
				variant={isLeft ? "H5" : "H4"}
				colorName="blue2"
				style={[styles.leftLabel, { width: leftLabelWidth }]}
			/>

			<ThemedView
				borderColor="blue2"
				style={[styles.track, { justifyContent: isLeft ? "flex-start" : "flex-end" }]}
			>
				<ThemedView colorName="blue2" style={styles.thumb} />
			</ThemedView>

			<ThemedText
				tx={rightTx}
				variant={!isLeft ? "H5" : "H4"}
				colorName="blue2"
				accessible={false}
				importantForAccessibility="no"
				style={[styles.rightLabel, { width: rightLabelWidth }]}
			/>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	leftLabel: {
		textAlign: "right",
	},
	rightLabel: {
		textAlign: "left",
	},
	track: {
		flexDirection: "row",
		width: 46,
		height: 17,
		borderRadius: 16,
		paddingHorizontal: 2,
		alignItems: "center",
	},
	thumb: {
		width: 13,
		height: 13,
		borderRadius: 13,
	},
})
