import React, { useCallback, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"

import { useTheme } from "@/context/ThemeContext"
import {
	getAllComponentsByProsthesisId,
	type Component,
} from "@/db/repositories/componentRepository"
import { getProsthesisById, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { ComponentsPanel } from "@/src/components/prosthesis/details/ComponentsPanel"
import { EditProsthesisModal } from "@/src/components/prosthesis/details/EditProsthesisModal"
import { ProsthesisSummary } from "@/src/components/prosthesis/details/ProsthesisSummary"

export default function ProsthesisDetailsScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { prosthesisId } = useLocalSearchParams<{ prosthesisId: string }>()

	const [prosthesis, setProsthesis] = useState<Prosthesis | null>(null)
	const [components, setComponents] = useState<Component[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [editVisible, setEditVisible] = useState(false)

	useFocusEffect(
		useCallback(() => {
			let mounted = true

			const load = async () => {
				if (!prosthesisId || typeof prosthesisId !== "string") {
					if (mounted) setIsLoading(false)
					return
				}

				try {
					const [prosthesisResult, componentsResult] = await Promise.all([
						getProsthesisById(prosthesisId),
						getAllComponentsByProsthesisId(prosthesisId),
					])

					if (mounted) {
						setProsthesis(prosthesisResult)
						setComponents(componentsResult)
					}
				} catch (error) {
					console.error("Failed to load prosthesis:", error)
				} finally {
					if (mounted) setIsLoading(false)
				}
			}

			void load()

			return () => {
				mounted = false
			}
		}, [prosthesisId])
	)

	if (isLoading) {
		return (
			<ThemedView colorName="tertiary_base_1" style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary_base} />
			</ThemedView>
		)
	}

	if (!prosthesis) {
		return (
			<ThemedView colorName="tertiary_base_1" style={styles.centered}>
				<ThemedText tx="prosthesisDetails.notFound" variant="subTitle2" colorName="primary_base" />
			</ThemedView>
		)
	}

	return (
		<ThemedView colorName="tertiary_base_1" style={styles.screen}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<ScreenHeader onBack={() => router.back()} />

				<ProsthesisSummary prosthesis={prosthesis} onEdit={() => setEditVisible(true)} />

				<PrimaryActionRow tx="prosthesisDetails.addIncident" iconName="add" />

				<ComponentsPanel
					components={components}
					onOpenComponent={(componentId) =>
						router.push(`/(tabs)/(index)/component/${componentId}` as any)
					}
				/>

				<ProsthesisFilesSection />
			</ScrollView>

			<EditProsthesisModal
				visible={editVisible}
				prosthesis={prosthesis}
				onClose={() => setEditVisible(false)}
				onSaved={setProsthesis}
			/>
		</ThemedView>
	)
}

function ScreenHeader({ onBack }: { onBack: () => void }) {
	const { colors } = useTheme()

	return (
		<View style={styles.topBar}>
			<ThemedView colorName="tertiary_base_1" onPress={onBack} style={styles.backButton}>
				<Ionicons name="chevron-back" size={20} color={colors.primary_base} />
			</ThemedView>
			<ThemedText
				tx="prosthesisDetails.title"
				variant="title"
				colorName="primary_base"
				style={styles.pageTitle}
			/>
		</View>
	)
}

function PrimaryActionRow({
	tx,
	iconName,
	onPress,
}: {
	tx: string
	iconName: React.ComponentProps<typeof Ionicons>["name"]
	onPress?: () => void
}) {
	const { colors } = useTheme()

	return (
		<ThemedView colorName="tertiary_base_1" onPress={onPress} style={styles.primaryActionRow}>
			<ThemedView colorName="primary_base" style={styles.primaryActionIcon}>
				<Ionicons name={iconName} size={30} color={colors.accent_base} />
			</ThemedView>
			<ThemedText
				tx={tx as any}
				variant="main1Button"
				colorName="primary_base"
				style={styles.primaryActionText}
			/>
		</ThemedView>
	)
}

function ProsthesisFilesSection() {
	const { colors } = useTheme()

	return (
		<View style={styles.filesSection}>
			<ThemedText
				tx="prosthesisDetails.photosAndFiles"
				variant="subTitle2"
				colorName="neutral_text"
				style={styles.filesTitle}
			/>
			<ThemedView colorName="neutral_gray" style={styles.filePlaceholder} />
			<ThemedView colorName="tertiary_base_1" style={styles.addFileRow}>
				<ThemedView colorName="neutral_gray" style={styles.smallAddCircle}>
					<Ionicons name="add" size={30} color={colors.neutral_text} />
				</ThemedView>
				<ThemedText
					tx="prosthesisDetails.addFile"
					variant="body1Regular"
					colorName="neutral_text"
					style={styles.addFileText}
				/>
			</ThemedView>
			<ThemedText
				tx="prosthesisDetails.filesHint"
				variant="body1Regular"
				colorName="neutral_text"
				style={styles.filesHint}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 110,
	},
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 19,
		marginTop: 20,
	},
	backButton: {
		width: 26,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 1,
	},
	pageTitle: {
		fontSize: 19,
		lineHeight: 22,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
	primaryActionRow: {
		width: "83%",
		alignSelf: "center",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		marginTop: 18,
		marginBottom: 18,
		paddingHorizontal: 37,
	},
	primaryActionIcon: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	primaryActionText: {
		fontSize: 18,
		letterSpacing: 0.04,
	},
	filesSection: {
		alignItems: "center",
		marginTop: 45,
	},
	filesTitle: {
		fontFamily: "Roboto_500Medium",
		fontSize: 18,
		lineHeight: 20,
		letterSpacing: 0.04,
		textTransform: "uppercase",
	},
	filePlaceholder: {
		width: 188,
		height: 188,
		borderRadius: 7,
		marginTop: 13,
		marginBottom: 11,
	},
	addFileRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	smallAddCircle: {
		width: 31,
		height: 31,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	addFileText: {
		fontFamily: "Roboto_500Medium",
		fontSize: 12,
		lineHeight: 20,
		letterSpacing: 0.04,
	},
	filesHint: {
		fontFamily: "Roboto_500Medium",
		maxWidth: 170,
		marginTop: 8,
		fontSize: 10,
		lineHeight: 14,
		fontWeight: "500",
		textAlign: "center",
	},
})
