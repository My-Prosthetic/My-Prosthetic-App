import { isAxiosError } from "axios"
import { apiClient } from "./apiClient"

export interface MobileLoginPayload {
	email: string
	password: string
	device_name?: string
}

export interface AuthenticatedUser {
	id: number
	name: string
	email: string
	role: string
	email_verified_at: string | null
}

export interface MobileLoginResponse {
	data: AuthenticatedUser
	token: string
	token_type: "Bearer"
}

export interface RegisterPayload {
	name: string
	email: string
	password: string
	password_confirmation: string
	device_name?: string | null
}

export interface RegisterResponse {
	data: AuthenticatedUser
	token: string
	token_type: "Bearer"
}

export type AuthErrorTranslationKey =
	| "auth.errors.apiUnavailable"
	| "auth.errors.network"
	| "auth.errors.invalidCredentials"
	| "auth.errors.emailTaken"
	| "auth.errors.invalidEmail"
	| "auth.errors.passwordMismatch"
	| "auth.errors.passwordInvalid"
	| "auth.errors.validationFailed"
	| "auth.errors.requestFailed"
	| "auth.errors.unexpected"

export class AuthApiError extends Error {
	constructor(
		message: string,
		public readonly status: number | undefined,
		public readonly translationKey: AuthErrorTranslationKey
	) {
		super(message)
		this.name = "AuthApiError"
	}
}

function getErrorMessage(body: unknown): string | undefined {
	if (!body || typeof body !== "object") return undefined

	const response = body as { message?: unknown; errors?: Record<string, unknown> }
	if (response.errors && typeof response.errors === "object") {
		for (const messages of Object.values(response.errors)) {
			if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0]
		}
	}

	return typeof response.message === "string" ? response.message : undefined
}

function getErrorTranslationKey(
	status: number,
	body: unknown,
	operation: "login" | "register"
): AuthErrorTranslationKey {
	if (status === 401) return "auth.errors.invalidCredentials"
	if (status !== 422) return "auth.errors.requestFailed"

	if (!body || typeof body !== "object") return "auth.errors.validationFailed"
	const errors = (body as { errors?: Record<string, unknown> }).errors
	if (!errors || typeof errors !== "object") return "auth.errors.validationFailed"

	const fieldMessages = (field: string) => {
		const messages = errors[field]
		return Array.isArray(messages)
			? messages.filter((message): message is string => typeof message === "string")
			: []
	}

	if (operation === "register") {
		const emailMessages = fieldMessages("email")
		if (emailMessages.some((message) => /taken|already|unique/i.test(message))) {
			return "auth.errors.emailTaken"
		}
		if (emailMessages.length > 0) return "auth.errors.invalidEmail"
		if (fieldMessages("password_confirmation").length > 0) return "auth.errors.passwordMismatch"
		if (fieldMessages("password").length > 0) return "auth.errors.passwordInvalid"
	}

	return "auth.errors.validationFailed"
}

// takes whatever error axios throws and translates it into an AuthApiError
function toAuthApiError(error: unknown, operation: "login" | "register"): AuthApiError {
	if (isAxiosError(error) && error.response) {
		const { status, data } = error.response
		return new AuthApiError(
			getErrorMessage(data) ?? `Request failed with HTTP ${status}.`,
			status,
			getErrorTranslationKey(status, data, operation)
		)
	}
	return new AuthApiError("API request failed to connect.", undefined, "auth.errors.network")
}

// replaced login function that uses axios apiClient
async function login(payload: MobileLoginPayload): Promise<MobileLoginResponse> {
	if (!process.env.EXPO_PUBLIC_API_URL) {
		throw new AuthApiError("API configuration is missing.", undefined, "auth.errors.apiUnavailable")
	}

	try {
		const response = await apiClient.post<MobileLoginResponse>("/login", payload)
		return response.data
	} catch (error) {
		throw toAuthApiError(error, "login")
	}
}

async function register(payload: RegisterPayload): Promise<RegisterResponse> {
	if (!process.env.EXPO_PUBLIC_API_URL) {
		throw new AuthApiError("API configuration is missing.", undefined, "auth.errors.apiUnavailable")
	}

	try {
		const response = await apiClient.post<RegisterResponse>("/register", payload)
		return response.data
	} catch (error) {
		throw toAuthApiError(error, "register")
	}
}

async function logout(): Promise<void> {
	try {
		await apiClient.post("logout")
	} catch (error) {
		console.error("API logout request failed; continuing with local logout.", error)
	}
}

export const authService = { login, register, logout }
