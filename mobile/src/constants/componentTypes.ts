export const COMPONENT_TYPES = [
	"socket",
	"liner",
	"hip",
	"knee",
	"foot",
	"elbow",
	"wrist",
	"hand",
	"electrodes",
	"mechanical",
	"adapter",
	"suspension",
	"cosmetic",
	"other",
] as const

export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const LOWER_ONLY_COMPONENT_TYPES = ["hip", "knee", "foot"] as const
export const UPPER_ONLY_COMPONENT_TYPES = ["elbow", "wrist", "hand"] as const

export function getComponentTypesForProsthesis(limbType?: "upper" | "lower"): ComponentType[] {
	if (limbType === "upper") {
		return COMPONENT_TYPES.filter(
			(type) => !(LOWER_ONLY_COMPONENT_TYPES as readonly string[]).includes(type)
		)
	}

	if (limbType === "lower") {
		return COMPONENT_TYPES.filter(
			(type) => !(UPPER_ONLY_COMPONENT_TYPES as readonly string[]).includes(type)
		)
	}

	return [...COMPONENT_TYPES]
}
