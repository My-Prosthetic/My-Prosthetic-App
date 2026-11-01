import { useEffect, useMemo, useRef, useState } from "react"
import {
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleProp,
	StyleSheet,
	TextStyle,
	useWindowDimensions,
	View,
} from "react-native"
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
import { getComponentsByProsthesisId } from "@/db/repositories/componentRepository"
import { getAllProstheses, type Prosthesis } from "@/db/repositories/prosthesisRepository"
import { IncidentBodyMap, type IncidentBodyView } from "@/src/components/incidents/IncidentBodyMap"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { DropdownSelect } from "@/src/components/DropdownSelect"
import { ThemedInput } from "@/src/components/ThemedInput"
import IconChevronDown from "@/assets/icons/incident/chevron-down.svg"
import IconSchemaArrow from "@/assets/icons/incident/schema-arrow.svg"
import IconFile from "@/assets/icons/incident/file.svg"
import IconPlus from "@/assets/icons/incident/plus.svg"
import IconClose from "@/assets/icons/incident/close.svg"
import IconMic from "@/assets/icons/incident/mic.svg"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

type IncidentComponent = Awaited<ReturnType<typeof getComponentsByProsthesisId>>[number]

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
const WEEKDAY_KEYS = [
	"newIncident.weekdays.sun",
	"newIncident.weekdays.mon",
	"newIncident.weekdays.tue",
	"newIncident.weekdays.wed",
	"newIncident.weekdays.thu",
	"newIncident.weekdays.fri",
	"newIncident.weekdays.sat",
] as const
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
	const { width } = useWindowDimensions()
	const styles = useMemo(() => getStyles(colors, width), [colors, width])
	const scrollRef = useRef<ScrollView>(null)
	const incidentIdRef = useRef(Crypto.randomUUID())
	const savedRef = useRef(false)
	const dateScrollRef = useRef<ScrollView>(null)
	const now = useMemo(() => new Date(), [])
	const [selectedDate, setSelectedDate] = useState(now)
	const [timeText, setTimeText] = useState(toTimeText(now))
	const [timePickerOpen, setTimePickerOpen] = useState(false)
	const [incidentType, setIncidentType] = useState("")
	const [activity, setActivity] = useState("")
	const [description, setDescription] = useState("")
	const [intensity, setIntensity] = useState(0)
	const [prostheses, setProstheses] = useState<Prosthesis[]>([])
	const [selectedProsthesisId, setSelectedProsthesisId] = useState<string>()
	const [components, setComponents] = useState<IncidentComponent[]>([])
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
	const showMap = selectedComponent?.model.type === "socket" && !hideMapForType
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
	const getComponentLabel = (component: IncidentComponent) => {
		const description = component.description?.trim()

		if (description) return description

		return `${component.model.brand.name} | ${component.model.name}`
	}
	const componentOptions = useMemo<SelectOption[]>(
		() => [
			{ label: t("newIncident.none"), value: "" },
			...components.map((component) => ({
				label: getComponentLabel(component),
				value: component.id,
			})),
		],
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
		if (new Date(occurredAt).getTime() > Date.now()) {
			Alert.alert(t("common.error"), t("newIncident.validation.futureDate"))
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
		<ThemedView colorName="bg_1" style={styles.screen}>
			<ThemedHeader tx="newIncident.title" style={styles.incidentHeader} />

			<ScrollView
				ref={scrollRef}
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<ThemedView colorName="bg_0" style={styles.dateCard}>
					<ScrollView
						horizontal
						ref={dateScrollRef}
						contentContainerStyle={styles.dateStrip}
						showsHorizontalScrollIndicator={false}
						onContentSizeChange={() => dateScrollRef.current?.scrollToEnd({ animated: false })}
					>
						{dates.map((date) => {
							const selected = toDateKey(date) === toDateKey(selectedDate)
							const weekday = t(WEEKDAY_KEYS[date.getDay()])
							return (
								<ThemedView
									key={toDateKey(date)}
									onPress={() => setSelectedDate(date)}
									style={styles.dateItem}
								>
									<ThemedText variant="H1" colorName="blue1" style={styles.dateWeekday}>
										{weekday}
									</ThemedText>
									<ThemedView colorName={selected ? "blue2" : "bg_0"} style={styles.dateDayBox}>
										<ThemedText
											variant="H3"
											colorName={selected ? "bg_0" : "blue2"}
											style={styles.dateDay}
										>
											{date.getDate()}
										</ThemedText>
									</ThemedView>
								</ThemedView>
							)
						})}
					</ScrollView>
				</ThemedView>

				<View style={styles.timeRow}>
					<FieldLabel text={t("newIncident.time")} style={styles.timeLabel} />
					<ThemedView
						colorName="bg_0"
						borderColor="blue1"
						onPress={() => setTimePickerOpen(true)}
						style={styles.timeSelect}
					>
						<ThemedText variant="H3" colorName="graphite0" style={styles.timeValue}>
							{timeText}
						</ThemedText>
						<Arrow direction="down" size={18} color={colors.blue1} />
					</ThemedView>
				</View>

				<FieldLabel text={t("newIncident.type")} />
				<DropdownSelect
					variant="incident"
					label={t("newIncident.type")}
					options={typeOptions.filter((option) => option.value !== CUSTOM_VALUE)}
					value={incidentType || undefined}
					placeholder={t("newIncident.selectType")}
					onChange={selectIncidentType}
					customLast={{
						tx: "newIncident.customValuePlaceholder",
						onPress: () => selectIncidentType(CUSTOM_VALUE),
					}}
					renderChevron={() => <Arrow direction="down" size={18} color={colors.blue1} />}
					renderCreateIcon={() => <IconPlus color={colors.blue1} width={18} height={18} />}
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
					variant="incident"
					label={t("newIncident.circumstances")}
					options={activityOptions.filter((option) => option.value !== CUSTOM_VALUE)}
					value={activity}
					placeholder={t("newIncident.none")}
					onChange={selectActivity}
					customLast={{
						tx: "newIncident.customValuePlaceholder",
						onPress: () => selectActivity(CUSTOM_VALUE),
					}}
					renderChevron={() => <Arrow direction="down" size={18} color={colors.blue1} />}
					renderCreateIcon={() => <IconPlus color={colors.blue1} width={18} height={18} />}
				/>
				{customActivityMode && (
					<CustomValueInput
						value={customActivityDraft}
						onChange={setCustomActivityDraft}
						onAdd={addCustomActivity}
					/>
				)}

				<FieldLabel text={t("newIncident.description")} />
				<ThemedInput
					variant="note"
					value={description}
					onChangeText={setDescription}
					placeholder={t("newIncident.descriptionPlaceholder")}
					maxLength={DESCRIPTION_MAX_LENGTH}
					viewStyle={styles.descriptionBox}
					textStyle={styles.descriptionInput}
				/>
				<View style={styles.audioActionRow}>
					<ThemedView
						onPress={() => void (recorderState.isRecording ? stopRecording() : startRecording())}
						colorName="bg_1"
						style={styles.audioButton}
					>
						<IconMic
							color={recorderState.isRecording ? colors.false : colors.blue2}
							width={18}
							height={18}
						/>
						<ThemedText variant="H4" colorName={recorderState.isRecording ? "false" : "blue2"}>
							{t(recorderState.isRecording ? "newIncident.stopAudio" : "newIncident.recordAudio")}
						</ThemedText>
					</ThemedView>
					{audioUri && !recorderState.isRecording && (
						<ThemedView
							onPress={() => {
								deleteIncidentMediaFile(audioUri)
								setAudioUri(undefined)
							}}
							style={styles.audioRemove}
						>
							<ThemedText variant="H4" colorName="false">
								{t("newIncident.remove")}
							</ThemedText>
						</ThemedView>
					)}
				</View>
				{(recorderState.isRecording || audioUri) && (
					<ThemedText variant="body1Regular" colorName="blue2" style={styles.audioStatus}>
						{recorderState.isRecording
							? t("newIncident.recording", {
									seconds: Math.floor(recorderState.durationMillis / 1000),
								})
							: t("newIncident.voiceNoteAdded")}
					</ThemedText>
				)}

				{!hideIntensity && (
					<>
						<FieldLabel text={t("newIncident.intensity")} />
						<ThemedView colorName="bg_0" borderColor="blue1" style={styles.intensityTrack}>
							<View style={styles.intensityInner}>
								{Array.from({ length: 10 }, (_, index) => {
									const value = index + 1
									return (
										<ThemedView
											key={value}
											colorName={intensity === value ? "blue2" : "bg_0"}
											onPress={() => setIntensity(value)}
											accessibilityLabel={`${t("newIncident.intensity")} ${value}`}
											accessibilityState={{ selected: intensity === value }}
											style={styles.intensityItem}
										>
											<ThemedText
												variant="H3"
												colorName={intensity === value ? "bg_0" : "graphite0"}
												style={styles.intensityText}
											>
												{value}
											</ThemedText>
										</ThemedView>
									)
								})}
							</View>
						</ThemedView>
					</>
				)}

				{prostheses.length > 1 && (
					<>
						<FieldLabel text={t("newIncident.relatedProsthesis")} />
						<DropdownSelect
							variant="incident"
							label={t("newIncident.relatedProsthesis")}
							options={prostheses.map((prosthesis) => ({
								label: prosthesis.name,
								value: prosthesis.id,
							}))}
							value={selectedProsthesisId}
							placeholder="-"
							onChange={setSelectedProsthesisId}
							renderChevron={() => <Arrow direction="down" size={18} color={colors.blue1} />}
						/>
					</>
				)}

				{selectedProsthesisId && (
					<>
						<FieldLabel text={t("newIncident.component")} />
						<DropdownSelect
							variant="incident"
							label={t("newIncident.component")}
							options={componentOptions}
							value={selectedComponentId ?? ""}
							placeholder={t("newIncident.none")}
							onChange={(value) => {
								setSelectedComponentId(value || undefined)
								setCoordinates(undefined)
							}}
							renderChevron={() => <Arrow direction="down" size={18} color={colors.blue1} />}
						/>
					</>
				)}

				{showMap && (
					<View style={styles.schemaSection}>
						<FieldLabel text={t("newIncident.schema")} style={styles.schemaTitle} />
						<View style={styles.schemaRow}>
							<ThemedView
								onPress={() =>
									setBodyViewIndex(
										(current) => (current - 1 + BODY_VIEWS.length) % BODY_VIEWS.length
									)
								}
								style={styles.schemaArrow}
							>
								<Arrow direction="left" size={40} color={colors.blue2} />
							</ThemedView>
							<View style={styles.bodyMapContainer}>
								<IncidentBodyMap
									view={currentBodyView}
									value={coordinates}
									onChange={setCoordinates}
								/>
							</View>
							<ThemedView
								onPress={() => setBodyViewIndex((current) => (current + 1) % BODY_VIEWS.length)}
								style={styles.schemaArrow}
							>
								<Arrow direction="right" size={40} color={colors.blue2} />
							</ThemedView>
						</View>
					</View>
				)}

				<View style={styles.fileSection}>
					<ThemedView
						colorName="blue0"
						onPress={showAddPhotoActions}
						style={styles.addFileRow}
						accessibilityLabel={t("newIncident.addImages")}
					>
						<IconFile color={colors.blue2} width={23} height={23} />
						<ThemedText variant="H1" colorName="graphite0" style={styles.addFileText}>
							{t("newIncident.addImages")}
						</ThemedText>
						<IconPlus color={colors.graphite0} width={18} height={18} />
					</ThemedView>

					{photoUris.map((uri, index) => (
						<View key={uri} style={styles.photoRow}>
							<ThemedText variant="H3" colorName="blue2" style={styles.photoName}>
								• {t("newIncident.photoName")}_{index + 1}
								{getMediaExtension(uri, ".jpg")}
							</ThemedText>
							<ThemedView
								onPress={() => removePhoto(uri)}
								accessibilityLabel={t("newIncident.removePhoto", { number: index + 1 })}
								style={styles.removePhotoButton}
							>
								<IconClose color={colors.false} width={19} height={19} />
							</ThemedView>
						</View>
					))}
				</View>

				{!selectedProsthesisId && (
					<ThemedText variant="body1Regular" colorName="false" style={styles.saveHint}>
						{t("newIncident.assignProsthesisHint")}
					</ThemedText>
				)}

				<ThemedView
					colorName="blue2"
					onPress={() => void saveIncident()}
					disabled={isSaving || !selectedProsthesisId}
					style={[styles.saveButton, (isSaving || !selectedProsthesisId) && styles.disabledButton]}
				>
					<ThemedText variant="H1" colorName="bg_0" style={styles.saveButtonText}>
						{t(isSaving ? "newIncident.saving" : "newIncident.save")}
					</ThemedText>
				</ThemedView>
			</ScrollView>

			{timePickerOpen && (
				<IncidentTimePicker
					visible
					timeText={timeText}
					maxTimeText={
						toDateKey(selectedDate) === toDateKey(new Date()) ? toTimeText(new Date()) : undefined
					}
					onClose={() => setTimePickerOpen(false)}
					onConfirm={(time) => {
						setTimeText(time)
						setTimePickerOpen(false)
					}}
					cancelLabel={t("common.cancel")}
				/>
			)}
		</ThemedView>
	)
}

function Arrow({
	direction,
	size,
	color,
}: {
	direction: "left" | "right" | "down"
	size: number
	color: string
}) {
	return (
		<View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
			{direction === "down" ? (
				<IconChevronDown width={size} height={size * (12 / 20)} color={color} />
			) : (
				<View style={direction === "left" ? { transform: [{ scaleX: -1 }] } : undefined}>
					<IconSchemaArrow width={size * (22 / 40)} height={size} color={color} />
				</View>
			)}
		</View>
	)
}

function FieldLabel({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
	return (
		<ThemedText variant="H1" colorName="blue2" style={[localStyles.fieldLabel, style]}>
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
		<View style={localStyles.customValueRow}>
			<ThemedInput
				variant="regular"
				value={value}
				onChangeText={onChange}
				placeholder={t("newIncident.customValuePlaceholder")}
				viewStyle={localStyles.customValueInput}
			/>
			<ThemedView onPress={onAdd} colorName="blue2" style={localStyles.customValueButton}>
				<IconPlus color={colors.bg_0} width={20} height={20} />
			</ThemedView>
		</View>
	)
}

const WHEEL_ROW_HEIGHT = 60

function TimeWheel({
	value,
	max,
	onChange,
}: {
	value: number
	max: number
	onChange: (value: number) => void
}) {
	const ref = useRef<ScrollView>(null)
	const values = useMemo(() => Array.from({ length: max + 1 }, (_, index) => index), [max])
	const updateFromScroll = (offset: number) => {
		onChange(Math.max(0, Math.min(max, Math.round(offset / WHEEL_ROW_HEIGHT))))
	}
	useEffect(() => {
		ref.current?.scrollTo({ y: value * WHEEL_ROW_HEIGHT, animated: false })
	}, [value])
	return (
		<ScrollView
			ref={ref}
			style={localStyles.wheel}
			contentContainerStyle={localStyles.wheelContent}
			showsVerticalScrollIndicator={false}
			nestedScrollEnabled
			snapToInterval={WHEEL_ROW_HEIGHT}
			decelerationRate="fast"
			onContentSizeChange={() =>
				ref.current?.scrollTo({ y: value * WHEEL_ROW_HEIGHT, animated: false })
			}
			onMomentumScrollEnd={(event) => updateFromScroll(event.nativeEvent.contentOffset.y)}
			onScrollEndDrag={(event) => updateFromScroll(event.nativeEvent.contentOffset.y)}
		>
			{values.map((option) => (
				<ThemedView
					key={option}
					onPress={() => {
						ref.current?.scrollTo({ y: option * WHEEL_ROW_HEIGHT, animated: true })
						onChange(option)
					}}
					style={localStyles.wheelItem}
				>
					<ThemedText
						variant="H0"
						colorName={option === value ? "blue2" : "blue1"}
						style={option === value ? localStyles.wheelSelectedText : localStyles.wheelText}
					>
						{String(option).padStart(2, "0")}
					</ThemedText>
				</ThemedView>
			))}
		</ScrollView>
	)
}

function IncidentTimePicker({
	visible,
	timeText,
	maxTimeText,
	onConfirm,
	onClose,
	cancelLabel,
}: {
	visible: boolean
	timeText: string
	maxTimeText?: string
	onConfirm: (time: string) => void
	onClose: () => void
	cancelLabel: string
}) {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const [parsedHours, parsedMinutes] = timeText.split(":").map(Number)
	const [maxHours, maxMinutes] = maxTimeText?.split(":").map(Number) ?? [23, 59]
	const initialHours = Math.min(parsedHours || 0, maxHours)
	const initialMinutes =
		initialHours === maxHours ? Math.min(parsedMinutes || 0, maxMinutes) : parsedMinutes || 0
	const [hours, setHours] = useState(initialHours)
	const [minutes, setMinutes] = useState(initialMinutes)
	const minuteMax = hours === maxHours ? maxMinutes : 59

	const handleHoursChange = (value: number) => {
		setHours(value)
		if (value === maxHours && minutes > maxMinutes) {
			setMinutes(maxMinutes)
		}
	}

	const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={localStyles.modalRoot}>
				<Pressable
					onPress={onClose}
					style={[StyleSheet.absoluteFill, { backgroundColor: colors.graphite0, opacity: 0.35 }]}
				/>
				<ThemedView colorName="bg_1" borderColor="blue1" style={localStyles.modalCard}>
					<ThemedText variant="H3" colorName="blue2" style={localStyles.modalTitle}>
						{t("newIncident.chooseTime")}
					</ThemedText>
					<View style={localStyles.wheelsContainer}>
						<ThemedView
							colorName="blue0"
							style={localStyles.selectedWheelRow}
							pointerEvents="none"
						/>
						<TimeWheel value={hours} max={maxHours} onChange={handleHoursChange} />
						<ThemedText variant="H0" colorName="blue2" style={localStyles.wheelColon}>
							:
						</ThemedText>
						<TimeWheel value={minutes} max={minuteMax} onChange={setMinutes} />
					</View>
					<View style={localStyles.modalActions}>
						<ThemedView
							colorName="bg_0"
							borderColor="graphite0"
							onPress={onClose}
							style={localStyles.cancelTimeButton}
						>
							<IconClose color={colors.graphite0} width={19} height={19} />
							<ThemedText variant="H2" colorName="graphite0">
								{cancelLabel}
							</ThemedText>
						</ThemedView>
						<ThemedView
							colorName="blue2"
							onPress={() => onConfirm(formatted)}
							style={localStyles.confirmTimeButton}
						>
							<ThemedText
								variant="H2"
								colorName="bg_0"
								style={localStyles.confirmTimeText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.75}
							>
								{t("newIncident.confirmTime")} {formatted}
							</ThemedText>
						</ThemedView>
					</View>
				</ThemedView>
			</View>
		</Modal>
	)
}

const localStyles = StyleSheet.create({
	fieldLabel: {
		marginTop: 16,
		marginBottom: 9,
		textAlign: "left",
		textTransform: "uppercase",
	},
	customValueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9 },
	customValueInput: { flex: 1, width: "auto" },
	customValueButton: {
		width: 48,
		height: 48,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
	},
	modalRoot: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
	modalCard: {
		width: "100%",
		maxWidth: 420,
		paddingTop: 24,
		paddingHorizontal: 22,
		paddingBottom: 20,
		borderRadius: 22,
	},
	modalTitle: { textAlign: "center", fontSize: 23, lineHeight: 30 },
	wheelsContainer: {
		position: "relative",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		height: 190,
		marginTop: 22,
		marginBottom: 22,
	},
	selectedWheelRow: {
		position: "absolute",
		height: WHEEL_ROW_HEIGHT,
		left: 28,
		right: 28,
		top: 65,
		borderRadius: 18,
	},
	wheel: { flexGrow: 0, width: 95, height: 180 },
	wheelContent: { paddingVertical: WHEEL_ROW_HEIGHT },
	wheelItem: { height: WHEEL_ROW_HEIGHT, alignItems: "center", justifyContent: "center" },
	wheelText: { fontSize: 28, lineHeight: 36 },
	wheelSelectedText: { fontSize: 30, lineHeight: 38 },
	wheelColon: { width: 28, textAlign: "center", fontSize: 30, zIndex: 1 },
	modalActions: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
	cancelTimeButton: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 9,
		minWidth: 115,
		height: 48,
		paddingHorizontal: 11,
		borderRadius: 17,
	},
	confirmTimeButton: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		minHeight: 48,
		borderRadius: 17,
	},
	confirmTimeText: { fontSize: 15 },
})

const getStyles = (colors: ThemeColors, width: number) => {
	{
		const gutter = width < 360 ? 18 : 32
		const intensityCellWidth = Math.min(28, Math.floor((width - 2 * gutter - 16) / 10))
		const dateCellWidth = Math.max(44, (width - 24) / 7)
		const styles = StyleSheet.create({
			screen: { flex: 1, borderRadius: 0 },
			scroll: { flex: 1 },
			content: { paddingHorizontal: gutter, paddingTop: 0, paddingBottom: 48 },
			dateCard: {
				marginHorizontal: -gutter,
				marginBottom: 24,
				borderBottomLeftRadius: 16,
				borderBottomRightRadius: 16,
				borderTopLeftRadius: 0,
				borderTopRightRadius: 0,
				paddingVertical: 15,
				shadowColor: colors.graphite0,
				shadowOffset: { width: 0, height: 3 },
				shadowOpacity: 0.1,
				shadowRadius: 6,
				elevation: 3,
			},
			dateStrip: { paddingHorizontal: 12, alignItems: "center" },
			dateItem: {
				width: dateCellWidth,
				minHeight: 70,
				alignItems: "center",
				justifyContent: "center",
				borderRadius: 0,
			},
			dateWeekday: {
				fontSize: width < 360 ? 11 : 13,
				lineHeight: 19,
				textAlign: "center",
				marginBottom: 7,
			},
			dateDayBox: {
				width: 32,
				height: 32,
				borderRadius: 18,
				alignItems: "center",
				justifyContent: "center",
			},
			dateDay: { fontSize: 15, lineHeight: 18, textAlign: "center" },
			timeRow: {
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				marginBottom: -3,
				gap: 12,
			},
			timeLabel: { marginTop: 0, marginBottom: 0, flexShrink: 1 },
			timeSelect: {
				minWidth: width < 360 ? 130 : 156,
				height: 44,
				borderRadius: 16,
				paddingHorizontal: 13,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			},
			timeValue: { fontSize: 16 },
			descriptionBox: {
				minHeight: 90,
				borderRadius: 16,
				justifyContent: "flex-start",
				backgroundColor: colors.bg_0,
			},
			descriptionInput: {
				paddingTop: 14,
				paddingLeft: 20,
				paddingRight: 14,
				fontSize: 16,
				lineHeight: 21,
				minHeight: 90,
			},
			audioActionRow: {
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "flex-end",
				marginTop: 4,
				gap: 8,
			},
			audioButton: {
				flexDirection: "row",
				alignItems: "center",
				gap: 6,
				minHeight: 44,
				paddingHorizontal: 6,
			},
			audioRemove: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
			audioStatus: { textAlign: "right", marginTop: 0 },
			intensityTrack: {
				borderRadius: 16,
				height: 45,
				justifyContent: "center",
			},

			intensityInner: {
				width: "100%",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				paddingHorizontal: 6,
			},

			intensityItem: {
				width: intensityCellWidth,
				height: 32,
				borderRadius: 16,
				alignItems: "center",
				justifyContent: "center",
			},

			intensityText: {
				fontSize: width < 360 ? 13 : 15,
				lineHeight: 18,
				textAlign: "center",
			},
			infoText: { marginTop: 6, textAlign: "center" },
			saveHint: { marginTop: 24, marginBottom: -18, textAlign: "center" },
			schemaSection: { marginTop: 18 },
			schemaTitle: { marginTop: 0, marginBottom: 18 },
			schemaRow: {
				width: "100%",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
				minHeight: 235,
			},
			schemaArrow: {
				width: 44,
				height: 60,
				flexShrink: 0,
				justifyContent: "center",
				alignItems: "center",
			},
			bodyMapContainer: { flex: 1, alignItems: "center", justifyContent: "center", minWidth: 0 },
			fileSection: { marginTop: 24 },
			addFileRow: {
				width: "100%",
				minHeight: 54,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				paddingHorizontal: 19,
				gap: 13,
				borderRadius: 20,
			},
			addFileText: { flex: 1, fontSize: width < 360 ? 12 : 14, lineHeight: 18 },
			photoRow: {
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				minHeight: 44,
				gap: 4,
			},
			photoName: { fontSize: 14 },
			removePhotoButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
			saveButton: {
				height: 52,
				width: "100%",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: 19,
				marginTop: 30,
			},
			disabledButton: { opacity: 0.5 },
			saveButtonText: { fontSize: 14, lineHeight: 19 },
			incidentHeader: { marginBottom: 0, zIndex: 10, elevation: 5 },
		})
		return styles
	}
}
