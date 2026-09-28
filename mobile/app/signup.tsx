import { useState } from "react"
import { View, TextInput, StyleSheet, ScrollView } from "react-native"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"
import { useTheme } from "@/context/ThemeContext"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
export default function SignUpScreen() {
	const router = useRouter()
	const { t } = useTranslation()
	const { colors } = useTheme()

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [repeatPassword, setRepeatPassword] = useState("")

	const handleRegister = () => {}
	const handleGoogleLogin = () => {}
	const handleFacebookLogin = () => {}
	const handleSignIn = () => {
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
					borderTopLeftRadius: 10000,
					justifyContent: "space-around",
					paddingBottom: 0,
					paddingHorizontal: 32,
				}}
			>
				<ScrollView showsVerticalScrollIndicator={false}>
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
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={styles.themedInputWrapper}
								>
									<TextInput
										value={firstName}
										onChangeText={setFirstName}
										placeholder={t("signup.firstName")}
										placeholderTextColor={colors.primary_base_1}
										autoCapitalize="words"
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
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={styles.themedInputWrapper}
								>
									<TextInput
										value={lastName}
										onChangeText={setLastName}
										placeholder="Nazwisko"
										placeholderTextColor={colors.primary_base_1}
										autoCapitalize="words"
										style={[styles.input, { color: colors.primary_base }]}
									/>
								</ThemedView>
							</View>

							{/* Pole Email */}
							<View style={styles.inputGroup}>
								<ThemedText tx="login.email" variant="tab1Category" colorName="secondary_base_0c" />
								<ThemedView
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={styles.themedInputWrapper}
								>
									<TextInput
										value={email}
										onChangeText={setEmail}
										placeholder="adresmailowy@email.com"
										placeholderTextColor={colors.primary_base_1}
										keyboardType="email-address"
										autoCapitalize="none"
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
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={styles.themedInputWrapper}
								>
									<TextInput
										value={password}
										onChangeText={setPassword}
										placeholder="••••••••"
										placeholderTextColor={colors.primary_base_1}
										secureTextEntry
										style={[styles.input, { color: colors.primary_base }]}
									/>
								</ThemedView>
							</View>

							{/* Pole Powtórz Hasło */}
							<View style={styles.inputGroup}>
								<ThemedText
									tx="signup.repeatPassword"
									variant="tab1Category"
									colorName="secondary_base_0c"
								/>
								<ThemedView
									variant="wide"
									colorName="tertiary_base_3"
									borderColor="secondary_base_0c"
									style={[styles.themedInputWrapper, styles.repeatPasswordWrapper]}
								>
									<TextInput
										value={repeatPassword}
										onChangeText={setRepeatPassword}
										placeholder="••••••••"
										placeholderTextColor={colors.primary_base_1}
										secureTextEntry
										style={[styles.input, { color: colors.primary_base, flex: 1 }]}
									/>
									{/* <Ionicons
                    name="checkmark"
                    size={22}
                    color={colors.true}
                  /> */}
								</ThemedView>
							</View>
						</View>

						{/* Sekcja Przycisków Akcji */}
						<View style={styles.actionsSection}>
							{/* Przycisk ZAREJESTRUJ */}
							<ThemedView variant="narrow" colorName="primary_base" shadow onPress={handleRegister}>
								<ThemedText tx="signup.register" variant="main1Button" colorName="accent_base_1" />
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

							{/* Link powrotu do logowania */}
							<View style={[styles.inlineRow, styles.centerRow, { paddingBottom: 20 }]}>
								<ThemedText
									tx="login.alreadyHaveAccount"
									variant="tab1Category"
									colorName="secondary_base_0c"
									style={{ paddingLeft: 12 }}
								/>
								<ThemedText
									tx="login.logIn"
									variant="tab1Category"
									colorName="primary_base"
									onPress={handleSignIn}
									style={{ paddingLeft: 12 }}
								/>
							</View>
						</View>
					</View>
				</ScrollView>
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
		paddingTop: 10,
	},
	inputsSection: {
		gap: 8,
		marginTop: 6,
	},
	inputGroup: {
		gap: 4,
	},
	themedInputWrapper: {
		borderWidth: 1,
		minHeight: 40,
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
		paddingTop: 30,
		gap: 16,
		alignItems: "center",
		width: "100%",
	},
})
