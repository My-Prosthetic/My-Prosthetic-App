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

export class AuthApiError extends Error {
	constructor(
		message: string,
		public readonly status?: number
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

async function login(payload: MobileLoginPayload): Promise<MobileLoginResponse> {
	const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "")
	if (!baseUrl) {
		throw new AuthApiError("Brak konfiguracji adresu API (EXPO_PUBLIC_API_URL).")
	}

	let response: Response
	try {
		response = await fetch(`${baseUrl}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(payload),
		})
	} catch {
		throw new AuthApiError("Nie można połączyć się z serwerem. Sprawdź połączenie i adres API.")
	}

	const body: unknown = await response.json().catch(() => null)
	if (response.status !== 200) {
		throw new AuthApiError(
			getErrorMessage(body) ?? `Logowanie nie powiodło się (HTTP ${response.status}).`,
			response.status
		)
	}

	return body as MobileLoginResponse
}

async function logout(token: string): Promise<void> {
	const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "")
	if (!baseUrl) {
		console.error("Cannot notify the API about logout: EXPO_PUBLIC_API_URL is not configured.")
		return
	}

	try {
		const response = await fetch(`${baseUrl}/logout`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		})

		if (!response.ok) {
			console.error(`API logout failed with HTTP ${response.status}.`)
		}
	} catch (error) {
		console.error("API logout request failed; continuing with local logout.", error)
	}
}

export const authService = { login, logout }
