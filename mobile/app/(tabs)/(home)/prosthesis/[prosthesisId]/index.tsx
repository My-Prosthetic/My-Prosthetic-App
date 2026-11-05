import { useCallback, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"

import { useTheme } from "@/context/ThemeContext"
import {
	getComponentsByProsthesisId,
	type ComponentWithRelations,
} from "@/db/repositories/componentRepository"
import { getProsthesisById, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { EditProsthesisModal } from "@/src/components/prosthesis/details/EditProsthesisModal"
import { ProsthesisComponentsList } from "@/src/components/prosthesis/details/ProsthesisComponentsList"
import { ProsthesisOverview } from "@/src/components/prosthesis/details/ProsthesisOverview"

export default function ProsthesisDetailsScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { prosthesisId } = useLocalSearchParams<{ prosthesisId: string }>()
	const [prosthesis, setProsthesis] = useState<Prosthesis | null>(null)
	const [components, setComponents] = useState<ComponentWithRelations[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState(false)
	const [loadAttempt, setLoadAttempt] = useState(0)
	const [editVisible, setEditVisible] = useState(false)

	useFocusEffect(
		useCallback(() => {
			let mounted = true

			const load = async () => {
				setIsLoading(true)
				setLoadError(false)
				if (!prosthesisId || typeof prosthesisId !== "string") {
					setIsLoading(false)
					return
				}

				try {
					const [prosthesisResult, componentsResult] = await Promise.all([
						getProsthesisById(prosthesisId),
						getComponentsByProsthesisId(prosthesisId),
					])
					if (mounted) {
						setProsthesis(prosthesisResult)
						setComponents(componentsResult)
					}
				} catch (error) {
					console.error(`Failed to load prosthesis details (attempt ${loadAttempt}):`, error)
					if (mounted) setLoadError(true)
				} finally {
					if (mounted) setIsLoading(false)
				}
			}

			void load()
			return () => {
				mounted = false
			}
		}, [prosthesisId, loadAttempt])
	)

	if (isLoading) {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ActivityIndicator size="large" color={colors.blue2} />
			</ThemedView>
		)
	}

	if (loadError) {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ThemedText tx="prosthesisDetails.loadError" variant="H2" colorName="blue2" />
				<ThemedView
					colorName="blue2"
					onPress={() => setLoadAttempt((attempt) => attempt + 1)}
					style={styles.retryButton}
				>
					<ThemedText tx="prosthesisDetails.retry" variant="H2" colorName="bg_0" />
				</ThemedView>
			</ThemedView>
		)
	}

	if (!prosthesis) {
		return (
			<ThemedView colorName="bg_1" style={styles.centered}>
				<ThemedText tx="prosthesisDetails.notFound" variant="H2" colorName="blue2" />
			</ThemedView>
		)
	}

	return (
		<>
			<ScrollView showsVerticalScrollIndicator={false}>
				<ThemedView colorName="bg_1" variant="background" style={styles.screen}>
					<ProsthesisOverview
						prosthesis={prosthesis}
						onEdit={() => setEditVisible(true)}
						onAddIncident={() =>
							router.push({
								pathname: "/incident/new",
								params: { prosthesisId: prosthesis.id },
							})
						}
					/>
					<ProsthesisComponentsList
						components={components}
						onAddComponent={() => router.push(`/prosthesis/${prosthesis.id}/components/new` as any)}
						onOpenComponent={(componentId) => router.push(`/component/${componentId}` as any)}
					/>
				</ThemedView>
			</ScrollView>

			{editVisible && (
				<EditProsthesisModal
					visible
					prosthesis={prosthesis}
					onClose={() => setEditVisible(false)}
					onSaved={setProsthesis}
				/>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	retryButton: {
		marginTop: 16,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 16,
	},
	screen: {
		alignItems: "center",
		paddingBottom: 20,
	},
})
