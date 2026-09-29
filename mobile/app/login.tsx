import { useState } from "react"
import { StyleSheet, View, TextInput } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"
import { useTheme } from "@/context/ThemeContext"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

export default function LoginScreen() {
	const router = useRouter()
	const { t } = useTranslation()

	const { colors } = useTheme()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	const handleResetPassword = () => {}
	const handleLogin = () => {}
	const handleGoogleLogin = () => {}
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
					borderTopLeftRadius: 10000,
					justifyContent: "space-around",
					paddingHorizontal: 32,
				}}
			>
				<View style={styles.container}>
					{/* Sekcja pól formularza */}
					<View style={{ flex: 1, justifyContent: "flex-start" }}>
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
										onChangeText={setEmail}
										placeholder={t("signup.emailPlaceholder")}
										placeholderTextColor={colors.primary_base_1}
										keyboardType="email-address"
										autoCapitalize="none"
										style={{
											width: "100%",
											fontSize: 17,
											paddingLeft: 16,
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
										onChangeText={setPassword}
										placeholder="••••••••"
										placeholderTextColor={colors.primary_base_1}
										secureTextEntry
										autoCapitalize="none"
										autoCorrect={false}
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
								style={{ paddingLeft: 12 }}
							/>
							<ThemedText
								tx="login.reset"
								variant="tab1Category"
								colorName="primary_base"
								onPress={handleResetPassword}
								style={{ paddingLeft: 12, paddingVertical: 14 }}
							/>
						</View>
					</View>
					{/* Sekcja Przycisków Akcji */}
					<View style={styles.actionsSection}>
						{/* Przycisk ZALOGUJ */}
						<ThemedView variant="narrow" colorName="primary_base" shadow onPress={handleLogin}>
							<ThemedText tx="login.logIn" variant="main1Button" colorName="accent_base_1" />
						</ThemedView>

						{/* Przycisk Kontynuuj z Google */}
						<ThemedView
							variant="narrow"
							colorName="accent_base_2"
							shadow
							onPress={handleGoogleLogin}
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
								style={{ paddingLeft: 12, paddingVertical: 14 }}
							/>
						</View>
					</View>
				</View>
			</ThemedView>
		)
	}

	return (
		<WaveFormLayout
			topSectionRender={topSectionRender}
			bottomSectionRender={bottomSectionRender}
			variant="forms"
		/>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "space-between",
		paddingVertical: 10,
	},
	inputsSection: {
		gap: 14,
		marginTop: 10,
	},
	inputGroup: {
		gap: 6,
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
