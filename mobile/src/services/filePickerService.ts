import { Platform } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import * as IntentLauncher from "expo-intent-launcher"
import * as Sharing from "expo-sharing"
import { File } from "expo-file-system"
import { getManagedFile, type FileAccess } from "./fileStorageService"
import { getDatabaseSession } from "@/db/client"
import { ManagedFileError, pickedFile, type PickedFile } from "@/src/utils/fileMetadata"

export type FileSource = "camera" | "gallery" | "documents"
export class FilePermissionError extends Error {
	constructor(public readonly canAskAgain: boolean) {
		super("cameraPermission")
	}
}

export async function pickManagedFile(source: FileSource): Promise<PickedFile | null> {
	if (source === "documents") {
		const result = await DocumentPicker.getDocumentAsync({
			type: "*/*",
			copyToCacheDirectory: true,
			multiple: false,
		})
		if (result.canceled) return null
		const asset = result.assets[0]
		return pickedFile({
			uri: asset.uri,
			name: asset.name,
			mimeType: asset.mimeType,
			size: asset.size,
		})
	}
	if (source === "camera") {
		const permission = await ImagePicker.requestCameraPermissionsAsync()
		if (!permission.granted) throw new FilePermissionError(permission.canAskAgain)
	}
	const result =
		source === "camera"
			? await ImagePicker.launchCameraAsync({
					mediaTypes: ["images"],
					quality: 1,
					allowsEditing: false,
				})
			: await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ["images", "videos"],
					quality: 1,
					allowsEditing: false,
					allowsMultipleSelection: false,
					preferredAssetRepresentationMode:
						ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
				})
	if (result.canceled) return null
	return imagePickerFile(result.assets[0])
}

export function imagePickerFile(asset: ImagePicker.ImagePickerAsset): PickedFile {
	const localName = new File(asset.uri).name
	const originalExtension = asset.fileName?.match(/\.[a-zA-Z0-9]{1,12}$/)?.[0]
	const localExtension = localName.match(/\.[a-zA-Z0-9]{1,12}$/)?.[0]
	const name =
		asset.fileName &&
		(!localExtension || originalExtension?.toLowerCase() === localExtension.toLowerCase())
			? asset.fileName
			: localName
	return pickedFile({ uri: asset.uri, name, mimeType: asset.mimeType, size: asset.fileSize })
}

export async function openManagedFile(access: FileAccess, id: string, title: string) {
	const file = await getManagedFile(access, id)
	if (getDatabaseSession() !== access.session) throw new ManagedFileError("context")
	if (Platform.OS === "android" && file.contentUri) {
		await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
			data: file.contentUri,
			flags: 1,
			type: file.mimeType ?? "*/*",
		})
		return
	}
	if (!(await Sharing.isAvailableAsync())) throw new ManagedFileError("unavailable")
	if (getDatabaseSession() !== access.session) throw new ManagedFileError("context")
	await Sharing.shareAsync(file.uri, { mimeType: file.mimeType ?? undefined, dialogTitle: title })
}
