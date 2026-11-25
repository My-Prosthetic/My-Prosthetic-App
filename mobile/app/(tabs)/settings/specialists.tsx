import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useTheme } from "@/context/ThemeContext"
import { router } from "expo-router"
import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconChatMessage from "@/assets/icons/chat-message.svg"
import IconPencil from "@/assets/icons/pencil.svg"
import IconCheck from "@/assets/icons/check.svg"
import { useShares } from "@/src/hooks/useShares"
import type { Share } from "@/src/services/sharesApi"
import { SharePermissionsModal } from "@/src/components/settings/SharePermissionsModal"
import { useEffect, useState } from "react"
import { getAllProstheses } from "@/db/repositories/prosthesisRepository"
import { getShareableIncidents } from "@/db/repositories/shareIncidentRepository"
import { useAuth } from "@/context/AuthContext"
import { updateLocalShare, deleteLocalShare } from "@/db/repositories/shares"

export default function SpecialistsScreen() {
	const { t } = useTranslation()
	const { shares, isLoading, error, refresh } = useShares()
	const { colors } = useTheme()
	const [editingShare, setEditingShare] = useState<Share | null>(null)
	const [prostheses, setProstheses] = useState<{ id: string; name: string }[]>([])

	const [incidents, setIncidents] = useState<{ id: string; prosthesisId: string }[]>([])

	const [prosthesesLoading, setProsthesesLoading] = useState(true)
	const [prosthesesError, setProsthesesError] = useState(false)
	const { status, sessionKey } = useAuth()

	useEffect(() => {
		let active = true

		async function loadOptions() {
			try {
				const prosthesisRows = await getAllProstheses()
				const incidentRows = getShareableIncidents()

				if (active) {
					setProstheses(prosthesisRows.map(({ id, name }) => ({ id, name })))
					setIncidents(incidentRows)
				}
			} catch {
				if (active) {
					setProsthesesError(true)
				}
			} finally {
				if (active) {
					setProsthesesLoading(false)
				}
			}
		}

		void loadOptions()

		return () => {
			active = false
		}
	}, [])
	return (
		<ThemedView variant="background" colorName="bg_1" style={styles.screen}>
			<ThemedHeader tx="specialists.headerTitle" />
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Info About How Many Specialists have my data */}
				<ThemedView style={styles.rowTop}>
					<ThemedView style={[styles.numberCircle, { borderColor: colors.blue2 }]}>
						<ThemedText style={styles.numberText} colorName="blue2" variant="H0">
							{isLoading || error ? "-" : shares.length}
						</ThemedText>
					</ThemedView>

					<ThemedText style={styles.topRowText} colorName="blue2" variant="H4">
						{t("specialists.summary")}{" "}
						<ThemedText colorName="blue2" variant="H5">
							{isLoading || error ? "—" : t("specialists.countLabel", { count: shares.length })}.
						</ThemedText>
					</ThemedText>
				</ThemedView>
				{isLoading && <ActivityIndicator />}

				{error && <ThemedText accessibilityRole="alert">{t(error)}</ThemedText>}

				{!isLoading &&
					!error &&
					shares.map((share) => {
						const initials = share.specialist.name
							.trim()
							.split(/\s+/)
							.slice(0, 2)
							.map((part) => part[0])
							.join("")
							.toUpperCase()

						const selectedProstheses = prostheses.filter((prosthesis) =>
							share.permissions.prostheses.includes(prosthesis.id)
						)

						const incidentProstheses = prostheses.filter((prosthesis) =>
							incidents.some(
								(incident) =>
									incident.prosthesisId === prosthesis.id &&
									share.permissions.incidents.includes(incident.id)
							)
						)

						return (
							<ThemedView
								key={share.specialist.id}
								style={[
									styles.specialistCard,
									{
										borderColor: colors.blue1,
										backgroundColor: colors.bg_0,
									},
								]}
							>
								<View style={styles.cardHeader}>
									<View style={[styles.cardAvatar, { backgroundColor: colors.blue1 }]}>
										<ThemedText colorName="bg_0" variant="H3">
											{initials}
										</ThemedText>
									</View>

									<View style={styles.cardDetails}>
										<ThemedText variant="H3" colorName="blue2">
											{share.specialist.name}
										</ThemedText>

										<ThemedText variant="H4" colorName="blue2">
											{t("specialists.profession")}
										</ThemedText>

										<ThemedText variant="H4" colorName="blue2">
											{t("specialists.addedOn", {
												date: new Date(share.created_at).toLocaleDateString(),
											})}
										</ThemedText>
									</View>
								</View>

								<View style={styles.permissionsList}>
									{share.permissions.medical_history && (
										<View style={styles.permissionLine}>
											<ThemedText variant="H5" colorName="blue2" style={styles.permissionText}>
												{t("sharePermissions.medicalHistory")}
											</ThemedText>
											<IconCheck width={14} height={12} color={colors.blue2} />
										</View>
									)}

									{incidentProstheses.map((prosthesis) => (
										<View key={`incidents-${prosthesis.id}`} style={styles.permissionLine}>
											<ThemedText variant="H5" colorName="blue2" style={styles.permissionText}>
												{prosthesis.name} – {t("sharePermissions.incidents")}
											</ThemedText>
											<IconCheck width={14} height={12} color={colors.blue2} />
										</View>
									))}

									{selectedProstheses.map((prosthesis) => (
										<View key={prosthesis.id} style={styles.permissionLine}>
											<ThemedText variant="H5" colorName="blue2" style={styles.permissionText}>
												{prosthesis.name} – {t("specialists.components")}
											</ThemedText>
											<IconCheck width={14} height={12} color={colors.blue2} />
										</View>
									))}
								</View>

								<ThemedView
									style={styles.editAccess}
									onPress={() => setEditingShare(share)}
									accessibilityRole="button"
									accessibilityLabel={`${t("specialists.editPermissions")}: ${share.specialist.name}`}
								>
									<ThemedText
										variant="H4"
										colorName="magenta0"
										style={{ lineHeight: 24, paddingVertical: 2 }}
									>
										{t("specialists.editPermissions")}
									</ThemedText>

									<IconPencil width={18} height={18} color={colors.magenta0} />
								</ThemedView>
							</ThemedView>
						)
					})}
			</ScrollView>
			{editingShare && prosthesesLoading && <ActivityIndicator color={colors.blue2} />}

			{editingShare && prosthesesError && (
				<ThemedText accessibilityRole="alert">
					{t("sharePermissions.prosthesesLoadError")}
				</ThemedText>
			)}
			{editingShare && !prosthesesLoading && !prosthesesError && (
				<SharePermissionsModal
					key={editingShare.specialist.id}
					specialist={editingShare.specialist}
					prostheses={prostheses}
					incidents={incidents}
					initialPermissions={editingShare.permissions}
					onClose={() => setEditingShare(null)}
					onSave={async (permissions) => {
						if (status !== "AUTHENTICATED" || !sessionKey) {
							throw new Error("An authenticated account is required.")
						}

						updateLocalShare(sessionKey, editingShare.specialist.id, permissions)

						refresh()
					}}
					onRevoke={async () => {
						if (status !== "AUTHENTICATED" || !sessionKey) {
							throw new Error("An authenticated account is required.")
						}

						deleteLocalShare(sessionKey, editingShare.specialist.id)
						refresh()
					}}
				/>
			)}
			{/* Buttons */}
			<ThemedView style={styles.rowBot}>
				<ThemedView
					variant="wide"
					colorName="blue0"
					style={styles.actionButton}
					// onPress={() => router.push()}
					leftChild={<IconChatMessage width={22} height={22} color={colors.graphite0} />}
					centerChild={
						<ThemedText
							tx={"specialists.recommendationsButtonLabel"}
							variant="H1"
							colorName="graphite0"
							style={styles.actionLabel}
						/>
					}
					rightChild={<IconChevronRight width={12} height={20} color={colors.graphite0} />}
				/>

				<ThemedView
					variant="wide"
					colorName="blue2"
					style={styles.actionButton}
					onPress={() => router.push("/settings/specialistsSearch")}
					centerChild={
						<ThemedText
							tx={"specialists.addButtonLabel"}
							// H2 ?
							variant="H1"
							colorName="bg_0"
							style={styles.actionLabel}
						/>
					}
					rightChild={<IconPlus width={18} height={18} color={colors.bg_0} />}
				/>
			</ThemedView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
		width: "100%",
	},
	rowTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		gap: 16,
		marginTop: 20,
	},

	numberCircle: {
		width: 54,
		height: 54,
		borderRadius: 27,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	numberText: {
		textAlign: "center",
	},
	topRowText: {
		flex: 1,
	},
	rowBot: {
		width: "100%",
		alignItems: "center",
		gap: 12,
		paddingVertical: 16,
		marginBottom: 20,
	},
	actionButton: {
		width: "100%",
		minHeight: 50,
		borderRadius: 20,
	},
	actionLabel: {
		textTransform: "uppercase",
		textAlign: "center",
	},
	specialistRow: {
		minHeight: 44,
		paddingVertical: 12,
	},
	editButton: {
		minHeight: 44,
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "flex-start",
	},
	specialistCard: {
		width: "100%",
		padding: 16,
		marginTop: 12,
		borderWidth: 1,
		borderRadius: 24,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	cardAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	cardDetails: {
		flex: 1,
		gap: 4,
	},
	permissionsList: {
		marginLeft: 60,
		marginTop: 20,
		marginRight: 30,
		gap: 8,
	},
	permissionLine: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	permissionText: {
		flex: 1,
		fontWeight: "700",
	},
	permissionCheck: {
		fontSize: 26,
		lineHeight: 30,
	},
	editAccess: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-end",
		gap: 8,
		minHeight: 44,
		paddingHorizontal: 8,
		marginTop: 12,
	},
})
