import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
	GoogleSignin,
	isErrorWithCode,
	statusCodes,
} from "@react-native-google-signin/google-signin"
import { AccessToken, LoginManager } from "react-native-fbsdk-next"

import { useAuth } from "@/context/AuthContext"
import { AuthApiError, authService } from "@/src/services/authService"
import { createUser } from "@/db/repositories/userRepository"

GoogleSignin.configure({
	webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

export const useOAuthLogin = () => {
	const { t } = useTranslation()
	const { loginWithToken } = useAuth()

	const [isOAuthLoading, setIsOAuthLoading] = useState(false)
	const [oauthError, setOAuthError] = useState("")

	const completeOAuthLogin = async (token: string, name: string) => {
		if (!(await loginWithToken(token))) return

		const firstName = name.trim().split(/\s+/)[0] ?? ""
		await createUser({ name: firstName })
	}

	const handleGoogleLogin = async () => {
		if (isOAuthLoading) return

		setOAuthError("")
		setIsOAuthLoading(true)

		try {
			await GoogleSignin.hasPlayServices({
				showPlayServicesUpdateDialog: true,
			})
			const response = await GoogleSignin.signIn()

			if (response.type === "cancelled") return

			const idToken = response.data.idToken

			if (!idToken) {
				throw new Error("Google did not return an ID token")
			}

			const result = await authService.oauthLogin({
				provider: "google",
				id_token: idToken,
			})

			await completeOAuthLogin(result.token, result.data.name)
		} catch (error) {
			if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
				return
			}

			setOAuthError(
				t(error instanceof AuthApiError ? error.translationKey : "auth.errors.unexpected")
			)
		} finally {
			setIsOAuthLoading(false)
		}
	}

	const handleFacebookLogin = async () => {
		if (isOAuthLoading) return

		setOAuthError("")
		setIsOAuthLoading(true)

		try {
			const loginResult = await LoginManager.logInWithPermissions(["public_profile", "email"])

			if (loginResult.isCancelled) return

			const tokenData = await AccessToken.getCurrentAccessToken()
			const accessToken = tokenData?.accessToken

			if (!accessToken) {
				throw new Error("Facebook did not return an access token.")
			}

			const result = await authService.oauthLogin({
				provider: "facebook",
				access_token: accessToken,
			})

			await completeOAuthLogin(result.token, result.data.name)
		} catch (error) {
			setOAuthError(
				t(error instanceof AuthApiError ? error.translationKey : "auth.errors.unexpected")
			)
		} finally {
			setIsOAuthLoading(false)
		}
	}

	return {
		handleGoogleLogin,
		handleFacebookLogin,
		isOAuthLoading,
		oauthError,
	}
}
