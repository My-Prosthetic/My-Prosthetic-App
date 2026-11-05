import type { ComponentWithRelations } from "@/db/repositories/componentRepository"
import type { ComponentFilters } from "@/src/components/ComponentFiltersModal"

export function filterComponents(components: ComponentWithRelations[], filters: ComponentFilters) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const endingSoon = new Date(today)
	endingSoon.setDate(endingSoon.getDate() + 30)
	endingSoon.setHours(23, 59, 59, 999)

	return components.filter((component) => {
		if (filters.status === "active" && component.isHistorical) return false
		if (filters.status === "historical" && !component.isHistorical) return false
		if (filters.types.length > 0 && !filters.types.includes(component.model.type)) return false

		const assemblyDate = Date.parse(component.assemblyDate)
		if (filters.assemblyFrom) {
			const from = new Date(filters.assemblyFrom)
			from.setHours(0, 0, 0, 0)
			if (!Number.isFinite(assemblyDate) || assemblyDate < from.getTime()) return false
		}
		if (filters.assemblyTo) {
			const to = new Date(filters.assemblyTo)
			to.setHours(23, 59, 59, 999)
			if (!Number.isFinite(assemblyDate) || assemblyDate > to.getTime()) return false
		}

		const warrantyDate = component.warrantyEndDate ? Date.parse(component.warrantyEndDate) : NaN
		const hasWarranty = Number.isFinite(warrantyDate)
		if (filters.warranty === "noDate" && hasWarranty) return false
		if (filters.warranty === "expired" && (!hasWarranty || warrantyDate >= today.getTime()))
			return false
		if (
			filters.warranty === "endingSoon" &&
			(!hasWarranty || warrantyDate < today.getTime() || warrantyDate > endingSoon.getTime())
		)
			return false
		return true
	})
}
