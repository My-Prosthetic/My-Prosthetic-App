import { useEffect, useMemo, useRef, useState } from "react"
import { Alert, Image, ScrollView, StyleProp, StyleSheet, TextInput, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Crypto from "expo-crypto"
import {
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioRecorder,
	useAudioRecorderState,
} from "expo-audio"
import * as ImagePicker from "expo-image-picker"
import { Directory, File, Paths } from "expo-file-system"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ThemeColors, useTheme } from "@/context/ThemeContext"
import {
	createIncident,
	getIncidentCustomValues,
	type IncidentCoordinates,
} from "@/db/repositories/incidentRepository"
import { getComponentsByProsthesisId, type Component } from "@/db/repositories/componentRepository"
import { getAllProstheses, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { IncidentBodyMap, type IncidentBodyView } from "@/src/components/incidents/IncidentBodyMap"
import { DropdownSelect } from "@/src/components/DropdownSelect"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

type SelectOption = {
	label: string
	value: string
}

const INCIDENT_TYPES = [
	"pain",
	"abrasion",
	"poor_fit",
	"phantom_pain",
	"mechanical_failure",
] as const
const ACTIVITY_VALUES = ["", "walking", "running", "sitting", "standing", "sport"] as const
const BODY_VIEWS: IncidentBodyView[] = ["side", "top_inside", "front_back"]
const MAX_PHOTOS = 3
const DESCRIPTION_MAX_LENGTH = 500
const CUSTOM_VALUE = "__custom__"
const INCIDENTS_DIRECTORY = "incidents"

function getMediaExtension(uri: string, fallback: string) {
	const cleanUri = uri.split("?")[0]
	const match = cleanUri.match(/\.([a-zA-Z0-9]{2,5})$/)
	return match ? `.${match[1].toLowerCase()}` : fallback
}

function getIncidentMediaDirectory(incidentId: string) {
	return new Directory(Paths.document, INCIDENTS_DIRECTORY, incidentId)
}

async function persistIncidentMedia(
	sourceUri: string,
	incidentId: string,
	prefix: "photo" | "audio",
	fallbackExtension: string
) {
	const directory = getIncidentMediaDirectory(incidentId)
	directory.create({ idempotent: true, intermediates: true })
	const destination = new File(
		directory,
		`${prefix}-${Crypto.randomUUID()}${getMediaExtension(sourceUri, fallbackExtension)}`
	)
	await new File(sourceUri).copy(destination)
	return destination.uri
}

function deleteIncidentMediaFile(uri: string) {
	try {
		const file = new File(uri)
		if (file.exists) file.delete()
	} catch (error) {
		console.warn("Failed to delete incident media file:", error)
	}
}

function deleteIncidentMediaDirectory(incidentId: string) {
	try {
		const directory = getIncidentMediaDirectory(incidentId)
		if (directory.exists) directory.delete()
	} catch (error) {
		console.warn("Failed to delete incident media directory:", error)
	}
}

function toDateKey(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

function toTimeText(date: Date) {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function buildOccurredAt(date: Date, timeText: string) {
	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeText)
	if (!match) {
		return null
	}
	const occurredAt = new Date(date)
	occurredAt.setHours(Number(match[1]), Number(match[2]), 0, 0)
	return occurredAt.toISOString()
}

function normalizeCustomValue(value: string) {
	return value.trim().toLocaleLowerCase()
}

export default function NewIncidentScreen() {
	const router = useRouter()
	const params = useLocalSearchParams<{ prosthesisId?: string }>()
	const { t } = useTranslation()
	const { colors } = useTheme()
	const styles = useMemo(() => getStyles(colors), [colors])
	const scrollRef = useRef<ScrollView>(null)
	const incidentIdRef = useRef(Crypto.randomUUID())
	const savedRef = useRef(false)
	const dateScrollRef = useRef<ScrollView>(null)
	const now = useMemo(() => new Date(), [])
	const [selectedDate, setSelectedDate] = useState(now)
	const [timeText, setTimeText] = useState(toTimeText(now))
	const [incidentType, setIncidentType] = useState("")
	const [activity, setActivity] = useState("")
	const [description, setDescription] = useState("")
	const [intensity, setIntensity] = useState(0)
	const [prostheses, setProstheses] = useState<Prosthesis[]>([])
	const [selectedProsthesisId, setSelectedProsthesisId] = useState<string>()
	const [components, setComponents] = useState<Component[]>([])
	const [selectedComponentId, setSelectedComponentId] = useState<string>()
	const [coordinates, setCoordinates] = useState<IncidentCoordinates>()
	const [bodyViewIndex, setBodyViewIndex] = useState(0)
	const [photoUris, setPhotoUris] = useState<string[]>([])
	const [audioUri, setAudioUri] = useState<string>()
	const [isSaving, setIsSaving] = useState(false)
	const [customTypes, setCustomTypes] = useState<string[]>([])
	const [customActivities, setCustomActivities] = useState<string[]>([])
	const [customTypeMode, setCustomTypeMode] = useState(false)
	const [customActivityMode, setCustomActivityMode] = useState(false)
	const [customTypeDraft, setCustomTypeDraft] = useState("")
	const [customActivityDraft, setCustomActivityDraft] = useState("")
	const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
	const recorderState = useAudioRecorderState(audioRecorder, 250)
	const dates = useMemo(() => {
		return Array.from({ length: 365 }, (_, index) => {
			const date = new Date(now)
			date.setHours(0, 0, 0, 0)
			date.setDate(date.getDate() - (364 - index))
			return date
		})
	}, [now])
	useEffect(() => {
		let mounted = true
		const load = async () => {
			try {
				const [prosthesisRows, customValues] = await Promise.all([
					getAllProstheses(),
					getIncidentCustomValues(),
				])
				if (!mounted) return
				setCustomTypes(customValues.types)
				setCustomActivities(customValues.activities)
				setProstheses(prosthesisRows)
				const requestedId = Array.isArray(params.prosthesisId)
					? params.prosthesisId[0]
					: params.prosthesisId
				const requestedExists = requestedId
					? prosthesisRows.some((prosthesis) => prosthesis.id === requestedId)
					: false
				if (requestedExists && requestedId) {
					setSelectedProsthesisId(requestedId)
				} else if (prosthesisRows.length === 1) {
					setSelectedProsthesisId(prosthesisRows[0].id)
				}
			} catch (error) {
				console.error("Failed to load incident form data:", error)
				Alert.alert(t("common.error"), t("newIncident.loadError"))
			}
		}
		void load()
		return () => {
			mounted = false
		}
	}, [params.prosthesisId, t])
	useEffect(() => {
		let mounted = true
		const loadComponents = async () => {
			setSelectedComponentId(undefined)
			setCoordinates(undefined)
			if (!selectedProsthesisId) {
				setComponents([])
				return
			}
			try {
				const rows = await getComponentsByProsthesisId(selectedProsthesisId)
				if (mounted) {
					setComponents(rows)
				}
			} catch (error) {
				console.error("Failed to load prosthesis components:", error)
			}
		}
		void loadComponents()
		return () => {
			mounted = false
		}
	}, [selectedProsthesisId])
	useEffect(() => {
		const incidentId = incidentIdRef.current

		return () => {
			if (!savedRef.current) {
				deleteIncidentMediaDirectory(incidentId)
			}
		}
	}, [])
	const selectedComponent = components.find((component) => component.id === selectedComponentId)
	const hideIntensity = incidentType === "mechanical_failure"
	const hideMapForType = incidentType === "phantom_pain" || incidentType === "mechanical_failure"
	const showMap = selectedComponent?.type === "socket" && !hideMapForType
	const currentBodyView = BODY_VIEWS[bodyViewIndex]
	const typeOptions = useMemo<SelectOption[]>(() => {
		const builtIn: SelectOption[] = [
			{ label: t("newIncident.types.pain"), value: "pain" },
			{ label: t("newIncident.types.abrasion"), value: "abrasion" },
			{ label: t("newIncident.types.poorFit"), value: "poor_fit" },
			{ label: t("newIncident.types.phantomPain"), value: "phantom_pain" },
			{ label: t("newIncident.types.mechanicalFailure"), value: "mechanical_failure" },
		]
		const builtInValues = new Set<string>(INCIDENT_TYPES)
		return [
			...builtIn,
			...customTypes
				.filter((value) => !builtInValues.has(value))
				.map((value) => ({ label: value, value })),
			{ label: t("newIncident.customValuePlaceholder"), value: CUSTOM_VALUE },
		]
	}, [customTypes, t])
	const activityOptions = useMemo<SelectOption[]>(() => {
		const builtIn: SelectOption[] = [
			{ label: t("newIncident.none"), value: "" },
			{ label: t("newIncident.activities.walking"), value: "walking" },
			{ label: t("newIncident.activities.running"), value: "running" },
			{ label: t("newIncident.activities.sitting"), value: "sitting" },
			{ label: t("newIncident.activities.standing"), value: "standing" },
			{ label: t("newIncident.activities.sport"), value: "sport" },
		]
		const builtInValues = new Set<string>(ACTIVITY_VALUES)
		return [
			...builtIn,
			...customActivities
				.filter((value) => !builtInValues.has(value))
				.map((value) => ({ label: value, value })),
			{ label: t("newIncident.customValuePlaceholder"), value: CUSTOM_VALUE },
		]
	}, [customActivities, t])
	const getComponentLabel = (component: Component) => {
		if (component.name?.trim()) return component.name
		switch (component.type) {
			case "socket":
				return t("newIncident.componentTypes.socket")
			case "knee":
				return t("newIncident.componentTypes.knee")
			case "foot":
				return t("newIncident.componentTypes.foot")
			case "liner":
				return t("newIncident.componentTypes.liner")
			case "adapter":
				return t("newIncident.componentTypes.adapter")
			default:
				return t("newIncident.componentTypes.other")
		}
	}
	const componentOptions = useMemo<SelectOption[]>(
		() => [
			{ label: t("newIncident.none"), value: "" },
			...components.map((component) => ({
				label: getComponentLabel(component),
				value: component.id,
			})),
		],
		// getComponentLabel only depends on translations and the current component list.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[components, t]
	)
	const startRecording = async () => {
		try {
			const permission = await requestRecordingPermissionsAsync()
			if (!permission.granted) {
				Alert.alert(t("common.error"), t("newIncident.microphonePermission"))
				return
			}
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
			await audioRecorder.prepareToRecordAsync()
			audioRecorder.record()
		} catch (error) {
			console.error("Failed to start recording:", error)
			Alert.alert(t("common.error"), t("newIncident.recordingError"))
		}
	}
	const stopRecording = async () => {
		try {
			await audioRecorder.stop()
			if (!audioRecorder.uri) return
			if (audioUri) {
				deleteIncidentMediaFile(audioUri)
			}
			const persistentUri = await persistIncidentMedia(
				audioRecorder.uri,
				incidentIdRef.current,
				"audio",
				".m4a"
			)
			setAudioUri(persistentUri)
			await setAudioModeAsync({ allowsRecording: false })
		} catch (error) {
			console.error("Failed to stop recording:", error)
			Alert.alert(t("common.error"), t("newIncident.recordingError"))
		}
	}
	const addPickedImage = async (uri: string) => {
		if (photoUris.length >= MAX_PHOTOS) {
			Alert.alert(t("newIncident.photoLimitTitle"), t("newIncident.photoLimit"))
			return
		}
		try {
			const persistentUri = await persistIncidentMedia(uri, incidentIdRef.current, "photo", ".jpg")
			setPhotoUris((current) => [...current, persistentUri].slice(0, MAX_PHOTOS))
		} catch (error) {
			console.error("Failed to persist photo:", error)
			Alert.alert(t("common.error"), t("newIncident.fileError"))
		}
	}
	const takePhoto = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync()
		if (!permission.granted) {
			Alert.alert(t("common.error"), t("newIncident.cameraPermission"))
			return
		}
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ["images"],
			quality: 0.9,
			allowsEditing: false,
		})
		if (!result.canceled && result.assets[0]) {
			await addPickedImage(result.assets[0].uri)
		}
	}
	const pickPhoto = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permission.granted) {
			Alert.alert(t("common.error"), t("newIncident.galleryPermission"))
			return
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 0.9,
			allowsMultipleSelection: false,
		})
		if (!result.canceled && result.assets[0]) {
			await addPickedImage(result.assets[0].uri)
		}
	}
	const showAddPhotoActions = () => {
		if (photoUris.length >= MAX_PHOTOS) {
			Alert.alert(t("newIncident.photoLimitTitle"), t("newIncident.photoLimit"))
			return
		}
		Alert.alert(t("newIncident.addFile"), t("newIncident.choosePhotoSource"), [
			{ text: t("newIncident.camera"), onPress: () => void takePhoto() },
			{ text: t("newIncident.gallery"), onPress: () => void pickPhoto() },
			{ text: t("common.cancel"), style: "cancel" },
		])
	}
	const removePhoto = (uri: string) => {
		deleteIncidentMediaFile(uri)
		setPhotoUris((current) => current.filter((value) => value !== uri))
	}
	const saveIncident = async () => {
		if (!selectedProsthesisId) {
			Alert.alert(t("common.error"), t("newIncident.validation.prosthesis"))
			return
		}
		if (!incidentType) {
			Alert.alert(t("common.error"), t("newIncident.validation.type"))
			return
		}
		if (!description.trim()) {
			Alert.alert(t("common.error"), t("newIncident.validation.description"))
			return
		}
		if (!hideIntensity && intensity < 1) {
			Alert.alert(t("common.error"), t("newIncident.validation.intensity"))
			return
		}
		const occurredAt = buildOccurredAt(selectedDate, timeText)
		if (!occurredAt) {
			Alert.alert(t("common.error"), t("newIncident.validation.time"))
			return
		}
		try {
			setIsSaving(true)
			await createIncident({
				id: incidentIdRef.current,
				prosthesisId: selectedProsthesisId,
				componentId: selectedComponentId || undefined,
				type: incidentType,
				coordinates: showMap ? coordinates : undefined,
				intensity: hideIntensity ? undefined : intensity,
				activity: activity.trim(),
				description: description.trim(),
				occurredAt,
				photoUris,
				audioUri,
			})
			savedRef.current = true
			Alert.alert(t("newIncident.savedTitle"), t("newIncident.savedMessage"), [
				{ text: t("common.save"), onPress: () => router.back() },
			])
		} catch (error) {
			console.error("Failed to save incident:", error)
			Alert.alert(t("common.error"), t("newIncident.saveError"))
		} finally {
			setIsSaving(false)
		}
	}
	const selectIncidentType = (value: string) => {
		if (value === CUSTOM_VALUE) {
			setCustomTypeMode(true)
			setIncidentType("")
			return
		}
		setCustomTypeMode(false)
		setIncidentType(value)
		if (value === "phantom_pain" || value === "mechanical_failure") {
			setCoordinates(undefined)
		}
	}
	const selectActivity = (value: string) => {
		if (value === CUSTOM_VALUE) {
			setCustomActivityMode(true)
			setActivity("")
			return
		}
		setCustomActivityMode(false)
		setActivity(value)
	}
	const addCustomType = () => {
		const value = customTypeDraft.trim()
		if (!value) return

		const existingValues = [
			...INCIDENT_TYPES,
			t("newIncident.types.pain"),
			t("newIncident.types.abrasion"),
			t("newIncident.types.poorFit"),
			t("newIncident.types.phantomPain"),
			t("newIncident.types.mechanicalFailure"),
			...customTypes,
		]
		const normalizedValue = normalizeCustomValue(value)
		const alreadyExists = existingValues.some(
			(existingValue) => normalizeCustomValue(existingValue) === normalizedValue
		)

		if (alreadyExists) {
			Alert.alert(t("common.error"), t("newIncident.duplicateValue"))
			return
		}

		setCustomTypes((current) => [...current, value])
		setIncidentType(value)
		setCustomTypeDraft("")
		setCustomTypeMode(false)
	}
	const addCustomActivity = () => {
		const value = customActivityDraft.trim()
		if (!value) return

		const existingValues = [
			...ACTIVITY_VALUES.filter(Boolean),
			t("newIncident.activities.walking"),
			t("newIncident.activities.running"),
			t("newIncident.activities.sitting"),
			t("newIncident.activities.standing"),
			t("newIncident.activities.sport"),
			...customActivities,
		]
		const normalizedValue = normalizeCustomValue(value)
		const alreadyExists = existingValues.some(
			(existingValue) => normalizeCustomValue(existingValue) === normalizedValue
		)

		if (alreadyExists) {
			Alert.alert(t("common.error"), t("newIncident.duplicateValue"))
			return
		}

		setCustomActivities((current) => [...current, value])
		setActivity(value)
		setCustomActivityDraft("")
		setCustomActivityMode(false)
	}
	return (
		<ThemedView colorName="tertiary_base_1" style={styles.screen}>
			<ScrollView
				ref={scrollRef}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<ThemedView colorName="tertiary_base_1" style={styles.header}>
					<ThemedView
						colorName="tertiary_base_1"
						onPress={() => router.back()}
						hitSlop={12}
						accessibilityRole="button"
					>
						<Ionicons name="chevron-back" size={34} color={colors.primary_base} />
					</ThemedView>
					<ThemedText tx="newIncident.title" variant="title" style={styles.title} />
				</ThemedView>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.dateStrip}
					ref={dateScrollRef}
					onContentSizeChange={() => dateScrollRef.current?.scrollToEnd({ animated: false })}
				>
					{dates.map((date) => {
						const selected = toDateKey(date) === toDateKey(selectedDate)
						return (
							<ThemedView
								key={toDateKey(date)}
								colorName="tertiary_base_1"
								onPress={() => setSelectedDate(date)}
								style={styles.dateItem}
							>
								<ThemedText
									variant="body1Regular"
									colorName="secondary_base_0c"
									style={styles.dateWeekday}
								>
									{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sat"][date.getDay()]}
								</ThemedText>
								<ThemedView
									colorName={selected ? "tertiary_base_3" : "tertiary_base_1"}
									style={[styles.dateDayBox, selected && styles.dateDayBoxSelected]}
								>
									<ThemedText
										variant="subTitle1"
										colorName="secondary_base_0c"
										style={styles.dateDay}
									>
										{date.getDate()}
									</ThemedText>
								</ThemedView>
							</ThemedView>
						)
					})}
				</ScrollView>
				<ThemedView colorName="tertiary_base_1" style={styles.timeRow}>
					<FieldLabel text={t("newIncident.time")} />
					<ThemedView colorName="tertiary_base_3" style={styles.timePill}>
						<TextInput
							value={timeText}
							onChangeText={setTimeText}
							maxLength={5}
							keyboardType="numbers-and-punctuation"
							selectTextOnFocus
							style={[styles.timeInput, { color: colors.primary_base_1 }]}
						/>
					</ThemedView>
				</ThemedView>
				<FieldLabel text={t("newIncident.type")} />
				<DropdownSelect
					label={t("newIncident.type")}
					placeholder={t("newIncident.selectType")}
					options={typeOptions}
					value={incidentType || undefined}
					onChange={selectIncidentType}
				/>
				{customTypeMode && (
					<CustomValueInput
						value={customTypeDraft}
						onChange={setCustomTypeDraft}
						onAdd={addCustomType}
					/>
				)}
				<FieldLabel text={t("newIncident.circumstances")} />
				<DropdownSelect
					label={t("newIncident.circumstances")}
					placeholder={t("newIncident.none")}
					options={activityOptions}
					value={activity}
					onChange={selectActivity}
				/>
				{customActivityMode && (
					<CustomValueInput
						value={customActivityDraft}
						onChange={setCustomActivityDraft}
						onAdd={addCustomActivity}
					/>
				)}
				<FieldLabel text={t("newIncident.description")} />
				<ThemedView colorName="tertiary_base_3" style={styles.descriptionBox}>
					<TextInput
						value={description}
						onChangeText={setDescription}
						placeholder={t("newIncident.descriptionPlaceholder")}
						placeholderTextColor={colors.primary_base_2}
						multiline
						maxLength={DESCRIPTION_MAX_LENGTH}
						textAlignVertical="top"
						style={[styles.descriptionInput, { color: colors.primary_base }]}
					/>
					<ThemedText
						variant="body1Regular"
						colorName="secondary_base_0c"
						style={styles.descriptionCounter}
					>
						{description.length}/{DESCRIPTION_MAX_LENGTH}
					</ThemedText>
					<ThemedView
						colorName={recorderState.isRecording ? "primary_base" : "tertiary_base_2"}
						onPress={() => void (recorderState.isRecording ? stopRecording() : startRecording())}
						style={styles.microphoneButton}
						accessibilityRole="button"
					>
						<Ionicons
							name={recorderState.isRecording ? "stop" : "mic"}
							size={22}
							color={recorderState.isRecording ? colors.accent_base : colors.primary_base}
						/>
					</ThemedView>
				</ThemedView>
				{(recorderState.isRecording || audioUri) && (
					<ThemedView colorName="tertiary_base_1" style={styles.audioStatusRow}>
						<Ionicons name="mic" size={18} color={colors.secondary_base_0c} />
						<ThemedText variant="body1Regular" colorName="secondary_base_0c">
							{recorderState.isRecording
								? t("newIncident.recording", {
										seconds: Math.floor(recorderState.durationMillis / 1000),
									})
								: t("newIncident.voiceNoteAdded")}
						</ThemedText>
						{audioUri && !recorderState.isRecording && (
							<ThemedText
								onPress={() => {
									deleteIncidentMediaFile(audioUri)
									setAudioUri(undefined)
								}}
								variant="body1Regular"
								colorName="false"
							>
								{t("newIncident.remove")}
							</ThemedText>
						)}
					</ThemedView>
				)}
				{!hideIntensity && (
					<>
						<FieldLabel text={t("newIncident.intensity")} style={styles.sectionGap} />
						<ThemedView colorName="tertiary_base_3" style={styles.intensityTrack}>
							{Array.from({ length: 10 }, (_, index) => {
								const value = index + 1
								const selected = intensity === value
								return (
									<ThemedView
										key={value}
										colorName={selected ? "primary_base_1" : "tertiary_base_3"}
										onPress={() => setIntensity(value)}
										style={styles.intensityItem}
									>
										<ThemedText
											variant="subTitle1"
											colorName={selected ? "accent_base" : "primary_base"}
											style={styles.intensityText}
										>
											{value}
										</ThemedText>
									</ThemedView>
								)
							})}
						</ThemedView>
					</>
				)}
				{prostheses.length > 1 && (
					<>
						<FieldLabel text={t("newIncident.relatedProsthesis")} style={styles.sectionGap} />
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.prosthesisOptions}
						>
							{prostheses.map((prosthesis) => {
								const selected = selectedProsthesisId === prosthesis.id
								return (
									<ThemedView
										key={prosthesis.id}
										colorName="tertiary_base_1"
										onPress={() => setSelectedProsthesisId(prosthesis.id)}
										style={styles.prosthesisOption}
									>
										<ThemedView
											colorName="accent_base_1"
											style={[styles.radioOuter, selected && styles.radioOuterSelected]}
										>
											{selected && (
												<ThemedView colorName="primary_base" style={styles.radioInner} />
											)}
										</ThemedView>
										<ThemedText
											variant="body1Regular"
											colorName="primary_base"
											style={styles.prosthesisName}
										>
											{prosthesis.name}
										</ThemedText>
									</ThemedView>
								)
							})}
						</ScrollView>
					</>
				)}
				{prostheses.length === 0 && (
					<ThemedText variant="body1Regular" colorName="false" style={styles.noProsthesisText}>
						{t("newIncident.noProsthesis")}
					</ThemedText>
				)}
				{selectedProsthesisId && (
					<>
						<FieldLabel text={t("newIncident.component")} style={styles.sectionGap} />
						<DropdownSelect
							label={t("newIncident.component")}
							placeholder={t("newIncident.none")}
							options={componentOptions}
							value={selectedComponentId ?? ""}
							onChange={(value) => {
								setSelectedComponentId(value || undefined)
								setCoordinates(undefined)
							}}
						/>
					</>
				)}
				{showMap && (
					<ThemedView colorName="tertiary_base_1" style={styles.schemaSection}>
						<ThemedText tx="newIncident.schema" variant="title" style={styles.schemaTitle} />
						<ThemedView colorName="tertiary_base_1" style={styles.schemaRow}>
							<ThemedView
								colorName="tertiary_base_1"
								onPress={() =>
									setBodyViewIndex(
										(current) => (current - 1 + BODY_VIEWS.length) % BODY_VIEWS.length
									)
								}
								hitSlop={12}
							>
								<Ionicons name="chevron-back" size={58} color={colors.primary_base} />
							</ThemedView>
							<IncidentBodyMap
								view={currentBodyView}
								value={coordinates}
								onChange={setCoordinates}
							/>
							<ThemedView
								colorName="tertiary_base_1"
								onPress={() => setBodyViewIndex((current) => (current + 1) % BODY_VIEWS.length)}
								hitSlop={12}
							>
								<Ionicons name="chevron-forward" size={58} color={colors.primary_base} />
							</ThemedView>
						</ThemedView>
					</ThemedView>
				)}
				<ThemedView colorName="tertiary_base_1" style={styles.fileSection}>
					<ThemedView
						colorName="tertiary_base_1"
						onPress={showAddPhotoActions}
						style={styles.addFileRow}
						accessibilityRole="button"
					>
						<ThemedView colorName="primary_base" style={styles.addFileCircle}>
							<Ionicons name="add" size={28} color={colors.accent_base} />
						</ThemedView>
						<ThemedText tx="newIncident.addFile" variant="main1Button" style={styles.addFileText} />
					</ThemedView>
					<ThemedText
						tx="newIncident.fileDescription"
						variant="tab1Category"
						colorName="secondary_base_0c"
						style={styles.fileDescription}
					/>
					{photoUris.length > 0 && (
						<ThemedView colorName="tertiary_base_1" style={styles.photoRow}>
							{photoUris.map((uri, index) => (
								<ThemedView key={uri} colorName="tertiary_base_1" style={styles.photoWrapper}>
									<Image source={{ uri }} style={styles.photoPreview} />
									<ThemedView
										colorName="primary_base"
										onPress={() => removePhoto(uri)}
										style={styles.photoRemove}
										accessibilityLabel={t("newIncident.removePhoto", { number: index + 1 })}
									>
										<Ionicons name="close" size={17} color={colors.accent_base} />
									</ThemedView>
								</ThemedView>
							))}
						</ThemedView>
					)}
				</ThemedView>
				<ThemedView
					onPress={() => void saveIncident()}
					colorName="primary_base"
					style={[styles.saveButton, isSaving && styles.disabledButton]}
					disabled={isSaving || prostheses.length === 0}
				>
					<ThemedText
						tx={isSaving ? "newIncident.saving" : "newIncident.save"}
						variant="main1Button"
						colorName="accent_base"
						style={styles.saveButtonText}
					/>
				</ThemedView>
				<ThemedView
					colorName="primary_base"
					onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
					style={styles.scrollTopButton}
					accessibilityRole="button"
				>
					<Ionicons name="chevron-up" size={38} color={colors.accent_base} />
				</ThemedView>
			</ScrollView>
		</ThemedView>
	)
}

function FieldLabel({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
	return (
		<ThemedText
			variant="main1Button"
			colorName="primary_base"
			style={[localStyles.fieldLabel, style]}
		>
			{text}
		</ThemedText>
	)
}

function CustomValueInput({
	value,
	onChange,
	onAdd,
}: {
	value: string
	onChange: (value: string) => void
	onAdd: () => void
}) {
	const { t } = useTranslation()
	const { colors } = useTheme()
	return (
		<ThemedView colorName="tertiary_base_1" style={localStyles.customValueRow}>
			<TextInput
				value={value}
				onChangeText={onChange}
				placeholder={t("newIncident.customValuePlaceholder")}
				placeholderTextColor={colors.primary_base_2}
				style={[
					localStyles.customValueInput,
					{ color: colors.primary_base, borderColor: colors.primary_base_2 },
				]}
			/>
			<ThemedView onPress={onAdd} colorName="primary_base" style={localStyles.customValueButton}>
				<Ionicons name="add" size={24} color={colors.accent_base} />
			</ThemedView>
		</ThemedView>
	)
}

const localStyles = StyleSheet.create({
	fieldLabel: {
		textAlign: "left",
		marginBottom: 8,
		marginTop: 16,
	},
	customValueRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 8,
	},
	customValueInput: {
		flex: 1,
		height: 48,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 12,
		fontFamily: "Inter-Regular",
		fontSize: 14,
	},
	customValueButton: {
		width: 48,
		height: 48,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
})

const getStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		screen: {
			flex: 1,
		},
		content: {
			paddingHorizontal: 28,
			paddingTop: 18,
			paddingBottom: 44,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: 22,
		},
		title: {
			fontSize: 28,
			lineHeight: 34,
			textAlign: "left",
			marginLeft: 8,
		},
		dateStrip: {
			alignItems: "flex-start",
			paddingHorizontal: 2,
			paddingBottom: 18,
		},
		dateItem: {
			width: 58,
			alignItems: "center",
			paddingVertical: 3,
		},
		dateWeekday: {
			fontSize: 18,
			lineHeight: 24,
			textAlign: "center",
		},
		dateDayBox: {
			width: 38,
			height: 38,
			marginTop: 7,
			borderWidth: 1.5,
			borderColor: colors.tertiary_base_1,
			borderRadius: 4,
			alignItems: "center",
			justifyContent: "center",
		},
		dateDayBoxSelected: {
			borderColor: colors.primary_base_2,
		},
		dateDay: {
			fontSize: 20,
			lineHeight: 28,
			textAlign: "center",
		},
		timeRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			marginBottom: 8,
		},
		timePill: {
			width: 120,
			height: 38,
			borderRadius: 19,
			borderWidth: 1.5,
			borderColor: colors.primary_base_3,
			alignItems: "center",
			justifyContent: "center",
		},
		timeInput: {
			width: "100%",
			fontFamily: "Inter-SemiBold",
			fontSize: 18,
			textAlign: "center",
			paddingVertical: 0,
		},
		descriptionBox: {
			width: "100%",
			height: 140,
			borderWidth: 1.5,
			borderColor: colors.primary_base_3,
			borderRadius: 12,
			position: "relative",
		},
		descriptionInput: {
			flex: 1,
			fontFamily: "Inter-Regular",
			fontSize: 16,
			lineHeight: 22,
			paddingHorizontal: 20,
			paddingTop: 20,
			paddingRight: 58,
			paddingBottom: 30,
		},
		descriptionCounter: {
			position: "absolute",
			right: 14,
			bottom: 8,
			fontSize: 11,
		},
		microphoneButton: {
			position: "absolute",
			right: 12,
			top: 12,
			width: 38,
			height: 38,
			borderRadius: 19,
			borderWidth: 1.5,
			borderColor: colors.primary_base,
			alignItems: "center",
			justifyContent: "center",
		},
		audioStatusRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			marginTop: 8,
		},
		sectionGap: {
			marginTop: 28,
		},
		intensityTrack: {
			width: "98%",
			alignSelf: "center",
			height: 40,
			borderRadius: 16,
			paddingHorizontal: 5,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		intensityItem: {
			width: 30,
			height: 30,
			borderRadius: 20,
			alignItems: "center",
			justifyContent: "center",
		},
		intensityText: {
			textAlign: "center",
			fontSize: 15,
		},
		prosthesisOptions: {
			paddingVertical: 12,
			paddingHorizontal: 8,
			gap: 26,
		},
		prosthesisOption: {
			width: 94,
			alignItems: "center",
		},
		radioOuter: {
			width: 25,
			height: 25,
			borderRadius: 15,
			borderWidth: 2,
			borderColor: colors.secondary_base_0c,
			alignItems: "center",
			justifyContent: "center",
		},
		radioOuterSelected: {
			borderColor: colors.primary_base,
		},
		radioInner: {
			width: 12,
			height: 12,
			borderRadius: 8,
		},
		prosthesisName: {
			marginTop: 8,
			fontSize: 12,
			textAlign: "center",
		},
		noProsthesisText: {
			marginTop: 20,
			textAlign: "center",
		},
		schemaSection: {
			marginTop: 20,
			alignItems: "center",
		},
		schemaTitle: {
			fontSize: 27,
			lineHeight: 32,
			marginBottom: 18,
		},
		schemaRow: {
			width: "100%",
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		fileSection: {
			alignItems: "center",
			marginTop: 26,
		},
		addFileRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 16,
		},
		addFileCircle: {
			width: 30,
			height: 30,
			borderRadius: 26,
			alignItems: "center",
			justifyContent: "center",
		},
		addFileText: {
			fontSize: 18,
		},
		fileDescription: {
			maxWidth: 200,
			fontFamily: "Inter-SemiBold",
			fontSize: 10,
			marginTop: 16,
			textAlign: "center",
			lineHeight: 14,
		},
		photoRow: {
			flexDirection: "row",
			gap: 10,
			marginTop: 16,
		},
		photoWrapper: {
			position: "relative",
		},
		photoPreview: {
			width: 82,
			height: 82,
			borderRadius: 10,
			borderWidth: 1,
			borderColor: colors.primary_base_3,
		},
		photoRemove: {
			position: "absolute",
			right: -7,
			top: -7,
			width: 24,
			height: 24,
			borderRadius: 12,
			alignItems: "center",
			justifyContent: "center",
		},
		saveButton: {
			width: "75%",
			height: 60,
			alignSelf: "center",
			borderRadius: 20,
			borderWidth: 4,
			borderColor: colors.accent_base,
			alignItems: "center",
			justifyContent: "center",
			marginTop: 30,
			shadowColor: colors.primary_base_3,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.5,
			shadowRadius: 9,
			elevation: 5,
		},
		disabledButton: {
			opacity: 0.55,
		},
		saveButtonText: {
			fontSize: 18,
		},
		scrollTopButton: {
			width: 50,
			height: 50,
			borderRadius: 33,
			alignItems: "center",
			justifyContent: "center",
			alignSelf: "flex-end",
			marginTop: 28,
		},
	})
