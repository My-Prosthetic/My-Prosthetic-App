import React, { useEffect, useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import {
	getComponentById,
	updateComponent,
	type Component,
} from "@/db/repositories/componentRepository"
import { DatePickerModal } from "@/src/components/DatePicker"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

function toLocalDate(value: string): Date | undefined {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
	const [year, month, day] = value.split("-").map(Number)
	const date = new Date(year, month - 1, day)
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
		return undefined
	return date
}

function toDateString(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

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
	const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
	const [loadFailed, setLoadFailed] = useState(false)

	useEffect(() => {
		let active = true
		const loadComponent = async () => {
			setIsLoading(true)
			setLoadFailed(false)
			setComponent(null)
			if (!componentId || typeof componentId !== "string") {
				setIsLoading(false)
				return
			}
			try {
				const result = await getComponentById(componentId)
				if (!active) return
				setComponent(result)
				setName(result?.name ?? "")
				setManufacturer(result?.manufacturer ?? "")
				setModel(result?.model ?? "")
				setWarrantyUntil(result?.warrantyUntil ?? "")
			} catch (error) {
				console.error("Failed to load component:", error)
				if (active) {
					setLoadFailed(true)
					Alert.alert(t("common.error"), t("componentEdit.loadError"))
				}
			} finally {
				if (active) setIsLoading(false)
			}
		}
		void loadComponent()
		return () => {
			active = false
		}
	}, [componentId, t])

	const handleSave = async () => {
		if (!component || isSaving) return
		try {
			setIsSaving(true)
			const updated = await updateComponent(component.id, {
				name: name.trim() || null,
				manufacturer: manufacturer.trim() || null,
				model: model.trim() || null,
				warrantyUntil: warrantyUntil || null,
			})
			if (!updated) throw new Error("Component not found or deleted")
			router.back()
		} catch (error) {
			console.error("Failed to save component:", error)
			Alert.alert(t("common.error"), t("componentEdit.saveError"))
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
				<ThemedText
					tx={loadFailed ? "componentEdit.loadError" : "componentEdit.notFound"}
					variant="subTitle2"
					colorName="primary_base"
				/>
			</ThemedView>
		)
	}

	const fields = [
		{ key: "name", label: t("componentEdit.name"), value: name, onChange: setName },
		{
			key: "manufacturer",
			label: t("componentEdit.manufacturer"),
			value: manufacturer,
			onChange: setManufacturer,
		},
		{ key: "model", label: t("componentEdit.model"), value: model, onChange: setModel },
	]

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
				{fields.map(({ key, label, value, onChange }) => (
					<View key={key} style={styles.field}>
						<ThemedText variant="subTitle2" colorName="primary_base">
							{label}
						</ThemedText>
						<ThemedView
							colorName="tertiary_base_3"
							borderColor="secondary_base_0c"
							style={styles.inputBox}
						>
							<TextInput
								value={value}
								onChangeText={onChange}
								style={[styles.input, { color: colors.primary_base }]}
							/>
						</ThemedView>
					</View>
				))}

				<View style={styles.field}>
					<ThemedText
						tx="componentEdit.warrantyUntil"
						variant="subTitle2"
						colorName="primary_base"
					/>
					<ThemedView
						colorName="tertiary_base_3"
						borderColor="secondary_base_0c"
						style={styles.inputBox}
						onPress={() => setIsDatePickerVisible(true)}
					>
						<View style={styles.dateInput}>
							<ThemedText variant="subTitle2" colorName="primary_base">
								{warrantyUntil || "—"}
							</ThemedText>
							<Ionicons name="calendar-outline" size={22} color={colors.primary_base} />
						</View>
					</ThemedView>
					{warrantyUntil !== "" && (
						<ThemedView
							colorName="tertiary_base_1"
							style={styles.clearDate}
							onPress={() => setWarrantyUntil("")}
						>
							<Ionicons name="close-circle-outline" size={20} color={colors.primary_base} />
							<ThemedText tx="common.delete" variant="subTitle2" colorName="primary_base" />
						</ThemedView>
					)}
				</View>

				<ThemedView
					colorName="primary_base"
					style={styles.saveButton}
					onPress={() => {
						void handleSave()
					}}
					disabled={isSaving}
				>
					<ThemedText tx="componentEdit.save" variant="subTitle2" colorName="accent_base" />
				</ThemedView>
			</View>

			<DatePickerModal
				visible={isDatePickerVisible}
				onClose={() => setIsDatePickerVisible(false)}
				initialDate={toLocalDate(warrantyUntil)}
				onSave={(date) => setWarrantyUntil(toDateString(date))}
			/>
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
	dateInput: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	clearDate: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6 },
	saveButton: {
		marginTop: 8,
		paddingVertical: 14,
		borderRadius: 24,
		alignItems: "center",
	},
})
