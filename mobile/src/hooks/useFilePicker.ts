import { useCallback, useEffect, useRef } from "react"
import { Alert, Linking, Platform } from "react-native"
import { useTranslation } from "react-i18next"
import {
	FilePermissionError,
	pickManagedFile,
	type FileSource,
} from "@/src/services/filePickerService"
import type { PickedFile } from "@/src/utils/fileMetadata"

export function useFilePicker() {
	const { t } = useTranslation()
	const mounted = useRef(true)
	const sourceDismiss = useRef<(() => void) | null>(null)
	const onSourceDismiss = useCallback(() => {
		const resolve = sourceDismiss.current
		sourceDismiss.current = null
		resolve?.()
	}, [])

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
			onSourceDismiss()
		}
	}, [onSourceDismiss])

	const pickFile = async (
		source: FileSource,
		hideSource: () => void
	): Promise<PickedFile | null> => {
		try {
			await new Promise<void>((resolve) => {
				if (Platform.OS === "ios") sourceDismiss.current = resolve
				else setTimeout(resolve, 250)
				hideSource()
			})
			if (!mounted.current) return null
			const result = await pickManagedFile(source)
			return mounted.current ? result : null
		} catch (error) {
			if (!mounted.current) return null
			if (error instanceof FilePermissionError) {
				const buttons: {
					text: string
					style?: "cancel"
					onPress?: () => void
				}[] = [{ text: t("common.cancel"), style: "cancel" }]
				if (!error.canAskAgain) {
					buttons.push({
						text: t("files.settings"),
						onPress: () => {
							void (async () => {
								try {
									await Linking.openSettings()
								} catch (settingsError) {
									console.error("Could not open settings:", settingsError)
									Alert.alert(t("common.error"), t("files.permissionSettings"))
								}
							})()
						},
					})
				}
				Alert.alert(
					t("common.error"),
					t(error.canAskAgain ? "files.permission" : "files.permissionSettings"),
					buttons
				)
			} else {
				console.error("File picker failed:", error)
				Alert.alert(t("common.error"), t("files.errors.pick"))
			}
			return null
		}
	}

	return { pickFile, onSourceDismiss }
}
