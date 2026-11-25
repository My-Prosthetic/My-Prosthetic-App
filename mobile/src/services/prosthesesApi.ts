import { apiClient } from "./apiClient"

export type ProsthesisOption = {
	id: string
	name: string
}

export async function getPatientProstheses(patientId: string): Promise<ProsthesisOption[]> {
	const response = await apiClient.get<{
		data: ProsthesisOption[]
	}>(`/patient/${patientId}/prostheses`)

	return response.data.data
}
