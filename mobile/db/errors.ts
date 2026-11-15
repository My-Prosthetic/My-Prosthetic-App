export class DuplicateBrandError extends Error {
	constructor(
		brandName: string,
		public readonly existingBrandId: string,
		message?: string
	) {
		super(message ?? `${brandName} already exists`)
		this.name = "DuplicateBrandError"
	}
}

export class DuplicateModelError extends Error {
	constructor(
		modelName: string,
		public readonly existingModelId: string,
		message?: string
	) {
		super(message ?? `${modelName} already exists`)
		this.name = "DuplicateEntityError"
	}
}
