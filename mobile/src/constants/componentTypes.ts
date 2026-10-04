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
