import React, { useState } from "react"
import { Alert, Image, ScrollView, StyleSheet, TextInput, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { createProsthesis } from "@/db/repositories/prosthesisRepository"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

import {
	AmputationLevel,
	AmputationLevelSelector,
} from "@/src/components/prosthesis/AmputationLevelSelector"

type Side = "left" | "right"
type Limb = "upper" | "lower"

export default function NewProsthesisScreen() {
	const router = useRouter()
	const { colors } = useTheme()
	const { t } = useTranslation()

	const [name, setName] = useState("")
	const [side, setSide] = useState<Side>("left")
	const [limb, setLimb] = useState<Limb>("lower")

	const [amputationLevel, setAmputationLevel] = useState<AmputationLevel | null>(null)

	const [replacementDate, setReplacementDate] = useState("")

	const [notes, setNotes] = useState("")
	const [notesHeight, setNotesHeight] = useState(44)
	const [isSaving, setIsSaving] = useState(false)

	const canSave = name.trim().length > 0 && amputationLevel !== null && !isSaving

	const handleLimbChange = (newLimb: Limb) => {
		setLimb(newLimb)
		setAmputationLevel(null)
	}

	const handleSave = async () => {
		if (!canSave || amputationLevel === null) {
			return
		}

		try {
			setIsSaving(true)

			const prosthesis = await createProsthesis({
				name: name.trim(),
				side,
				limbType: limb,
				amputationLevel,
			})

			router.replace({
				pathname: "/prosthesis/[prosthesisId]",
				params: {
					prosthesisId: prosthesis.id,
				},
			})
		} catch (error) {
			console.error("Failed to create prosthesis:", error)

			Alert.alert(t("common.error"), t("newProsthesis.saveError"))
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<ThemedView colorName="tertiary_base_1" style={styles.screen}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{/* HEADER */}
				<ThemedView colorName="primary_base" style={styles.header}>
					<ThemedView
						colorName="primary_base"
						style={styles.backButton}
						onPress={() => router.back()}
						accessibilityRole="button"
						accessibilityLabel={t("newProsthesis.back")}
					>
						<Ionicons name="chevron-back" size={28} color={colors.accent_base} />
					</ThemedView>

					<ThemedText tx="newProsthesis.title" variant="title" colorName="accent_base" />
				</ThemedView>

				{/* IKONA */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.icon"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.sectionLabel}
					/>

					<View style={styles.iconSelector}>
						<View style={styles.iconArrow}>
							<Ionicons name="chevron-back" size={40} color={colors.secondary_base_0c} />
						</View>

						<ThemedView colorName="primary_base" style={styles.prosthesisIconCard}>
							<Image
								source={require("../../../../assets/mp_logo_accent.png")}
								resizeMode="contain"
								style={styles.prosthesisIcon}
							/>
						</ThemedView>

						<View style={styles.iconArrow}>
							<Ionicons name="chevron-forward" size={40} color={colors.secondary_base_0c} />
						</View>
					</View>
				</View>

				{/* NAZWA PROTEZY */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.name"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.sectionLabel}
					/>

					<ThemedView
						colorName="tertiary_base_3"
						borderColor="secondary_base_0c"
						style={styles.inputContainer}
					>
						<TextInput
							value={name}
							onChangeText={setName}
							placeholder={t("newProsthesis.namePlaceholder")}
							placeholderTextColor={colors.primary_base}
							style={[
								styles.input,
								{
									color: colors.primary_base,
								},
							]}
						/>
					</ThemedView>
				</View>

				{/* WYBIERZ KOŃCZYNĘ */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.selectLimb"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.sectionLabel}
					/>

					<View style={styles.togglesContainer}>
						<BinaryToggle
							leftLabel={t("newProsthesis.left")}
							rightLabel={t("newProsthesis.right")}
							value={side === "right"}
							onChange={(isRight) => setSide(isRight ? "right" : "left")}
						/>

						<BinaryToggle
							leftLabel={t("newProsthesis.upper")}
							rightLabel={t("newProsthesis.lower")}
							value={limb === "lower"}
							onChange={(isLower) => handleLimbChange(isLower ? "lower" : "upper")}
						/>
					</View>
				</View>

				{/* POZIOM AMPUTACJI */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.amputationLevel"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.sectionLabel}
					/>

					<AmputationLevelSelector
						limb={limb}
						value={amputationLevel}
						onChange={setAmputationLevel}
					/>
				</View>

				{/* PRZEWIDYWANA DATA WYMIANY */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.replacementDate"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.sectionLabel}
					/>

					<ThemedView
						colorName="tertiary_base_3"
						borderColor="secondary_base"
						style={styles.inputContainer}
					>
						<TextInput
							value={replacementDate}
							onChangeText={setReplacementDate}
							placeholder={t("newProsthesis.replacementDatePlaceholder")}
							placeholderTextColor={colors.primary_base}
							style={[
								styles.input,
								{
									color: colors.primary_base,
								},
							]}
						/>
					</ThemedView>
				</View>

				{/* OPIS / NOTATKI */}
				<View style={styles.section}>
					<ThemedText
						tx="newProsthesis.notes"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.sectionLabel}
					/>

					<ThemedView
						colorName="tertiary_base_3"
						borderColor="secondary_base"
						style={styles.notesContainer}
					>
						<TextInput
							value={notes}
							onChangeText={setNotes}
							placeholder={t("newProsthesis.notesPlaceholder")}
							placeholderTextColor={colors.primary_base}
							multiline
							scrollEnabled={false}
							textAlignVertical="top"
							onContentSizeChange={(event) => {
								const contentHeight = event.nativeEvent.contentSize.height

								setNotesHeight(Math.max(44, contentHeight + 16))
							}}
							style={[
								styles.notesInput,
								{
									color: colors.primary_base,
									height: notesHeight,
								},
							]}
						/>
					</ThemedView>
				</View>

				{/* DODAJ PLIKI */}
				<ThemedView
					colorName="tertiary_base_1"
					style={styles.addFilesButton}
					onPress={() => {
						// TODO: obsługa dodawania plików
					}}
					accessibilityRole="button"
				>
					<ThemedView colorName="primary_base" style={styles.addFileIcon}>
						<Ionicons name="add" size={22} color={colors.accent_base_2} />
					</ThemedView>

					<ThemedText
						tx="newProsthesis.addFiles"
						variant="main1Button"
						colorName="primary_base"
						style={styles.addFilesTitle}
					/>
				</ThemedView>

				<ThemedText
					tx="newProsthesis.filesDescription"
					variant="subTitle2"
					colorName="secondary_base_0c"
					style={styles.fileDescription}
				/>

				{/* ZAPISZ PROTEZĘ */}
				<ThemedView
					variant="wide"
					colorName={canSave ? "primary_base" : "primary_base_3"}
					borderColor="accent_base"
					style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
					onPress={canSave ? handleSave : undefined}
					accessibilityRole="button"
					accessibilityState={{
						disabled: !canSave,
					}}
				>
					<ThemedText tx="newProsthesis.save" variant="main1Button" colorName="accent_base" />
				</ThemedView>
			</ScrollView>
		</ThemedView>
	)
}

interface BinaryToggleProps {
	leftLabel: string
	rightLabel: string
	value: boolean
	onChange: (value: boolean) => void
}

function BinaryToggle({ leftLabel, rightLabel, value, onChange }: BinaryToggleProps) {
	return (
		<View style={styles.toggleRow}>
			<ThemedText
				variant="subTitle2"
				colorName={!value ? "primary_base" : "secondary_base_0c"}
				style={[styles.toggleLabel, !value && styles.toggleLabelSelected]}
			>
				{leftLabel}
			</ThemedText>

			<ThemedView
				colorName="tertiary_base_2"
				borderColor="secondary_base_0c"
				style={styles.toggleTrack}
				onPress={() => onChange(!value)}
				accessibilityRole="switch"
				accessibilityState={{
					checked: value,
				}}
			>
				<ThemedView
					colorName="primary_base"
					style={[styles.toggleThumb, value && styles.toggleThumbRight]}
				/>
			</ThemedView>

			<ThemedText
				variant="subTitle2"
				colorName={value ? "primary_base" : "secondary_base_0c"}
				style={[styles.toggleLabel, value && styles.toggleLabelSelected]}
			>
				{rightLabel}
			</ThemedText>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},

	content: {
		paddingBottom: 48,
	},

	header: {
		width: "100%",
		minHeight: 86,
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 16,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},

	backButton: {
		position: "absolute",
		left: 16,
		top: 18,
		bottom: 16,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 2,
	},

	headerTitle: {
		fontSize: 18,
		lineHeight: 18,
		letterSpacing: 0.72,
	},

	section: {
		width: "100%",
		paddingHorizontal: 24,
		marginTop: 18,
	},

	sectionLabel: {
		marginBottom: 8,
	},

	iconSelector: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 26,
	},

	iconArrow: {
		width: 42,
		height: 96,
		justifyContent: "center",
		alignItems: "center",
	},

	prosthesisIconCard: {
		width: 120,
		height: 120,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",

		shadowColor: "#052D8F",
		shadowOffset: {
			width: 0,
			height: 3,
		},
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
	},

	prosthesisIcon: {
		width: 90,
		height: 90,
	},

	inputContainer: {
		width: "100%",
		minHeight: 42,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 0,
		justifyContent: "center",

		shadowColor: "#052D8F",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.12,
		shadowRadius: 4,
		elevation: 3,
	},

	input: {
		width: "100%",
		height: 42,
		paddingVertical: 0,
		fontFamily: "Inter-Regular",
		fontSize: 13,
	},

	togglesContainer: {
		alignItems: "flex-end",
		gap: 8,
	},

	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	toggleLabel: {
		width: 50,
		textAlign: "center",
		fontSize: 12,
		fontFamily: "Afacad-Regular",
		fontWeight: "400",
	},

	toggleLabelSelected: {
		fontFamily: "Afacad-Medium",
		fontWeight: "500",
	},

	toggleTrack: {
		width: 44,
		height: 20,
		borderRadius: 10,
		borderWidth: 1.5,
		justifyContent: "center",
		paddingHorizontal: 2,
	},

	toggleThumb: {
		width: 14,
		height: 14,
		borderRadius: 7,
	},

	toggleThumbRight: {
		left: 24,
	},

	notesContainer: {
		width: "100%",
		minHeight: 44,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 0,

		shadowColor: "#052D8F",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.12,
		shadowRadius: 4,
		elevation: 3,
	},

	notesInput: {
		width: "100%",
		minHeight: 44,
		paddingTop: 10,
		paddingBottom: 10,
		paddingHorizontal: 0,
		fontFamily: "Inter-Regular",
		fontSize: 13,
		textAlignVertical: "top",
	},

	addFilesButton: {
		marginTop: 22,
		alignSelf: "center",
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 4,
	},

	addFileIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
	},

	addFilesTitle: {
		fontSize: 15,
	},

	fileDescription: {
		width: 220,
		alignSelf: "center",
		marginTop: 5,
		textAlign: "center",
		fontSize: 11,
		lineHeight: 15,
	},

	saveButton: {
		width: "70%",
		alignSelf: "center",
		minHeight: 52,
		marginTop: 20,
		borderWidth: 1,
	},

	saveButtonDisabled: {
		opacity: 0.65,
	},
})
