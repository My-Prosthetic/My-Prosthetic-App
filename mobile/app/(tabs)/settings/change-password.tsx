import { useState } from "react"
import { Alert, Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from "react-native"
import { Redirect, router } from "expo-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { ThemedInput } from "@/src/components/ThemedInput"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"
import { AccountApiError, changeAccountPassword } from "@/src/services/settingsAccountService"
import PasswordInvalidIcon from "@/assets/icons/password-invalid.svg"
import PasswordValidIcon from "@/assets/icons/password-valid.svg"

export default function ChangePasswordScreen() {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { status } = useAuth()
	const { height } = useWindowDimensions()
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [saving, setSaving] = useState(false)
	const [attemptedSubmit, setAttemptedSubmit] = useState(false)
	const [showRequirements, setShowRequirements] = useState(false)
	const [showConfirmError, setShowConfirmError] = useState(false)

	const missingRequirements = [
		{
			key: "length",
			met: Array.from(newPassword).length >= 12,
			label: t("signup.passwordRules.minLength"),
		},
		{ key: "upper", met: /\p{Lu}/u.test(newPassword), label: t("signup.passwordRules.uppercase") },
		{ key: "lower", met: /\p{Ll}/u.test(newPassword), label: t("signup.passwordRules.lowercase") },
		{ key: "number", met: /\p{N}/u.test(newPassword), label: t("signup.passwordRules.number") },
		{
			key: "symbol",
			met: /[\p{P}\p{S}]/u.test(newPassword),
			label: t("signup.passwordRules.symbol"),
		},
		{
			key: "different",
			met: !currentPassword || newPassword !== currentPassword,
			label: t("settings34.password.sameAsCurrent"),
		},
	].filter((rule) => !rule.met)

	const newPasswordChecked = newPassword.length > 0 || attemptedSubmit
	const newPasswordInvalid = newPasswordChecked && missingRequirements.length > 0
	const newPasswordValid = newPassword.length > 0 && missingRequirements.length === 0
	const confirmChecked = confirmPassword.length > 0 || attemptedSubmit
	const confirmInvalid =
		confirmChecked && (confirmPassword.length === 0 || confirmPassword !== newPassword)
	const confirmValid =
		newPasswordValid && confirmPassword.length > 0 && confirmPassword === newPassword

	async function submit() {
		if (saving) return
		setAttemptedSubmit(true)
		if (!currentPassword || !newPassword || !confirmPassword) {
			Alert.alert(t("settings34.common.error"), t("settings34.password.required"))
			return
		}
		if (newPassword !== confirmPassword) {
			Alert.alert(t("settings34.common.error"), t("settings34.password.mismatch"))
			return
		}
		if (newPassword === currentPassword) {
			Alert.alert(t("settings34.common.error"), t("settings34.password.sameAsCurrent"))
			return
		}
		if (missingRequirements.length > 0) {
			setShowRequirements(true)
			return
		}

		setSaving(true)
		try {
			await changeAccountPassword(currentPassword, newPassword, confirmPassword)
			setCurrentPassword("")
			setNewPassword("")
			setConfirmPassword("")
			setAttemptedSubmit(false)
			setShowRequirements(false)
			setShowConfirmError(false)
			Alert.alert(t("settings34.password.successTitle"), t("settings34.password.successMessage"), [
				{ text: t("settings34.common.ok"), onPress: () => router.back() },
			])
		} catch (error: unknown) {
			const kind = error instanceof AccountApiError ? error.kind : "server"
			Alert.alert(t("settings34.common.error"), t(`settings34.api.${kind}`))
		} finally {
			setSaving(false)
		}
	}

	if (status === "GUEST" || status === "UNAUTHENTICATED") {
		return <Redirect href="/settings" />
	}

	return (
		<View style={[styles.screen, { backgroundColor: colors.blue2 }]}>
			<StatusBar barStyle="dark-content" backgroundColor={colors.blue2} />
			<WaveFormLayout
				variant="forms"
				topSectionRender={() => (
					<ThemedText variant="H0" colorName="bg_0" style={styles.title}>
						{t("settings34.password.title")}
					</ThemedText>
				)}
				bottomSectionRender={() => (
					<View style={styles.form}>
						<View style={styles.fieldGroup}>
							<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
								{t("settings34.password.current")}
							</ThemedText>
							<ThemedInput
								variant="password"
								value={currentPassword}
								onChangeText={setCurrentPassword}
								viewStyle={styles.input}
								placeholder=""
								autoComplete="current-password"
								accessibilityLabel={t("settings34.password.current")}
								editable={!saving}
							/>
						</View>

						<View style={[styles.fieldGroup, styles.nextField]}>
							<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
								{t("settings34.password.new")}
							</ThemedText>
							<View style={styles.inputWrapper}>
								<ThemedInput
									variant="password"
									value={newPassword}
									onChangeText={(value) => {
										setNewPassword(value)
										setShowRequirements(false)
									}}
									viewStyle={[styles.input, newPasswordInvalid && { borderColor: colors.false }]}
									textStyle={styles.inputWithIcon}
									placeholder=""
									autoComplete="new-password"
									accessibilityLabel={t("settings34.password.new")}
									editable={!saving}
								/>
								{newPasswordInvalid ? (
									<Pressable
										onPress={() => setShowRequirements((opened) => !opened)}
										accessibilityRole="button"
										accessibilityLabel={t("signup.passwordRequirements")}
										accessibilityState={{ expanded: showRequirements }}
										style={styles.feedbackIcon}
									>
										<PasswordInvalidIcon width={26} height={26} color={colors.false} />
									</Pressable>
								) : newPasswordValid ? (
									<View style={styles.feedbackIcon} pointerEvents="none">
										<PasswordValidIcon width={20} height={17} color={colors.true} />
									</View>
								) : null}
							</View>
							{newPasswordInvalid && showRequirements && (
								<ThemedView
									colorName="bg_0"
									style={[styles.requirementsBox, { borderColor: colors.false }]}
								>
									<ThemedText variant="H2" colorName="graphite0" style={styles.requirementsTitle}>
										{t("signup.passwordRequirements")}
									</ThemedText>
									{missingRequirements.map((rule) => (
										<View key={rule.key} style={styles.requirementRow}>
											<PasswordInvalidIcon width={15} height={15} color={colors.false} />
											<ThemedText variant="H4" colorName="graphite0" style={styles.requirementText}>
												{rule.label}
											</ThemedText>
										</View>
									))}
								</ThemedView>
							)}
						</View>

						<View style={[styles.fieldGroup, styles.nextField]}>
							<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
								{t("settings34.password.confirm")}
							</ThemedText>
							<View style={styles.inputWrapper}>
								<ThemedInput
									variant="password"
									value={confirmPassword}
									onChangeText={(value) => {
										setConfirmPassword(value)
										setShowConfirmError(false)
									}}
									viewStyle={[styles.input, confirmInvalid && { borderColor: colors.false }]}
									textStyle={styles.inputWithIcon}
									placeholder=""
									autoComplete="new-password"
									accessibilityLabel={t("settings34.password.confirm")}
									editable={!saving}
								/>
								{confirmInvalid ? (
									<Pressable
										onPress={() => setShowConfirmError((opened) => !opened)}
										accessibilityRole="button"
										accessibilityLabel={t("settings34.password.mismatch")}
										accessibilityState={{ expanded: showConfirmError }}
										style={styles.feedbackIcon}
									>
										<PasswordInvalidIcon width={26} height={26} color={colors.false} />
									</Pressable>
								) : confirmValid ? (
									<View style={styles.feedbackIcon} pointerEvents="none">
										<PasswordValidIcon width={20} height={17} color={colors.true} />
									</View>
								) : null}
							</View>
							{confirmInvalid && showConfirmError && (
								<ThemedView
									colorName="bg_0"
									style={[styles.requirementsBox, { borderColor: colors.false }]}
								>
									<ThemedText variant="H4" colorName="graphite0">
										{t("settings34.password.mismatch")}
									</ThemedText>
								</ThemedView>
							)}
						</View>

						<ThemedView
							variant="narrow"
							colorName="blue2"
							onPress={() => {
								void submit()
							}}
							disabled={saving}
							accessibilityLabel={t("settings34.password.save")}
							accessibilityState={{ disabled: saving, busy: saving }}
							style={[
								styles.button,
								{ marginTop: Math.max(72, height * 0.12), opacity: saving ? 0.6 : 1 },
							]}
						>
							<ThemedText variant="H3" colorName="bg_0" style={styles.buttonText}>
								{saving ? t("settings34.password.saving") : t("settings34.password.save")}
							</ThemedText>
						</ThemedView>
					</View>
				)}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	title: { fontSize: 24, lineHeight: 30, textTransform: "uppercase", textAlign: "right" },
	form: { paddingTop: 66, paddingHorizontal: "8%", paddingBottom: 40 },
	fieldGroup: { gap: 14 },
	nextField: { marginTop: 17 },
	fieldLabel: { fontSize: 13, lineHeight: 17, letterSpacing: 0.3 },
	input: { minHeight: 44, height: 44, borderRadius: 16 },
	inputWrapper: { position: "relative" },
	inputWithIcon: { paddingRight: 55 },
	feedbackIcon: {
		position: "absolute",
		right: 0,
		top: 0,
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	requirementsBox: {
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderWidth: 1,
		borderRadius: 14,
		marginTop: 2,
		gap: 8,
	},
	requirementsTitle: { marginBottom: 2 },
	requirementRow: { flexDirection: "row", alignItems: "center", gap: 9 },
	requirementText: { flex: 1, lineHeight: 18 },
	button: { minHeight: 50, borderRadius: 22 },
	buttonText: {
		fontFamily: "Montserrat-SemiBold",
		fontSize: 14,
		lineHeight: 20,
		textTransform: "uppercase",
	},
})
