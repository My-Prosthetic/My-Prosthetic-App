import { useEffect, useRef, useState } from "react"
import {
	ActivityIndicator,
	AppState,
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
	useWindowDimensions,
} from "react-native"
import { useRouter } from "expo-router"
import Storage from "expo-sqlite/kv-store"
import { useTranslation } from "react-i18next"
import { ThemedInput } from "@/src/components/ThemedInput"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import PasswordInvalidIcon from "@/assets/icons/password-invalid.svg"
import PasswordValidIcon from "@/assets/icons/password-valid.svg"
import { useTheme } from "@/context/ThemeContext"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"
import { isValidEmail } from "@/src/utils/emailValidation"
import { getPasswordRequirements } from "@/src/utils/passwordRequirements"
import { passwordResetService, PasswordResetError } from "@/src/services/passwordResetService"

type Step = "email" | "password" | "success"
type PersistedFlow = { email: string; expiresAt: number; resendAfter: number }
const STORAGE_KEY = "myprosthetic.passwordReset.flow.v1"

const formatRemaining = (milliseconds: number): string => {
	const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
	return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

export default function ResetPasswordScreen() {
	const router = useRouter()
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { height } = useWindowDimensions()
	const [step, setStep] = useState<Step>("email")
	const [email, setEmail] = useState("")
	const [code, setCode] = useState("")
	const [password, setPassword] = useState("")
	const [confirmation, setConfirmation] = useState("")
	const [expiresAt, setExpiresAt] = useState(0)
	const [resendAfter, setResendAfter] = useState(0)
	const [now, setNow] = useState(() => Date.now())
	const [pending, setPending] = useState<"send" | "verify" | "reset" | null>(null)
	const busy = pending !== null
	const inFlight = useRef(false)
	const currentCode = useRef("")
	const checkedCodes = useRef(
		new Map<string, "valid" | "invalidCode" | "network" | "rateLimited">()
	)
	const [verifiedCode, setVerifiedCode] = useState<string | null>(null)
	const [appActive, setAppActive] = useState(AppState.currentState === "active")
	const [errorKey, setErrorKey] = useState<
		"invalidEmail" | "invalidCode" | "invalidPassword" | "rateLimited" | "network" | null
	>(null)
	const [loaded, setLoaded] = useState(false)
	const [attemptedSubmit, setAttemptedSubmit] = useState(false)
	const [showConfirmError, setShowConfirmError] = useState(false)

	useEffect(() => {
		let mounted = true
		void Storage.getItem(STORAGE_KEY)
			.then((raw) => {
				if (!mounted || !raw) return
				const saved: Partial<PersistedFlow> | null = JSON.parse(raw)
				if (
					!saved ||
					typeof saved.email !== "string" ||
					!isValidEmail(saved.email) ||
					typeof saved.expiresAt !== "number" ||
					!Number.isFinite(saved.expiresAt) ||
					typeof saved.resendAfter !== "number" ||
					!Number.isFinite(saved.resendAfter) ||
					saved.expiresAt <= Date.now()
				)
					return
				setEmail(saved.email)
				setExpiresAt(saved.expiresAt)
				setResendAfter(saved.resendAfter)
				setNow(Date.now())
				setStep("password")
			})
			.catch((error: unknown) => console.warn("Could not restore password reset flow", error))
			.finally(() => {
				if (mounted) setLoaded(true)
			})
		return () => {
			mounted = false
		}
	}, [])

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000)
		const subscription = AppState.addEventListener("change", (state) => {
			setAppActive(state === "active")
			if (state === "active") setNow(Date.now())
		})
		return () => {
			clearInterval(timer)
			subscription.remove()
		}
	}, [])

	const secondsLeft = Math.max(0, expiresAt - now)
	const codeExpired = expiresAt !== 0 && secondsLeft <= 0
	const canResend = now >= resendAfter
	const passwordRules = getPasswordRequirements(password, confirmation)
	const missingRequirements = passwordRules.filter((rule) => !rule.valid)
	const passwordValid = missingRequirements.length === 0
	const newPasswordChecked = password.length > 0 || attemptedSubmit
	const newPasswordInvalid = newPasswordChecked && missingRequirements.length > 0
	const newPasswordValid = password.length > 0 && !newPasswordInvalid
	const confirmChecked = confirmation.length > 0 || attemptedSubmit
	const confirmInvalid = confirmChecked && (confirmation.length === 0 || confirmation !== password)
	const confirmValid = newPasswordValid && confirmation.length > 0 && confirmation === password
	const codeVerified = verifiedCode === code && !codeExpired
	const codeInvalid = errorKey === "invalidCode" || codeExpired
	useEffect(() => {
		if (
			step !== "password" ||
			!appActive ||
			pending ||
			!/^\d{6}$/.test(code) ||
			Date.now() >= expiresAt ||
			checkedCodes.current.has(code)
		)
			return

		const timer = setTimeout(() => {
			if (
				inFlight.current ||
				Date.now() >= expiresAt ||
				currentCode.current !== code ||
				checkedCodes.current.has(code) ||
				AppState.currentState !== "active"
			)
				return
			inFlight.current = true
			setPending("verify")
			setErrorKey(null)
			void passwordResetService
				.verifyCode(email, code)
				.then(() => {
					checkedCodes.current.set(code, "valid")
					if (currentCode.current === code && Date.now() < expiresAt) setVerifiedCode(code)
				})
				.catch((error: unknown) => {
					const reason = error instanceof PasswordResetError ? error.code : "network"
					checkedCodes.current.set(
						code,
						reason === "invalidCode" || reason === "rateLimited" ? reason : "network"
					)
					if (currentCode.current === code) setErrorKey(reason)
				})
				.finally(() => {
					inFlight.current = false
					setPending(null)
				})
		}, 700)
		return () => clearTimeout(timer)
	}, [appActive, code, email, expiresAt, pending, step])

	const showError = (error: unknown) => {
		setErrorKey(error instanceof PasswordResetError ? error.code : "network")
	}

	const sendCode = async () => {
		if (inFlight.current || !loaded || Date.now() < resendAfter) return
		const normalized = email.trim().toLowerCase()
		if (normalized.length > 255 || !isValidEmail(normalized)) {
			setErrorKey("invalidEmail")
			return
		}
		inFlight.current = true
		setPending("send")
		setErrorKey(null)
		try {
			const result = await passwordResetService.requestCode(normalized)
			const flow: PersistedFlow = {
				email: normalized,
				expiresAt: Date.parse(result.expires_at),
				resendAfter: Date.parse(result.resend_after),
			}
			if (!Number.isFinite(flow.expiresAt) || !Number.isFinite(flow.resendAfter)) {
				throw new PasswordResetError("network")
			}
			await Storage.setItem(STORAGE_KEY, JSON.stringify(flow)).catch((error: unknown) =>
				console.warn("Could not save password reset flow", error)
			)
			setEmail(normalized)
			currentCode.current = ""
			checkedCodes.current.clear()
			setVerifiedCode(null)
			setCode("")
			setPassword("")
			setConfirmation("")
			setAttemptedSubmit(false)
			setShowConfirmError(false)
			setExpiresAt(flow.expiresAt)
			setResendAfter(flow.resendAfter)
			setNow(Date.now())
			setStep("password")
		} catch (error) {
			showError(error)
		} finally {
			inFlight.current = false
			setPending(null)
		}
	}

	const submitPassword = async () => {
		if (inFlight.current || Date.now() >= expiresAt) {
			setNow(Date.now())
			return
		}
		setAttemptedSubmit(true)
		if (!/^\d{6}$/.test(code) || checkedCodes.current.get(code) === "invalidCode") {
			setErrorKey("invalidCode")
			return
		}
		if (!passwordValid) {
			setErrorKey("invalidPassword")
			return
		}
		inFlight.current = true
		setPending("reset")
		setErrorKey(null)
		if (!checkedCodes.current.has(code)) checkedCodes.current.set(code, "network")
		try {
			await passwordResetService.resetPassword(email, code, password, confirmation)
			await Storage.removeItem(STORAGE_KEY).catch((error: unknown) =>
				console.warn("Could not clear password reset flow", error)
			)
			setCode("")
			currentCode.current = ""
			checkedCodes.current.clear()
			setVerifiedCode(null)
			setPassword("")
			setConfirmation("")
			setAttemptedSubmit(false)
			setShowConfirmError(false)
			setStep("success")
		} catch (error) {
			showError(error)
			if (error instanceof PasswordResetError && error.code === "invalidCode") {
				checkedCodes.current.set(code, "invalidCode")
				setVerifiedCode(null)
			}
		} finally {
			inFlight.current = false
			setPending(null)
		}
	}

	const renderStatus = () =>
		errorKey ? (
			<ThemedText accessibilityRole="alert" variant="H4" colorName="false" style={styles.error}>
				{t(`passwordReset.errors.${errorKey}`)}
			</ThemedText>
		) : null

	const renderContent = () => (
		<ScrollView
			contentContainerStyle={styles.form}
			keyboardShouldPersistTaps="handled"
			showsVerticalScrollIndicator={false}
		>
			{step === "email" && (
				<>
					<View style={styles.fieldGroup}>
						<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
							{t("passwordReset.emailLabel")}
						</ThemedText>
						<ThemedInput
							variant="email"
							value={email}
							placeholder=""
							accessibilityLabel={t("passwordReset.emailLabel")}
							autoComplete="email"
							autoCorrect={false}
							returnKeyType="send"
							onSubmitEditing={sendCode}
							editable={!busy && loaded}
							viewStyle={styles.input}
							onChangeText={(value) => {
								setEmail(value)
								setErrorKey(null)
							}}
						/>
					</View>
					<ThemedText variant="H4" colorName="blue2" style={styles.emailInfo}>
						{t("passwordReset.emailIntro")}
					</ThemedText>
					{renderStatus()}
					<View style={{ marginTop: Math.max(72, height * 0.12) }}>
						<ActionButton
							disabled={busy || !loaded || !canResend}
							busy={pending === "send"}
							onPress={sendCode}
							label={t("passwordReset.sendCode")}
						/>
					</View>
				</>
			)}
			{step === "password" && (
				<>
					<View style={styles.fieldGroup}>
						<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
							{t("passwordReset.codeIntro")}
						</ThemedText>
						<ThemedText variant="H4" colorName="blue2" style={styles.emailAddress}>
							{email}
						</ThemedText>
						<View style={styles.inputWrapper}>
							<ThemedInput
								variant="regular"
								value={code}
								maxLength={6}
								secureTextEntry
								keyboardType="number-pad"
								autoComplete="one-time-code"
								textContentType="oneTimeCode"
								autoCapitalize="none"
								autoCorrect={false}
								accessibilityLabel={t("passwordReset.codeLabel")}
								editable={pending !== "send" && pending !== "reset" && !codeExpired}
								viewStyle={[styles.input, codeInvalid && { borderColor: colors.false }]}
								textStyle={styles.inputWithIcon}
								onChangeText={(value) => {
									const next = value.replace(/\D/g, "").slice(0, 6)
									currentCode.current = next
									setCode(next)
									const checked = checkedCodes.current.get(next)
									setVerifiedCode(checked === "valid" ? next : null)
									setErrorKey(checked && checked !== "valid" ? checked : null)
								}}
							/>
							{codeVerified ? (
								<FieldConfirmation label={t("passwordReset.codeVerified")} />
							) : codeInvalid ? (
								<View style={styles.feedbackIcon} pointerEvents="none">
									<PasswordInvalidIcon width={26} height={26} color={colors.false} />
								</View>
							) : null}
							{pending === "verify" && (
								<View pointerEvents="none" style={styles.feedbackIcon}>
									<ActivityIndicator
										color={colors.blue2}
										accessibilityLabel={t("passwordReset.loading")}
									/>
								</View>
							)}
						</View>
					</View>

					<View style={[styles.fieldGroup, styles.nextField]}>
						<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
							{t("passwordReset.newPassword")}
						</ThemedText>
						<View style={styles.inputWrapper}>
							<ThemedInput
								variant="password"
								value={password}
								placeholder=""
								accessibilityLabel={t("passwordReset.newPassword")}
								autoComplete="new-password"
								textContentType="newPassword"
								editable={pending !== "send" && pending !== "reset"}
								viewStyle={[styles.input, newPasswordInvalid && { borderColor: colors.false }]}
								textStyle={styles.inputWithIcon}
								onChangeText={(value) => {
									setPassword(value)
									if (errorKey === "invalidPassword") setErrorKey(null)
								}}
							/>
							{newPasswordInvalid ? (
								<View style={styles.feedbackIcon} pointerEvents="none">
									<PasswordInvalidIcon width={26} height={26} color={colors.false} />
								</View>
							) : newPasswordValid ? (
								<FieldConfirmation label={t("passwordReset.newPassword")} />
							) : null}
						</View>
						{(password.length > 0 || confirmation.length > 0) && (
							<ThemedView
								colorName="bg_0"
								style={[styles.requirementsBox, { borderColor: colors.blue1 }]}
							>
								<ThemedText variant="H2" colorName="graphite0" style={styles.requirementsTitle}>
									{t("signup.passwordRequirements")}
								</ThemedText>
								{passwordRules.map((rule) => (
									<View key={rule.id} style={styles.requirementRow}>
										{rule.valid ? (
											<PasswordValidIcon width={15} height={15} color={colors.true} />
										) : (
											<PasswordInvalidIcon width={15} height={15} color={colors.false} />
										)}
										<ThemedText variant="H4" colorName="graphite0" style={styles.requirementText}>
											{t(rule.label)}
										</ThemedText>
									</View>
								))}
							</ThemedView>
						)}
					</View>

					<View style={[styles.fieldGroup, styles.nextField]}>
						<ThemedText variant="H1" colorName="blue2" style={styles.fieldLabel}>
							{t("passwordReset.repeatPassword")}
						</ThemedText>
						<View style={styles.inputWrapper}>
							<ThemedInput
								variant="password"
								value={confirmation}
								placeholder=""
								accessibilityLabel={t("passwordReset.repeatPassword")}
								autoComplete="new-password"
								textContentType="newPassword"
								returnKeyType="done"
								onSubmitEditing={submitPassword}
								editable={pending !== "send" && pending !== "reset"}
								viewStyle={[styles.input, confirmInvalid && { borderColor: colors.false }]}
								textStyle={styles.inputWithIcon}
								onChangeText={(value) => {
									setConfirmation(value)
									setShowConfirmError(false)
									if (errorKey === "invalidPassword") setErrorKey(null)
								}}
							/>
							{confirmInvalid ? (
								<Pressable
									onPress={() => setShowConfirmError((opened) => !opened)}
									accessibilityRole="button"
									accessibilityLabel={t("settings.password.mismatch")}
									accessibilityState={{ expanded: showConfirmError }}
									style={styles.feedbackIcon}
								>
									<PasswordInvalidIcon width={26} height={26} color={colors.false} />
								</Pressable>
							) : confirmValid ? (
								<FieldConfirmation label={t("signup.passwordRules.match")} />
							) : null}
						</View>
						{confirmInvalid && showConfirmError && (
							<ThemedView
								colorName="bg_0"
								style={[styles.requirementsBox, { borderColor: colors.false }]}
							>
								<ThemedText variant="H4" colorName="graphite0">
									{t("settings.password.mismatch")}
								</ThemedText>
							</ThemedView>
						)}
					</View>

					<View style={styles.codeStatus}>
						<ThemedText
							variant="H4"
							colorName={codeExpired ? "false" : "blue2"}
							style={styles.statusText}
						>
							{codeExpired
								? t("passwordReset.expired")
								: t("passwordReset.timeLeft", { time: formatRemaining(secondsLeft) })}
						</ThemedText>
						<ThemedView
							onPress={sendCode}
							disabled={!canResend || busy}
							accessibilityState={{ disabled: !canResend || busy }}
							style={styles.resend}
						>
							<ThemedText variant="H4" colorName="blue2" style={styles.statusText}>
								{canResend
									? t("passwordReset.resend")
									: t("passwordReset.resendIn", { time: formatRemaining(resendAfter - now) })}
							</ThemedText>
						</ThemedView>
					</View>
					{renderStatus()}
					<View style={{ marginTop: Math.max(72, height * 0.12) }}>
						<ActionButton
							disabled={busy || codeExpired}
							busy={pending === "reset" || pending === "send"}
							onPress={submitPassword}
							label={t("passwordReset.savePassword")}
						/>
					</View>
				</>
			)}
			{step === "success" && (
				<View style={styles.success}>
					<ThemedText accessibilityRole="alert" variant="H4" colorName="true">
						{t("passwordReset.success")}
					</ThemedText>
					<ActionButton onPress={() => router.replace("/login")} label={t("passwordReset.login")} />
				</View>
			)}
		</ScrollView>
	)

	return (
		<View style={[styles.screen, { backgroundColor: colors.blue2 }]}>
			<StatusBar barStyle="dark-content" backgroundColor={colors.blue2} />
			<WaveFormLayout
				variant="forms"
				topSectionRender={() => (
					<ThemedText variant="H0" colorName="bg_0" style={styles.title}>
						{t("passwordReset.title")}
					</ThemedText>
				)}
				bottomSectionRender={renderContent}
			/>
		</View>
	)
}

function FieldConfirmation({ label }: { label: string }) {
	const { colors } = useTheme()
	return (
		<View pointerEvents="none" accessible accessibilityLabel={label} style={styles.feedbackIcon}>
			<PasswordValidIcon width={20} height={17} color={colors.true} />
		</View>
	)
}

function ActionButton({
	onPress,
	label,
	disabled = false,
	busy = false,
}: {
	onPress: () => void | Promise<void>
	label: string
	disabled?: boolean
	busy?: boolean
}) {
	const { colors } = useTheme()
	return (
		<ThemedView
			variant="narrow"
			colorName="blue2"
			onPress={onPress}
			disabled={disabled}
			accessibilityState={{ disabled, busy }}
			accessibilityLabel={label}
			style={[styles.button, { opacity: disabled ? 0.6 : 1 }]}
		>
			{busy ? (
				<ActivityIndicator color={colors.bg_0} />
			) : (
				<ThemedText variant="H3" colorName="bg_0" style={styles.buttonText}>
					{label}
				</ThemedText>
			)}
		</ThemedView>
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
	emailInfo: { marginTop: 22 },
	emailAddress: { marginTop: -7 },
	codeStatus: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22 },
	statusText: { fontSize: 12, lineHeight: 16, flexShrink: 1 },
	resend: { minHeight: 44, flex: 1, alignItems: "flex-end", justifyContent: "center" },
	button: { minHeight: 50, borderRadius: 22 },
	buttonText: {
		fontFamily: "Montserrat-SemiBold",
		fontSize: 14,
		lineHeight: 20,
		textTransform: "uppercase",
	},
	error: { marginTop: 12 },
	success: { gap: 24 },
})
