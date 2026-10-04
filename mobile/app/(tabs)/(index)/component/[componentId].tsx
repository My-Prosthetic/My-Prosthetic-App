import React, { useEffect, useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import {
	getComponentById,
	updateComponent,
	type Component,
} from "@/db/repositories/componentRepository"
import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

export default function EditComponentScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { t } = useTranslation()
	const { componentId } = useLocalSearchParams<{ componentId: string }>()

	const [component, setComponent] = useState<Component | null>(null)
	const [name, setName] = useState("")
	const [manufacturer, setManufacturer] = useState("")
	const [model, setModel] = useState("")
	const [warrantyUntil, setWarrantyUntil] = useState("")
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		const loadComponent = async () => {
			if (!componentId || typeof componentId !== "string") {
				setIsLoading(false)
				return
			}

			try {
				const result = await getComponentById(componentId)
				setComponent(result)
				setName(result?.name ?? "")
				setManufacturer(result?.manufacturer ?? "")
				setModel(result?.model ?? "")
				setWarrantyUntil(result?.warrantyUntil ?? "")
			} finally {
				setIsLoading(false)
			}
		}

		loadComponent()
	}, [componentId])

	const handleSave = async () => {
		if (!component) return

		try {
			setIsSaving(true)
			await updateComponent(component.id, {
				name: name.trim() || undefined,
				manufacturer: manufacturer.trim() || undefined,
				model: model.trim() || undefined,
				warrantyUntil: warrantyUntil.trim() || undefined,
			})
			router.back()
		} catch {
			Alert.alert(t("componentEdit.saveError"))
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading) {
		return (
			<ThemedView colorName="tertiary_base_1" style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary_base} />
			</ThemedView>
		)
	}

	if (!component) {
		return (
			<ThemedView colorName="tertiary_base_1" style={styles.centered}>
				<ThemedText tx="componentEdit.notFound" variant="subTitle2" colorName="primary_base" />
			</ThemedView>
		)
	}

	return (
		<ThemedView colorName="tertiary_base_1" style={styles.screen}>
			<ThemedView colorName="primary_base" style={styles.header}>
				<ThemedView
					colorName="primary_base"
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Ionicons name="chevron-back" size={28} color={colors.accent_base} />
				</ThemedView>
				<ThemedText tx="componentEdit.title" variant="title" colorName="accent_base" />
			</ThemedView>

			<View style={styles.content}>
				{[
					[t("componentEdit.name"), name, setName],
					[t("componentEdit.manufacturer"), manufacturer, setManufacturer],
					[t("componentEdit.model"), model, setModel],
					[t("componentEdit.warrantyUntil"), warrantyUntil, setWarrantyUntil],
				].map(([label, value, setter]) => (
					<View key={label as string} style={styles.field}>
						<ThemedText variant="subTitle2" colorName="primary_base">
							{label as string}
						</ThemedText>
						<ThemedView
							colorName="tertiary_base_3"
							borderColor="secondary_base_0c"
							style={styles.inputBox}
						>
							<TextInput
								value={value as string}
								onChangeText={setter as (text: string) => void}
								style={[styles.input, { color: colors.primary_base }]}
							/>
						</ThemedView>
					</View>
				))}

				<ThemedView
					colorName="primary_base"
					style={styles.saveButton}
					onPress={handleSave}
					disabled={isSaving}
				>
					<ThemedText tx="componentEdit.save" variant="subTitle2" colorName="accent_base" />
				</ThemedView>
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	header: {
		minHeight: 86,
		justifyContent: "center",
		alignItems: "center",
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
	},
	backButton: { position: "absolute", left: 16, padding: 12 },
	content: { padding: 24, gap: 18 },
	field: { gap: 6 },
	inputBox: { borderWidth: 1, borderRadius: 12 },
	input: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
	saveButton: {
		marginTop: 8,
		paddingVertical: 14,
		borderRadius: 24,
		alignItems: "center",
	},
})
