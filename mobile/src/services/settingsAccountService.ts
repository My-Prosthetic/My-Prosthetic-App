import { isAxiosError } from "axios"
import { apiClient } from "@/src/services/apiClient"
import type { AuthenticatedUser } from "@/src/services/authService"

export type AccountApiErrorKind =
	| "configuration"
	| "unauthorized"
	| "wrongPassword"
	| "validation"
	| "network"
	| "unavailable"
	| "server"

export class AccountApiError extends Error {
	constructor(
		public readonly kind: AccountApiErrorKind,
		public readonly status?: number
	) {
		super(`Account API request failed: ${kind}${status ? ` (${status})` : ""}`)
		this.name = "AccountApiError"
	}
}

function hasCurrentPasswordError(data: unknown): boolean {
	if (!data || typeof data !== "object" || !("errors" in data)) return false
	const errors: unknown = data.errors
	return Boolean(errors && typeof errors === "object" && "current_password" in errors)
}

function mapAccountApiError(error: unknown): AccountApiError {
	if (!isAxiosError(error)) return new AccountApiError("server")

	const status = error.response?.status
	if (status === 401 || status === 403) return new AccountApiError("unauthorized", status)
	if (status === 404 || status === 405) return new AccountApiError("unavailable", status)
	if (status === 422) {
		return new AccountApiError(
			hasCurrentPasswordError(error.response?.data) ? "wrongPassword" : "validation",
			status
		)
	}
	if (!error.response) return new AccountApiError("network")
	return new AccountApiError("server", status)
}

async function accountRequest<T>(
	path: string,
	method: "GET" | "PUT" | "DELETE",
	body?: object
): Promise<T> {
	if (!process.env.EXPO_PUBLIC_API_URL) throw new AccountApiError("configuration")

	try {
		const response = await apiClient.request<T>({ url: path, method, data: body })
		return response.data
	} catch (error: unknown) {
		throw mapAccountApiError(error)
	}
}

export async function getAccountProfile(): Promise<AuthenticatedUser> {
	const payload = await accountRequest<{ data: AuthenticatedUser }>("/profile", "GET")
	return payload.data
}

export async function changeAccountPassword(
	currentPassword: string,
	password: string,
	confirmation: string
): Promise<void> {
	await accountRequest<void>("/account/password", "PUT", {
		current_password: currentPassword,
		password,
		password_confirmation: confirmation,
	})
}

export async function deleteAccount(): Promise<void> {
	await accountRequest<void>("/account", "DELETE")
}
