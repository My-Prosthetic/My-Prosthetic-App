import { useState } from "react"
import { ActivityIndicator, Modal, StyleSheet, View, TextInput } from "react-native"
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
	const handleResetPassword = () => {}

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
		return <ThemedText tx="login.logIn" colorName="accent_base" />
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
					paddingHorizontal: 32,
				}}
			>
				<View style={styles.container}>
					{/* Sekcja pól formularza */}
					<View>
						<View style={styles.inputsSection}>
							{/* Pole Email */}
							<View style={styles.inputGroup}>
								<ThemedText tx="login.email" variant="tab1Category" colorName="secondary_base_0c" />
								<ThemedView
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={{
										borderWidth: 1,
										minHeight: 44,
										paddingVertical: 0,
										paddingHorizontal: 0,
										justifyContent: "flex-start",
									}}
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
										editable={!isLoading}
										style={{
											width: "100%",
											fontSize: 17,
											paddingLeft: 16,
											minHeight: 44,
											fontFamily: "Afacad-SemiBold",
										}}
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
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={{
										borderWidth: 1,
										minHeight: 44,
										paddingVertical: 0,
										paddingHorizontal: 0,
										justifyContent: "flex-start",
									}}
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
										editable={!isLoading}
										style={{ paddingLeft: 16, width: "100%" }}
									/>
								</ThemedView>
							</View>
						</View>
						{/* Link Reset Hasła */}
						<View style={styles.inlineRow}>
							<ThemedText
								tx="login.forgotPassword"
								variant="tab1Category"
								colorName="secondary_base_0c"
								onPress={handleResetPassword}
								disabled={isLoading}
								hitSlop={14}
								style={{ paddingLeft: 12, minHeight: 44, textAlignVertical: "center" }}
							/>
							<ThemedText
								tx="login.reset"
								variant="tab1Category"
								colorName="primary_base"
								onPress={handleResetPassword}
								disabled={isLoading}
								hitSlop={14}
								style={{ paddingLeft: 12, paddingVertical: 14, minHeight: 44 }}
							/>
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

						{/* Przycisk ZALOGUJ */}
						<ThemedView
							variant="narrow"
							colorName="primary_base"
							shadow
							onPress={handleLogin}
							disabled={isLoading}
							accessibilityRole="button"
							accessibilityState={{ disabled: isLoading, busy: isLoading }}
						>
							<ThemedText tx="login.logIn" variant="main1Button" colorName="accent_base_1" />
						</ThemedView>

						{/* Przycisk Kontynuuj z Google */}
						<ThemedView
							variant="narrow"
							colorName="accent_base_2"
							shadow
							onPress={handleGoogleLogin}
							disabled={isLoading}
						>
							<ThemedText
								tx="login.continueGoogle"
								variant="tab1Category"
								colorName="primary_base"
							/>
						</ThemedView>

						{/* Przycisk Kontynuuj z Facebook */}
						<ThemedView
							variant="narrow"
							colorName="accent_base_2"
							shadow
							onPress={handleFacebookLogin}
							disabled={isLoading}
						>
							<ThemedText
								tx="login.continueFacebook"
								variant="tab1Category"
								colorName="primary_base"
							/>
						</ThemedView>

						{/* Link do rejestracji konta */}
						<View style={[styles.inlineRow, styles.centerRow]}>
							<ThemedText
								tx="login.noAccount"
								variant="tab1Category"
								colorName="secondary_base_0c"
								style={{ paddingLeft: 12 }}
							/>
							<ThemedText
								tx="login.createAccount"
								variant="tab1Category"
								colorName="primary_base"
								onPress={handleSignUp}
								disabled={isLoading}
								hitSlop={14}
								style={{ paddingLeft: 12, paddingVertical: 14, minHeight: 44 }}
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
	container: {
		flexGrow: 1,
		flexShrink: 0,
		justifyContent: "flex-start",
		paddingVertical: 10,
	},
	inputsSection: {
		gap: 14,
		marginTop: 10,
	},
	inputGroup: {
		gap: 6,
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
	},
	actionsSection: {
		gap: 12,
		alignItems: "center",
		width: "100%",
	},
})
