import { useState } from "react"
import { ActivityIndicator, Modal, StyleSheet, TextInput, View } from "react-native"
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
		return <ThemedText tx="login.createAccount" colorName="accent_base" />
	}

	const bottomSectionRender = () => {
		return (
			<ThemedView
				colorName="tertiary_base_2"
				style={{
					flexBasis: "auto",
					flexShrink: 0,
					borderTopLeftRadius: 10000,
					justifyContent: "space-around",
					paddingBottom: 0,
					paddingHorizontal: 32,
				}}
			>
				<View style={[styles.container, { paddingTop: 20 }]}>
					{/* Sekcja pól formularza */}
					<View style={styles.inputsSection}>
						{/* Pole Imię */}
						<View style={styles.inputGroup}>
							<ThemedText
								tx="signup.firstName"
								variant="tab1Category"
								colorName="secondary_base_0c"
							/>
							<ThemedView
								variant="old_wide"
								colorName="tertiary_base_3"
								borderColor="secondary_base_0c"
								style={styles.themedInputWrapper}
							>
								<TextInput
									value={firstName}
									onChangeText={(value) => {
										setFirstName(value)
										setErrorMessage("")
									}}
									placeholder={t("signup.firstName")}
									placeholderTextColor={colors.primary_base_1}
									autoCapitalize="words"
									editable={!isSubmitting}
									style={[styles.input, { color: colors.primary_base }]}
								/>
							</ThemedView>
						</View>

						{/* Pole Nazwisko */}
						<View style={styles.inputGroup}>
							<ThemedText
								tx="signup.lastName"
								variant="tab1Category"
								colorName="secondary_base_0c"
							/>
							<ThemedView
								variant="old_wide"
								colorName="tertiary_base_3"
								borderColor="secondary_base_0c"
								style={styles.themedInputWrapper}
							>
								<TextInput
									value={lastName}
									onChangeText={(value) => {
										setLastName(value)
										setErrorMessage("")
									}}
									placeholder={t("signup.lastName")}
									placeholderTextColor={colors.primary_base_1}
									autoCapitalize="words"
									editable={!isSubmitting}
									style={[styles.input, { color: colors.primary_base }]}
								/>
							</ThemedView>
						</View>

						{/* Pole Email */}
						<View style={styles.inputGroup}>
							<ThemedText tx="login.email" variant="tab1Category" colorName="secondary_base_0c" />
							<ThemedView
								variant="old_wide"
								colorName="tertiary_base_3"
								borderColor="secondary_base_0c"
								style={styles.themedInputWrapper}
							>
								<TextInput
									value={email}
									onChangeText={(value) => {
										setEmail(value)
										setErrorMessage("")
									}}
									placeholder={t("signup.emailPlaceholder")}
									placeholderTextColor={colors.primary_base_1}
									keyboardType="email-address"
									autoCapitalize="none"
									editable={!isSubmitting}
									style={[styles.input, { color: colors.primary_base }]}
								/>
							</ThemedView>
						</View>

						{/* Pole Hasło */}
						<View style={styles.inputGroup}>
							<ThemedText
								tx="login.password"
								variant="tab1Category"
								colorName="secondary_base_0c"
							/>
							<ThemedView
								variant="old_wide"
								colorName="tertiary_base_3"
								borderColor="secondary_base_0c"
								style={styles.themedInputWrapper}
							>
								<TextInput
									value={password}
									onChangeText={(value) => {
										setPassword(value)
										setErrorMessage("")
									}}
									placeholder="••••••••"
									placeholderTextColor={colors.primary_base_1}
									secureTextEntry
									autoCapitalize="none"
									autoCorrect={false}
									editable={!isSubmitting}
									style={[styles.input, { color: colors.primary_base }]}
								/>
							</ThemedView>
							<View style={styles.requirementsSection}>
								<ThemedText
									tx="signup.passwordRequirements"
									variant="tab1Category"
									colorName="secondary_base_0c"
									style={styles.requirementsTitle}
								/>
								{sortedPasswordRules.map((rule) => (
									<View key={rule.id} style={styles.requirementRow}>
										<View
											style={[
												styles.requirementBullet,
												{
													backgroundColor: rule.valid ? colors.true : colors.primary_base_4,
													borderColor: rule.valid ? colors.true : colors.primary_base_3,
												},
											]}
										/>
										<ThemedText
											variant="body1Regular"
											colorName={rule.valid ? "true" : "secondary_base_0c"}
											style={styles.requirementText}
											tx={rule.label as ParseKeys}
										/>
									</View>
								))}
							</View>
						</View>

						{/* Pole Powtórz Hasło */}
						<View style={styles.inputGroup}>
							<ThemedText
								tx="signup.repeatPassword"
								variant="tab1Category"
								colorName="secondary_base_0c"
							/>
							<ThemedView
								variant="old_wide"
								colorName="tertiary_base_3"
								borderColor="secondary_base_0c"
								style={[styles.themedInputWrapper, styles.repeatPasswordWrapper]}
							>
								<TextInput
									value={repeatPassword}
									onChangeText={(value) => {
										setRepeatPassword(value)
										setErrorMessage("")
									}}
									placeholder="••••••••"
									placeholderTextColor={colors.primary_base_1}
									secureTextEntry
									autoCapitalize="none"
									autoCorrect={false}
									editable={!isSubmitting}
									style={[styles.input, { color: colors.primary_base, flex: 1 }]}
								/>
							</ThemedView>
						</View>
					</View>

					{/* Sekcja Przycisków Akcji */}
					<View style={styles.actionsSection}>
						{errorMessage ? (
							<ThemedText
								accessibilityRole="alert"
								variant="body1Regular"
								colorName="false"
								style={styles.errorMessage}
							>
								{errorMessage}
							</ThemedText>
						) : null}

						{/* Przycisk ZAREJESTRUJ */}
						<ThemedView
							variant="old_narrow"
							colorName="primary_base"
							shadow
							onPress={handleRegister}
							disabled={isSubmitting}
							accessibilityRole="button"
							accessibilityState={{
								disabled: isSubmitting,
								busy: isSubmitting,
							}}
						>
							<ThemedText tx="signup.register" variant="main1Button" colorName="accent_base_1" />
						</ThemedView>

						{/* Przycisk Kontynuuj z Google */}
						<ThemedView
							variant="old_narrow"
							colorName="accent_base_2"
							shadow
							onPress={handleGoogleLogin}
							disabled={isSubmitting}
						>
							<ThemedText
								tx="login.continueGoogle"
								variant="tab1Category"
								colorName="primary_base"
							/>
						</ThemedView>

						{/* Przycisk Kontynuuj z Facebook */}
						<ThemedView
							variant="old_narrow"
							colorName="accent_base_2"
							shadow
							onPress={handleFacebookLogin}
							disabled={isSubmitting}
						>
							<ThemedText
								tx="login.continueFacebook"
								variant="tab1Category"
								colorName="primary_base"
							/>
						</ThemedView>

						{/* Link powrotu do logowania */}
						<View style={[styles.inlineRow, styles.centerRow, { paddingBottom: 20 }]}>
							<ThemedText
								tx="login.alreadyHaveAccount"
								variant="tab1Category"
								colorName="secondary_base_0c"
							/>
							<ThemedText
								tx="login.logIn"
								variant="tab1Category"
								colorName="primary_base"
								onPress={handleLogin}
								disabled={isSubmitting}
								style={{ paddingLeft: 12 }}
							/>
						</View>
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
		paddingTop: 10,
		gap: 20,
	},
	inputsSection: {
		gap: 8,
		marginTop: 6,
	},
	inputGroup: {
		gap: 4,
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
	requirementText: {
		flexShrink: 1,
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
