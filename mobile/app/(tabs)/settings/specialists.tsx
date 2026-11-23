import { useState } from "react"
import { ScrollView, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useTheme } from "@/context/ThemeContext"
import { router } from "expo-router"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconChatMessage from "@/assets/icons/chat-message.svg"

export default function SpecialistsScreen() {
	const { colors } = useTheme()

	return (
		<ThemedView variant="background" colorName="bg_1" style={styles.screen}>
			<ThemedHeader tx="specialists.headerTitle" />
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Info About How Many Specialists have my data */}
				<ThemedView style={styles.rowTop}>
					<ThemedView style={[styles.numberCircle, { borderColor: colors.blue2 }]}>
						<ThemedText style={styles.numberText} colorName="blue2" variant="H0">
							1
						</ThemedText>
					</ThemedView>

					<ThemedText
						tx="specialists.summary"
						style={styles.topRowText}
						colorName="blue2"
						variant="H4"
					/>
				</ThemedView>
			</ScrollView>

			{/* Buttons */}
			<ThemedView style={styles.rowBot}>
				<ThemedView
					variant="wide"
					colorName="blue0"
					style={styles.actionButton}
					// onPress={() => router.push()}
					leftChild={<IconChatMessage width={22} height={22} color={colors.graphite0} />}
					centerChild={
						<ThemedText
							tx={"specialists.recommendationsButtonLabel"}
							variant="H1"
							colorName="graphite0"
							style={styles.actionLabel}
						/>
					}
					rightChild={<IconChevronRight width={12} height={20} color={colors.graphite0} />}
				/>

				<ThemedView
					variant="wide"
					colorName="blue2"
					style={styles.actionButton}
					onPress={() => router.push("/settings/specialistsSearch")}
					centerChild={
						<ThemedText
							tx={"specialists.addButtonLabel"}
							// H2 ?
							variant="H1"
							colorName="bg_0"
							style={styles.actionLabel}
						/>
					}
					rightChild={<IconPlus width={18} height={18} color={colors.bg_0} />}
				/>
			</ThemedView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
		width: "100%",
	},
	rowTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		gap: 16,
		marginTop: 20,
	},

	numberCircle: {
		width: 54,
		height: 54,
		borderRadius: 27,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	numberText: {
		textAlign: "center",
	},
	topRowText: {
		flex: 1,
	},
	rowBot: {
		width: "100%",
		alignItems: "center",
		gap: 12,
		paddingVertical: 16,
		marginBottom: 30,
	},
	actionButton: {
		width: "100%",
		minHeight: 50,
		borderRadius: 20,
	},
	actionLabel: {
		textTransform: "uppercase",
		textAlign: "center",
	},
})
