import { useEffect, useSyncExternalStore } from "react"
import Storage from "expo-sqlite/kv-store"

const STORAGE_KEY = "myprosthetic.settings34.preferences.v1"

export interface SettingsPreferences {
	pushEnabled: boolean
	emailEnabled: boolean
	newRecommendations: boolean
	stumpMeasurements: boolean
	measurementTime: string
	backgroundSync: boolean
	wifiOnly: boolean
	mediaBackup: boolean
}

const initialPreferences: SettingsPreferences = {
	pushEnabled: false,
	emailEnabled: false,
	newRecommendations: true,
	stumpMeasurements: true,
	measurementTime: "08:00",
	backgroundSync: true,
	wifiOnly: true,
	mediaBackup: false,
}

type PreferencesSnapshot = { preferences: SettingsPreferences; ready: boolean }

// Shared by all settings screens. Separate hook instances must not each persist
// their own (potentially stale) copy of the full preferences object.
let snapshot: PreferencesSnapshot = { preferences: initialPreferences, ready: false }
const subscribers = new Set<() => void>()
let loading: Promise<void> | null = null
let pendingSave: Promise<void> = Promise.resolve()
let clearing = false

function notify() {
	for (const subscriber of subscribers) subscriber()
}

function subscribe(subscriber: () => void) {
	subscribers.add(subscriber)
	return () => {
		subscribers.delete(subscriber)
	}
}

function getSnapshot() {
	return snapshot
}

function parsePreferences(raw: string | null): SettingsPreferences {
	const next = { ...initialPreferences }
	if (!raw) return next
	const decoded: unknown = JSON.parse(raw)
	if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return next
	const values = decoded as Record<string, unknown>
	for (const key of Object.keys(initialPreferences) as (keyof SettingsPreferences)[]) {
		const value = values[key]
		if (key === "measurementTime") {
			if (typeof value === "string" && /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(value)) {
				next.measurementTime = value
			}
		} else if (typeof value === "boolean") {
			Object.assign(next, { [key]: value })
		}
	}
	return next
}

function loadPreferences(): Promise<void> {
	if (loading) return loading
	loading = (async () => {
		let preferences = initialPreferences
		try {
			preferences = parsePreferences(await Storage.getItem(STORAGE_KEY))
		} catch (error) {
			console.warn("Could not read settings preferences", error)
		}
		snapshot = { preferences, ready: true }
		notify()
	})()
	return loading
}

function updatePreference<K extends keyof SettingsPreferences>(
	key: K,
	value: SettingsPreferences[K]
) {
	if (!snapshot.ready || clearing || snapshot.preferences[key] === value) return
	const preferences = { ...snapshot.preferences, [key]: value }
	snapshot = { preferences, ready: true }
	notify()

	// Each queued write captures the latest shared snapshot; ordering is preserved.
	// A failed write does not block later updates or deletion cleanup.
	pendingSave = pendingSave
		.catch(() => undefined)
		.then(() => Storage.setItem(STORAGE_KEY, JSON.stringify(preferences)))
	pendingSave.catch((error: unknown) => {
		console.warn("Could not persist settings preferences", error)
	})
}

export async function clearSettingsPreferences(): Promise<void> {
	clearing = true
	try {
		await loadPreferences()
		await pendingSave.catch(() => undefined)
		await Storage.removeItem(STORAGE_KEY)
	} finally {
		snapshot = { preferences: { ...initialPreferences }, ready: true }
		notify()
		clearing = false
	}
}

export function useSettingsPreferences() {
	const { preferences, ready } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
	useEffect(() => {
		void loadPreferences()
	}, [])
	return { preferences, ready, updatePreference }
}
