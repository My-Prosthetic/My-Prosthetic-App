export type KLevelId = "K0" | "K1" | "K2" | "K3" | "K4"

export type Condition = {
	id: string
	name: string
}

export type Medication = {
	id: string
	name: string
	usage: string
}

export type AddMode = "condition" | "medication" | null
