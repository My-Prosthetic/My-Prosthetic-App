import axios from "axios"
import * as SecureStore from "expo-secure-store"

export const AUTH_TOKEN_KEY = "auth_token"

export const apiClient = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
})

// runs before every request
apiClient.interceptors.request.use(async (config) => {
	const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY)
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})
