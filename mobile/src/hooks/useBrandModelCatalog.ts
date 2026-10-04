import { useEffect, useState } from "react"
import { Alert } from "react-native"
import { useTranslation } from "react-i18next"

import { createBrand, findBrandByName, getBrands } from "@/db/repositories/brandRepository"
import {
	createModel,
	findModelsByName,
	getModelsByBrandAndType,
} from "@/db/repositories/modelRepository"
import type { DropdownOption } from "@/src/components/DropdownSelect"
import type { ComponentType } from "@/src/constants/componentTypes"

interface UseBrandModelCatalogParams {
	category: ComponentType
	selectedBrandId: string
	onBrandCreatedAndSelected: (brandId: string) => void
	onModelCreatedAndSelected: (modelId: string) => void
}

export function useBrandModelCatalog({
	category,
	selectedBrandId,
	onBrandCreatedAndSelected,
	onModelCreatedAndSelected,
}: UseBrandModelCatalogParams) {
	const { t } = useTranslation()
	const [brandsList, setBrandsList] = useState<DropdownOption<string>[]>([])
	const [isLoadingBrands, setIsLoadingBrands] = useState(true)
	const [modelsList, setModelsList] = useState<DropdownOption<string>[]>([])
	const [isLoadingModels, setIsLoadingModels] = useState(false)
	const [customOptionType, setCustomOptionType] = useState<"brand" | "model" | null>(null)
	const [customOptionName, setCustomOptionName] = useState("")
	const [isCreatingCustomOption, setIsCreatingCustomOption] = useState(false)

	useEffect(() => {
		let isMounted = true

		getBrands()
			.then((brands) => {
				if (isMounted) {
					setBrandsList(
						brands.map((currentBrand) => ({
							label: currentBrand.name,
							value: currentBrand.id,
						}))
					)
				}
			})
			.catch((error: unknown) => {
				console.error("Failed to load brands:", error)
				if (isMounted) {
					Alert.alert(t("common.error"), t("newComponent.errors.loadBrands"))
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoadingBrands(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [t])

	useEffect(() => {
		let isCurrentRequest = true

		Promise.resolve().then(async () => {
			if (!isCurrentRequest) {
				return
			}

			if (!selectedBrandId) {
				setModelsList([])
				setIsLoadingModels(false)
				return
			}

			setModelsList([])
			setIsLoadingModels(true)

			try {
				const models = await getModelsByBrandAndType(selectedBrandId, category)
				if (isCurrentRequest) {
					setModelsList(
						models.map((currentModel) => ({
							label: currentModel.name,
							value: currentModel.id,
						}))
					)
				}
			} catch (error) {
				console.error("Failed to load models:", error)
				if (isCurrentRequest) {
					Alert.alert(t("common.error"), t("newComponent.errors.loadModels"))
				}
			} finally {
				if (isCurrentRequest) {
					setIsLoadingModels(false)
				}
			}
		})

		return () => {
			isCurrentRequest = false
		}
	}, [selectedBrandId, category, t])

	const openCustomOptionDialog = (type: "brand" | "model") => {
		setCustomOptionName("")
		setCustomOptionType(type)
	}

	const closeCustomOptionDialog = () => {
		if (isCreatingCustomOption) {
			return
		}
		setCustomOptionType(null)
		setCustomOptionName("")
	}

	const confirmCreateModel = (existingBrandName: string, selectedBrandName: string) =>
		new Promise<boolean>((resolve) => {
			Alert.alert(
				t("newComponent.customModel.duplicateTitle"),
				t("newComponent.customModel.duplicateMessage", {
					existingBrand: existingBrandName,
					selectedBrand: selectedBrandName,
				}),
				[
					{
						text: t("common.cancel"),
						style: "cancel",
						onPress: () => resolve(false),
					},
					{
						text: t("newComponent.customModel.confirm"),
						onPress: () => resolve(true),
					},
				],
				{ cancelable: true, onDismiss: () => resolve(false) }
			)
		})

	const saveCustomOption = async () => {
		const name = customOptionName.trim()

		if (!name || !customOptionType || isCreatingCustomOption) {
			return
		}

		setIsCreatingCustomOption(true)
		try {
			if (customOptionType === "brand") {
				const existingBrand = await findBrandByName(name)
				if (existingBrand) {
					Alert.alert(t("common.error"), t("newComponent.customBrand.alreadyExists"))
					return
				}

				const newBrand = await createBrand(name)
				if (!newBrand) {
					Alert.alert(t("common.error"), t("newComponent.customBrand.alreadyExists"))
					return
				}

				setBrandsList((currentBrands) =>
					currentBrands.some((option) => option.value === newBrand.id)
						? currentBrands
						: [...currentBrands, { label: newBrand.name, value: newBrand.id }]
				)
				setCustomOptionType(null)
				setCustomOptionName("")
				onBrandCreatedAndSelected(newBrand.id)
				Alert.alert(
					t("newComponent.customOption.successTitle"),
					t("newComponent.customBrand.created")
				)
				return
			}

			if (!selectedBrandId) {
				return
			}

			const existingModels = await findModelsByName(name, category)
			const existingModelForSelectedBrand = existingModels.find(
				(existingModel) => existingModel.brandId === selectedBrandId
			)
			if (existingModelForSelectedBrand) {
				setModelsList((currentModels) =>
					currentModels.some((option) => option.value === existingModelForSelectedBrand.id)
						? currentModels
						: [
								...currentModels,
								{
									label: existingModelForSelectedBrand.name,
									value: existingModelForSelectedBrand.id,
								},
							]
				)
				setCustomOptionType(null)
				setCustomOptionName("")
				onModelCreatedAndSelected(existingModelForSelectedBrand.id)
				Alert.alert(t("common.error"), t("newComponent.customModel.alreadyExistsForBrand"))
				return
			}

			const existingModel = existingModels[0]
			if (
				existingModel &&
				!(await confirmCreateModel(
					existingModel.brandName,
					brandsList.find((option) => option.value === selectedBrandId)?.label ??
						t("newComponent.fields.brand")
				))
			) {
				return
			}

			const newModel = await createModel({
				brandId: selectedBrandId,
				type: category,
				name,
			})
			if (!newModel) {
				Alert.alert(t("common.error"), t("newComponent.customModel.alreadyExistsForBrand"))
				return
			}

			setModelsList((currentModels) =>
				currentModels.some((option) => option.value === newModel.id)
					? currentModels
					: [...currentModels, { label: newModel.name, value: newModel.id }]
			)
			setCustomOptionType(null)
			setCustomOptionName("")
			onModelCreatedAndSelected(newModel.id)
			Alert.alert(
				t("newComponent.customOption.successTitle"),
				t("newComponent.customModel.created")
			)
		} catch (error) {
			console.error(`Failed to create custom ${customOptionType}:`, error)
			Alert.alert(
				t("common.error"),
				customOptionType === "brand"
					? t("newComponent.errors.createBrand")
					: t("newComponent.errors.createModel")
			)
		} finally {
			setIsCreatingCustomOption(false)
		}
	}

	return {
		brandsList,
		isLoadingBrands,
		modelsList,
		isLoadingModels,
		customOptionType,
		customOptionName,
		setCustomOptionName,
		isCreatingCustomOption,
		openCustomOptionDialog,
		closeCustomOptionDialog,
		saveCustomOption,
	}
}
