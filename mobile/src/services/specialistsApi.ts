import { apiClient } from "./apiClient"

export type Specialist = {
	id: string
	name: string
}

export type SpecialistSearchResponse = {
	data: Specialist[]
	links: {
		next: string | null
	}
}

export async function searchSpecialists(
	query: string,
	page = 1
): Promise<SpecialistSearchResponse> {
	const response = await apiClient.get<SpecialistSearchResponse>("/specialists/search", {
		params: {
			q: query.trim(),
			page,
		},
	})

	return response.data
}
