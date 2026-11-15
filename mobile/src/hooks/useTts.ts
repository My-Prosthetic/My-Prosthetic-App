import * as Speech from "expo-speech"
import { useSettings } from "@/context/SettingsContext"

export function useTts() {
	const { ttsEnabled, language } = useSettings()

	const speak = (text: string) => {
		if (!ttsEnabled) return

		void Speech.stop()

		Speech.speak(text, {
			language: language === "pl" ? "pl-PL" : "en-US",
		})
	}

	const stop = () => {
		void Speech.stop()
	}

	return {
		speak,
		stop,
		ttsEnabled,
	}
}
