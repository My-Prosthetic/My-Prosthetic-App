import { apiClient } from "./apiClient"

export type SharePermissions = {
	medical_history: boolean
	prostheses: string[]
	incidents: string[]
}

export type Share = {
	specialist: {
		id: string
		name: string
	}
	permissions: SharePermissions
	created_at: string
	updated_at: string
}

type SharesResponse = {
	data: Share[]
}

export async function getShares(): Promise<Share[]> {
	const response = await apiClient.get<SharesResponse>("/shares")
	return response.data.data
}

export async function createShare(
	specialistId: string,
	permissions: SharePermissions
): Promise<Share> {
	const response = await apiClient.post<{ data: Share }>("/shares", {
		permissions,
	})

	return response.data.data
}
