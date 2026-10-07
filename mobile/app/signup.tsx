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
import { ParseKeys } from "i18next"
import { isValidEmail } from "@/src/utils/emailValidation"
import { ThemedInput } from "@/src/components/ThemedInput"

const getPasswordRequirements = (value: string, repeatedValue: string) => {
	const hasMinLength = value.length >= 8
	const hasUppercase = /[A-Z]/.test(value)
	const hasLowercase = /[a-z]/.test(value)
	const hasNumber = /\d/.test(value)
	const hasSymbol = /[^A-Za-z0-9]/.test(value)
	const passwordsMatch = value.length > 0 && value === repeatedValue

	return [
		{ id: "minLength", label: "signup.passwordRules.minLength", valid: hasMinLength },
		{ id: "uppercase", label: "signup.passwordRules.uppercase", valid: hasUppercase },
		{ id: "lowercase", label: "signup.passwordRules.lowercase", valid: hasLowercase },
		{ id: "number", label: "signup.passwordRules.number", valid: hasNumber },
		{ id: "symbol", label: "signup.passwordRules.symbol", valid: hasSymbol },
		{ id: "match", label: "signup.passwordRules.match", valid: passwordsMatch },
	]
}

export default function SignUpScreen() {
	const router = useRouter()
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { loginWithToken } = useAuth()

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [repeatPassword, setRepeatPassword] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState("")

	const passwordRules = getPasswordRequirements(password, repeatPassword)
	const sortedPasswordRules = [...passwordRules].sort((a, b) => Number(a.valid) - Number(b.valid))
	const isPasswordValid = passwordRules.every((rule) => rule.valid)

	const getValidationMessage = () => {
		const trimmedFirstName = firstName.trim()
		const trimmedLastName = lastName.trim()
		const trimmedEmail = email.trim()

		if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !password || !repeatPassword) {
			return t("signup.validation.required")
		}

		if (`${trimmedFirstName} ${trimmedLastName}`.length > 255) {
			return t("signup.validation.nameTooLong")
		}

		if (trimmedEmail.length > 255 || !isValidEmail(trimmedEmail)) {
			return t("signup.validation.invalidEmail")
		}

		if (!isPasswordValid) {
			return password !== repeatPassword
				? t("signup.validation.passwordMismatch")
				: t("signup.validation.passwordInvalid")
		}

		return null
	}

	const handleRegister = async () => {
		if (isSubmitting) return

		const validationMessage = getValidationMessage()
		if (validationMessage) {
			setErrorMessage(validationMessage)
			return
		}

		setIsSubmitting(true)
		setErrorMessage("")
		try {
			const result = await authService.register({
				name: `${firstName.trim()} ${lastName.trim()}`.trim(),
				email,
				password,
				password_confirmation: repeatPassword,
			})
			if (!(await loginWithToken(result.token))) return
			const apiFirstName = result.data.name.trim().split(/\s+/)[0] ?? ""
			await createUser({ name: apiFirstName })
		} catch (error) {
			setErrorMessage(
				t(error instanceof AuthApiError ? error.translationKey : "auth.errors.unexpected")
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	//TODO
	const handleGoogleLogin = () => {}
	//TODO
	const handleFacebookLogin = () => {}

	const handleLogin = () => {
		router.push("../login")
	}

	const topSectionRender = () => {
		return (
			<ThemedText
				tx="login.createAccount"
				variant="H0"
				colorName="bg_0"
				numberOfLines={1}
				style={{ textTransform: "uppercase", flexShrink: 0 }}
			/>
		)
	}

	const bottomSectionRender = () => {
		return (
			<ThemedView variant="background" colorName="bg_0" style={styles.container}>
				{/* Sekcja pól formularza */}
				<View style={styles.inputsSection}>
					{/* Pole Imię */}
					<View style={styles.inputGroup}>
						<ThemedText tx="signup.firstName" variant="H1" colorName="blue2" />
						<ThemedInput
							variant="regular"
							value={firstName}
							onChangeText={(value) => {
								setFirstName(value)
								setErrorMessage("")
							}}
							placeholder={t("signup.firstName")}
							editable={!isSubmitting}
						/>
					</View>

					{/* Pole Nazwisko */}
					<View style={styles.inputGroup}>
						<ThemedText tx="signup.lastName" variant="H1" colorName="blue2" />
						<ThemedInput
							variant="regular"
							value={lastName}
							onChangeText={(value) => {
								setLastName(value)
								setErrorMessage("")
							}}
							placeholder={t("signup.lastName")}
							editable={!isSubmitting}
						/>
					</View>

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
							editable={!isSubmitting}
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
							editable={!isSubmitting}
						/>

						<View style={styles.requirementsSection}>
							<ThemedText
								tx="signup.passwordRequirements"
								variant="H1"
								colorName="blue2"
								style={styles.requirementsTitle}
							/>
							{sortedPasswordRules.map((rule) => (
								<View key={rule.id} style={styles.requirementRow}>
									<View
										style={[
											styles.requirementBullet, //TODO nowa logika wyświetlania
											{
												backgroundColor: rule.valid ? colors.true : colors.primary_base_4,
												borderColor: rule.valid ? colors.true : colors.primary_base_3,
											},
										]}
									/>
									<ThemedText
										variant="H2"
										colorName={rule.valid ? "true" : "blue2"}
										tx={rule.label as ParseKeys}
									/>
								</View>
							))}
						</View>
					</View>

					{/* Pole Powtórz Hasło */}
					<View style={styles.inputGroup}>
						<ThemedText tx="signup.repeatPassword" variant="H1" colorName="blue2" />
						<ThemedInput
							variant="password"
							value={repeatPassword}
							onChangeText={(value) => {
								setRepeatPassword(value)
								setErrorMessage("")
							}}
							editable={!isSubmitting}
						/>
					</View>
				</View>

				{/* Sekcja Przycisków Akcji */}
				<View style={styles.actionsSection}>
					{errorMessage ? (
						<ThemedText
							accessibilityRole="alert"
							variant="H3"
							colorName="false"
							style={styles.errorMessage}
						>
							{errorMessage}
						</ThemedText>
					) : null}

					{/* Przycisk ZAREJESTRUJ */}
					<ThemedView
						variant="narrow"
						colorName="blue2"
						onPress={handleRegister}
						disabled={isSubmitting}
						accessibilityState={{
							disabled: isSubmitting,
							busy: isSubmitting,
						}}
					>
						<ThemedText tx="signup.register" variant="H1" colorName="bg_0" />
					</ThemedView>

					{/* Przycisk Kontynuuj z Google */}
					<ThemedView
						variant="narrow"
						colorName="blue0"
						onPress={handleGoogleLogin}
						disabled={isSubmitting}
						accessibilityState={{
							disabled: isSubmitting,
							busy: isSubmitting,
						}}
					>
						<ThemedText tx="login.continueGoogle" variant="H1" colorName="blue2" />
					</ThemedView>

					{/* Przycisk Kontynuuj z Facebook */}
					<ThemedView
						variant="narrow"
						colorName="blue0"
						onPress={handleFacebookLogin}
						disabled={isSubmitting}
						accessibilityState={{
							disabled: isSubmitting,
							busy: isSubmitting,
						}}
					>
						<ThemedText tx="login.continueFacebook" variant="H1" colorName="blue2" />
					</ThemedView>

					{/* Link powrotu do logowania */}
					<View style={styles.inlineRow}>
						<ThemedText tx="login.alreadyHaveAccount" variant="H3" colorName="blue2" />
						<ThemedText
							tx="login.logIn2"
							variant="H3"
							colorName="magenta0"
							onPress={handleLogin}
							disabled={isSubmitting}
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
				visible={isSubmitting}
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
	container: {
		flexGrow: 1,
		flexShrink: 0,
		justifyContent: "space-between",
		paddingTop: 40,
		gap: 20,
		borderTopLeftRadius: 10000,
	},
	inputsSection: {
		gap: 12,
		marginTop: 6,
	},
	inputGroup: {
		gap: 8,
	},
	requirementsSection: {
		marginTop: 4,
		paddingLeft: 4,
		gap: 6,
	},
	requirementsTitle: {
		marginBottom: 2,
	},
	requirementRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	requirementBullet: {
		width: 8,
		height: 8,
		borderRadius: 999,
		borderWidth: 1,
	},
	themedInputWrapper: {
		borderWidth: 1,
		minHeight: 44,
		paddingVertical: 0,
		paddingHorizontal: 0,
		justifyContent: "center",
		borderRadius: 12,
	},
	repeatPasswordWrapper: {
		flexDirection: "row",
		alignItems: "center",
		paddingRight: 14,
	},
	input: {
		width: "100%",
		fontSize: 16,
		paddingLeft: 16,
		fontFamily: "Afacad-SemiBold",
	},
	errorMessage: {
		width: "100%",
		fontSize: 14,
		textAlign: "center",
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
		gap: 40,
	},
	centerRow: {
		justifyContent: "center",
		paddingLeft: 0,
		marginTop: 6,
	},
	actionsSection: {
		gap: 16,
		alignItems: "center",
		width: "100%",
	},
})
