import { isAxiosError } from "axios"
import { apiClient } from "./apiClient"

export type PasswordResetErrorCode =
	"invalidEmail" | "invalidCode" | "invalidPassword" | "rateLimited" | "network"

export class PasswordResetError extends Error {
	constructor(public readonly code: PasswordResetErrorCode) {
		super(code)
		this.name = "PasswordResetError"
	}
}

export interface RequestCodeResponse {
	message: string
	expires_at: string
	resend_after: string
}

const handleError = (error: unknown, operation: "request" | "verify" | "reset"): never => {
	if (isAxiosError(error)) {
		if (error.response?.status === 429) throw new PasswordResetError("rateLimited")
		if (error.response?.status === 422) {
			if (operation === "request") throw new PasswordResetError("invalidEmail")
			throw new PasswordResetError(
				operation === "reset" && error.response.data?.errors?.password
					? "invalidPassword"
					: "invalidCode"
			)
		}
	}
	throw new PasswordResetError("network")
}

export const passwordResetService = {
	async requestCode(email: string): Promise<RequestCodeResponse> {
		try {
			const { data } = await apiClient.post<RequestCodeResponse>("/password-reset/request", {
				email,
			})
			return data
		} catch (error) {
			return handleError(error, "request")
		}
	},
	async verifyCode(email: string, code: string): Promise<void> {
		try {
			await apiClient.post("/password-reset/verify", { email, code })
		} catch (error) {
			handleError(error, "verify")
		}
	},
	async resetPassword(
		email: string,
		code: string,
		password: string,
		confirmation: string
	): Promise<void> {
		try {
			await apiClient.post("/password-reset/confirm", {
				email,
				code,
				password,
				password_confirmation: confirmation,
			})
		} catch (error) {
			handleError(error, "reset")
		}
	},
}
