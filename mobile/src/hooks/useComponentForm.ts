import { useEffect, useState } from "react"
import { Alert } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import {
	createComponent,
	deleteComponent,
	getComponentById,
	updateComponent,
} from "@/db/repositories/componentRepository"
import type { ComponentWithRelations } from "@/db/repositories/componentRepository"
import { getProsthesisById, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { getComponentTypesForProsthesis, type ComponentType } from "@/src/constants/componentTypes"
import { useBrandModelCatalog } from "@/src/hooks/useBrandModelCatalog"

export type ComponentFormMode = "Create" | "Edit"
type LoadState = "loading" | "ready" | "notFound" | "error"
type FormValues = {
	category: ComponentType
	brand: string
	model: string
	isFinal: boolean
	isHistorical: boolean
	assemblyDate: string | null
	warrantyEndDate: string | null
	expectedExchangeDate: string | null
	description: string
	remindExchangeEmail: boolean
	remindExchangeApp: boolean
	remindExchangePush: boolean
	remindWarrantyEmail: boolean
	remindWarrantyApp: boolean
	remindWarrantyPush: boolean
}

function parseDate(value: string | null | undefined): Date | null {
	if (!value) return null
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function serializeDate(value: Date | null): string | null {
	return value?.toISOString() ?? null
}

function getFormValues(component: ComponentWithRelations, brandId: string): FormValues {
	return {
		category: component.model.type,
		brand: brandId,
		model: component.modelId,
		isFinal: component.isFinal ?? false,
		isHistorical: component.isHistorical,
		assemblyDate: component.assemblyDate,
		warrantyEndDate: component.warrantyEndDate,
		expectedExchangeDate: component.expectedExchangeDate,
		description: component.description ?? "",
		remindExchangeEmail: component.remindExchangeEmail ?? true,
		remindExchangeApp: component.remindExchangeApp ?? true,
		remindExchangePush: component.remindExchangePush ?? false,
		remindWarrantyEmail: component.remindWarrantyEmail ?? true,
		remindWarrantyApp: component.remindWarrantyApp ?? true,
		remindWarrantyPush: component.remindWarrantyPush ?? false,
	}
}

export function useComponentForm(formMode: ComponentFormMode, componentId?: string) {
	const router = useRouter()
	const { prosthesisId } = useLocalSearchParams<{ prosthesisId?: string }>()
	const { t } = useTranslation()
	const isEditing = formMode === "Edit"

	const [loadState, setLoadState] = useState<LoadState>("loading")
	const [loadAttempt, setLoadAttempt] = useState(0)
	const [prosthesis, setProsthesis] = useState<Prosthesis | null>(null)
	const [initialFormValues, setInitialFormValues] = useState<FormValues | null>(null)
	const [category, setCategory] = useState<ComponentType>("socket")
	const [brand, setBrand] = useState("")
	const [model, setModel] = useState("")
	const [isFinal, setIsFinal] = useState(false)
	const [isHistorical, setIsHistorical] = useState(false)
	const [assemblyDate, setAssemblyDate] = useState<Date | null>(new Date())
	const [warrantyEndDate, setWarrantyEndDate] = useState<Date | null>(null)
	const [expectedExchangeDate, setExpectedExchangeDate] = useState<Date | null>(null)
	const [description, setDescription] = useState("")
	const [remindExchangeEmail, setRemindExchangeEmail] = useState(true)
	const [remindExchangeApp, setRemindExchangeApp] = useState(true)
	const [remindExchangePush, setRemindExchangePush] = useState(false)
	const [remindWarrantyEmail, setRemindWarrantyEmail] = useState(true)
	const [remindWarrantyApp, setRemindWarrantyApp] = useState(true)
	const [remindWarrantyPush, setRemindWarrantyPush] = useState(false)
	const [assemblyDateModalVisible, setAssemblyDateModalVisible] = useState(false)
	const [warrantyEndDateModalVisible, setWarrantyEndDateModalVisible] = useState(false)
	const [expectedExchangeDateModalVisible, setExpectedExchangeDateModalVisible] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (!prosthesisId) return

		let isMounted = true
		const loadForm = async () => {
			try {
				const loadedProsthesis = await getProsthesisById(prosthesisId)
				if (!loadedProsthesis) {
					if (isMounted) setLoadState("notFound")
					return
				}

				if (!isEditing) {
					if (isMounted) {
						setProsthesis(loadedProsthesis)
						setLoadState("ready")
					}
					return
				}

				if (!componentId) {
					if (isMounted) setLoadState("notFound")
					return
				}
				const component = await getComponentById(componentId)
				if (!component || component.prosthesisId !== prosthesisId) {
					if (isMounted) setLoadState("notFound")
					return
				}

				const nextValues = getFormValues(component, component.model.brandId)
				const parsedAssemblyDate = parseDate(component.assemblyDate)
				const parsedWarrantyDate = parseDate(component.warrantyEndDate)
				const parsedExchangeDate = parseDate(component.expectedExchangeDate)
				if (
					!parsedAssemblyDate ||
					(component.warrantyEndDate && !parsedWarrantyDate) ||
					(component.expectedExchangeDate && !parsedExchangeDate)
				) {
					throw new Error(`Component "${component.id}" contains an invalid date`)
				}

				if (!isMounted) return
				setProsthesis(loadedProsthesis)
				setCategory(nextValues.category)
				setBrand(nextValues.brand)
				setModel(nextValues.model)
				setIsFinal(nextValues.isFinal)
				setIsHistorical(nextValues.isHistorical)
				setAssemblyDate(parsedAssemblyDate)
				setWarrantyEndDate(parsedWarrantyDate)
				setExpectedExchangeDate(parsedExchangeDate)
				setDescription(nextValues.description)
				setRemindExchangeEmail(nextValues.remindExchangeEmail)
				setRemindExchangeApp(nextValues.remindExchangeApp)
				setRemindExchangePush(nextValues.remindExchangePush)
				setRemindWarrantyEmail(nextValues.remindWarrantyEmail)
				setRemindWarrantyApp(nextValues.remindWarrantyApp)
				setRemindWarrantyPush(nextValues.remindWarrantyPush)
				setInitialFormValues(nextValues)
				setLoadState("ready")
			} catch (error) {
				console.error("Failed to load component form:", error)
				if (isMounted) setLoadState("error")
			}
		}

		void loadForm()
		return () => {
			isMounted = false
		}
	}, [prosthesisId, componentId, isEditing, loadAttempt])

	const catalog = useBrandModelCatalog({
		category,
		selectedBrandId: brand,
		onBrandCreatedAndSelected: (brandId) => {
			setBrand(brandId)
			setModel("")
		},
		onModelCreatedAndSelected: setModel,
	})
	const componentCategories = getComponentTypesForProsthesis(prosthesis?.limbType).map((type) => ({
		label: t(`newComponent.categories.${type}`),
		value: type,
	}))

	const currentFormValues: FormValues = {
		category,
		brand,
		model,
		isFinal,
		isHistorical,
		assemblyDate: serializeDate(assemblyDate),
		warrantyEndDate: serializeDate(warrantyEndDate),
		expectedExchangeDate: serializeDate(expectedExchangeDate),
		description,
		remindExchangeEmail,
		remindExchangeApp,
		remindExchangePush,
		remindWarrantyEmail,
		remindWarrantyApp,
		remindWarrantyPush,
	}
	const hasUnsavedChanges =
		isEditing &&
		initialFormValues !== null &&
		JSON.stringify(currentFormValues) !== JSON.stringify(initialFormValues)
	const screenLoadState: LoadState =
		!prosthesisId || (isEditing && !componentId) ? "notFound" : loadState
	const handleCategoryChange = (nextCategory: ComponentType) => {
		setCategory(nextCategory)
		setModel("")
	}

	const toggleRemindExchangeEmail = () => setRemindExchangeEmail((current) => !current)
	const toggleRemindExchangeApp = () => setRemindExchangeApp((current) => !current)
	const toggleRemindExchangePush = () => setRemindExchangePush((current) => !current)
	const toggleRemindWarrantyEmail = () => setRemindWarrantyEmail((current) => !current)
	const toggleRemindWarrantyApp = () => setRemindWarrantyApp((current) => !current)
	const toggleRemindWarrantyPush = () => setRemindWarrantyPush((current) => !current)

	const handleOnAddFiles = () => {
		// File attachment is not implemented yet.
	}

	const validateDates = () => {
		if (!assemblyDate) return false

		const assemblyDay = new Date(assemblyDate)
		assemblyDay.setHours(0, 0, 0, 0)

		if (warrantyEndDate) {
			const warrantyDay = new Date(warrantyEndDate)
			warrantyDay.setHours(0, 0, 0, 0)
			if (warrantyDay < assemblyDay) {
				Alert.alert(
					t("common.validationError"),
					t("newComponent.validation.warrantyBeforeAssembly")
				)
				return false
			}
		}

		if (expectedExchangeDate) {
			const exchangeDay = new Date(expectedExchangeDate)
			exchangeDay.setHours(0, 0, 0, 0)
			if (exchangeDay < assemblyDay) {
				Alert.alert(
					t("common.validationError"),
					t("newComponent.validation.exchangeBeforeAssembly")
				)
				return false
			}
		}

		return true
	}

	const handleSave = async () => {
		if (!prosthesisId || isSaving) return

		if (!brand.trim() || !model.trim() || !assemblyDate) {
			const missingFields = [
				!category && t("newComponent.fields.category"),
				!brand.trim() && t("newComponent.fields.brand"),
				!model.trim() && t("newComponent.fields.model"),
				!assemblyDate && t("newComponent.fields.assemblyDate"),
			].filter(Boolean)

			Alert.alert(
				t("common.validationError"),
				t("newComponent.validation.requiredFields", {
					fields: missingFields.map((field) => `• ${field}`).join("\n"),
				})
			)
			return
		}

		if (!validateDates()) return

		try {
			setIsSaving(true)
			const input = {
				modelId: model.trim(),
				isFinal,
				isHistorical,
				assemblyDate: assemblyDate.toISOString(),
				warrantyEndDate: serializeDate(warrantyEndDate),
				expectedExchangeDate: serializeDate(expectedExchangeDate),
				description: description.trim() || null,
				remindExchangeEmail,
				remindExchangeApp,
				remindExchangePush,
				remindWarrantyEmail,
				remindWarrantyApp,
				remindWarrantyPush,
			}

			if (isEditing && componentId) {
				const updated = await updateComponent(componentId, input)
				if (!updated) throw new Error("Component not found or deleted")
			} else {
				await createComponent({
					prosthesisId,
					...input,
					description: description.trim(),
					warrantyEndDate: warrantyEndDate?.toISOString(),
					expectedExchangeDate: expectedExchangeDate?.toISOString(),
				})
			}

			router.back()
		} catch (error) {
			console.error(`Failed to ${isEditing ? "update" : "create"} component:`, error)
			Alert.alert(
				t("common.error"),
				isEditing
					? t("newComponent.errors.updateComponent")
					: t("newComponent.errors.saveComponent")
			)
		} finally {
			setIsSaving(false)
		}
	}

	const handleLeave = () => {
		if (!hasUnsavedChanges) {
			router.back()
			return
		}

		Alert.alert(t("newComponent.unsavedChangesTitle"), t("newComponent.unsavedChangesMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("newComponent.discardChanges"),
				style: "destructive",
				onPress: () => router.back(),
			},
		])
	}

	const handleDelete = () => {
		if (!isEditing || !componentId || isSaving) return

		Alert.alert(t("common.delete"), t("prosthesisDetails.deleteConfirmation"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					try {
						setIsSaving(true)
						const deletedComponent = await deleteComponent(componentId)
						if (!deletedComponent) {
							throw new Error(`Component "${componentId}" was not found or already deleted`)
						}

						router.back()
					} catch (error) {
						console.error("Failed to delete component:", error)
						Alert.alert(t("common.error"), t("newComponent.errors.deleteComponent"))
					} finally {
						setIsSaving(false)
					}
				},
			},
		])
	}

	const retryLoad = () => {
		setLoadState("loading")
		setLoadAttempt((attempt) => attempt + 1)
	}

	return {
		prosthesis,
		screenLoadState,
		category,
		brand,
		model,
		isFinal,
		isHistorical,
		assemblyDate,
		warrantyEndDate,
		expectedExchangeDate,
		description,
		remindExchangeEmail,
		remindExchangeApp,
		remindExchangePush,
		remindWarrantyEmail,
		remindWarrantyApp,
		remindWarrantyPush,
		assemblyDateModalVisible,
		warrantyEndDateModalVisible,
		expectedExchangeDateModalVisible,
		isSaving,
		hasUnsavedChanges,
		componentCategories,
		handleCategoryChange,
		handleSave,
		handleLeave,
		handleDelete,
		handleOnAddFiles,
		retryLoad,
		...catalog,
		setBrand,
		setModel,
		setIsFinal,
		setIsHistorical,
		setAssemblyDate,
		setWarrantyEndDate,
		setExpectedExchangeDate,
		setDescription,
		setRemindExchangeEmail,
		setRemindExchangeApp,
		setRemindExchangePush,
		setRemindWarrantyEmail,
		setRemindWarrantyApp,
		setRemindWarrantyPush,
		toggleRemindExchangeEmail,
		toggleRemindExchangeApp,
		toggleRemindExchangePush,
		toggleRemindWarrantyEmail,
		toggleRemindWarrantyApp,
		toggleRemindWarrantyPush,
		setAssemblyDateModalVisible,
		setWarrantyEndDateModalVisible,
		setExpectedExchangeDateModalVisible,
	}
}
