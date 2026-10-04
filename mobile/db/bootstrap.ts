import { Storage } from "expo-sqlite/kv-store"
import { eq } from "drizzle-orm"

import catalogueData from "@/config/prothesesCatalogueConfig.json"
import { db } from "@/db/client"
import { brands, models } from "@/db/schema"
import { COMPONENT_TYPES, type ComponentType } from "@/src/constants/componentTypes"

const CATALOGUE_SEEDED_VERSION = "CATALOGUE_SEEDED_VERSION"

type CatalogueModel = {
	id: string
	name: string
	type: string
}

type CatalogueBrand = {
	id: string
	name: string
	models: CatalogueModel[]
}

type ManufacturersCatalogue = {
	lastUpdated: string
	catalogue: CatalogueBrand[]
}

type ValidatedCatalogueBrand = Omit<CatalogueBrand, "models"> & {
	models: (Omit<CatalogueModel, "type"> & { type: ComponentType })[]
}

const catalogue = catalogueData as ManufacturersCatalogue

function getComponentType(type: string): ComponentType {
	const componentType = COMPONENT_TYPES.find((candidate) => candidate === type)

	if (!componentType) {
		throw new Error(`Invalid component type in manufacturers catalogue: ${type}`)
	}

	return componentType
}

export async function seedCatalogIfNotInitialized(): Promise<void> {
	try {
		const seededVersion = await Storage.getItemAsync(CATALOGUE_SEEDED_VERSION)

		if (seededVersion === catalogue.lastUpdated) {
			return
		}

		const validatedCatalogue: ValidatedCatalogueBrand[] = catalogue.catalogue.map((brand) => ({
			...brand,
			models: brand.models.map((model) => ({
				...model,
				type: getComponentType(model.type),
			})),
		}))

		db.transaction((tx) => {
			for (const brand of validatedCatalogue) {
				tx.insert(brands)
					.values({
						id: brand.id,
						name: brand.name,
						isCustom: false,
					})
					.onConflictDoNothing()
					.run()

				const seededBrand = tx
					.select({ id: brands.id })
					.from(brands)
					.where(eq(brands.id, brand.id))
					.get()

				if (!seededBrand) {
					if (__DEV__) {
						console.warn(
							`Skipping catalogue models for "${brand.name}" because its brand ID conflicts with an existing record.`
						)
					}
					continue
				}

				for (const model of brand.models) {
					tx.insert(models)
						.values({
							id: model.id,
							brandId: brand.id,
							name: model.name,
							type: model.type,
							isCustom: false,
						})
						.onConflictDoNothing()
						.run()
				}
			}
		})

		await Storage.setItemAsync(CATALOGUE_SEEDED_VERSION, catalogue.lastUpdated)

		if (__DEV__) {
			console.info(`Manufacturers catalogue ${catalogue.lastUpdated} seeded successfully.`)
		}
	} catch (error) {
		if (__DEV__) {
			console.error("Failed to seed manufacturers catalogue:", error)
		}
		throw error
	}
}
