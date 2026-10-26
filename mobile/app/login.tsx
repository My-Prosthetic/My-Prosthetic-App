import { useState } from "react"
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"
import { useTheme } from "@/context/ThemeContext"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { AuthApiError, authService } from "@/src/services/authService"
import { createUser } from "@/db/repositories/userRepository"
import { isValidEmail } from "@/src/utils/emailValidation"
import { ThemedInput } from "@/src/components/ThemedInput"

export default function LoginScreen() {
	const router = useRouter()
	const { t } = useTranslation()
	const { loginWithToken } = useAuth()

	const { colors } = useTheme()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState("")

	//TODO
	const handleResetPassword = () => {
		router.back()
	}

	const handleLogin = async () => {
		if (isLoading) return

		setErrorMessage("")
		const normalizedEmail = email.trim()
		if (!normalizedEmail || !password) {
			setErrorMessage(t("login.validation.required"))
			return
		}
		if (!isValidEmail(normalizedEmail)) {
			setErrorMessage(t("login.validation.invalidEmail"))
			return
		}

		setIsLoading(true)
		try {
			const result = await authService.login({ email: normalizedEmail, password })
			if (!(await loginWithToken(result.token))) return
			const firstName = result.data.name.trim().split(/\s+/)[0] ?? ""
			await createUser({ name: firstName })
			//TODO fetch user database contents from api
		} catch (error) {
			setErrorMessage(
				t(error instanceof AuthApiError ? error.translationKey : "auth.errors.unexpected")
			)
		} finally {
			setIsLoading(false)
		}
	}

	//TODO
	const handleGoogleLogin = () => {}

	//TODO
	const handleFacebookLogin = () => {}

	const handleSignUp = () => {
		router.push("../signup")
	}

	const topSectionRender = () => {
		return (
			<ThemedText
				tx="login.logIn"
				variant="H0"
				colorName="blue0"
				numberOfLines={1}
				style={{ textTransform: "uppercase", flexShrink: 0 }}
			/>
		)
	}

	const bottomSectionRender = () => {
		return (
			<ThemedView
				variant="background"
				colorName="bg_0"
				style={{
					justifyContent: "space-around",
					borderTopLeftRadius: 1000,
				}}
			>
				<View style={styles.inputsAndReset}>
					<View style={styles.inputsSection}>
						{/* Pole Email */}
						<View style={styles.inputGroup}>
							<ThemedText tx="login.email" variant="H1" colorName="blue2" />
							<ThemedInput
								variant="email"
								value={email}
								onChangeText={(value) => {
									setEmail(value)
									setErrorMessage("")
								}}
								editable={!isLoading}
							/>
						</View>

						{/* Pole Hasło */}
						<View style={styles.inputGroup}>
							<ThemedText tx="login.password" variant="H1" colorName="blue2" />
							<ThemedInput
								variant="password"
								value={password}
								onChangeText={(value) => {
									setPassword(value)
									setErrorMessage("")
								}}
								editable={!isLoading}
							/>
						</View>
					</View>

					{/* Link Reset Hasła */}
					<View style={styles.inlineRow}>
						<ThemedText
							tx="login.forgotPassword"
							variant="H1"
							colorName="blue2"
							disabled={isLoading}
						/>
						<ThemedText
							tx="login.reset"
							variant="H1"
							colorName="magenta0"
							onPress={handleResetPassword}
							disabled={isLoading}
						/>
					</View>
				</View>

				{/* Sekcja Przycisków Akcji */}
				<View style={styles.actionsSection}>
					{errorMessage && (
						<ThemedText accessibilityRole="alert" variant="H3" colorName="false">
							{errorMessage}
						</ThemedText>
					)}

					{/* Przycisk ZALOGUJ */}
					<ThemedView
						variant="narrow"
						colorName="blue2"
						onPress={handleLogin}
						disabled={isLoading}
						accessibilityState={{ disabled: isLoading, busy: isLoading }}
					>
						<ThemedText tx="login.logIn" variant="H1" colorName="bg_0" />
					</ThemedView>

					{/* Przycisk Kontynuuj z Google */}
					<ThemedView
						variant="narrow"
						colorName="blue0"
						onPress={handleGoogleLogin}
						disabled={isLoading}
						accessibilityState={{ disabled: isLoading, busy: isLoading }}
					>
						<ThemedText tx="login.continueGoogle" variant="H1" colorName="graphite0" />
					</ThemedView>

					{/* Przycisk Kontynuuj z Facebook */}
					<ThemedView
						variant="narrow"
						colorName="blue0"
						onPress={handleFacebookLogin}
						disabled={isLoading}
						accessibilityState={{ disabled: isLoading, busy: isLoading }}
					>
						<ThemedText tx="login.continueFacebook" variant="H1" colorName="graphite0" />
					</ThemedView>

					{/* Link do rejestracji konta */}
					<View style={styles.inlineRow}>
						<ThemedText tx="login.noAccount" variant="H3" colorName="blue2" />
						<ThemedText
							tx="login.createAccount"
							variant="H3"
							colorName="magenta0"
							onPress={handleSignUp}
							disabled={isLoading}
						/>
					</View>
				</View>
			</ThemedView>
		)
	}

	return (
		<>
			<WaveFormLayout
				topSectionRender={topSectionRender}
				bottomSectionRender={bottomSectionRender}
				variant="forms"
			/>
			<Modal
				transparent
				visible={isLoading}
				animationType="fade"
				statusBarTranslucent
				navigationBarTranslucent
				onRequestClose={() => {}}
			>
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color={colors.primary_base} />
				</View>
			</Modal>
		</>
	)
}

const styles = StyleSheet.create({
	inputsAndReset: {
		paddingTop: 20,
	},
	inputsSection: {
		gap: 14,
		marginTop: 10,
	},
	inputGroup: {
		gap: 6,
	},
	loadingOverlay: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.25)",
	},
	inlineRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
		gap: 20,
	},
	actionsSection: {
		gap: 16,
		alignItems: "center",
		width: "100%",
	},
})
