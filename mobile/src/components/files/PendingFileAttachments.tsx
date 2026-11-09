import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { createUser, getLatestUser } from "@/db/repositories/userRepository"
import { captureFileAccess, saveManagedEntry } from "@/src/services/fileStorageService"
import {
	FilePermissionError,
	pickManagedFile,
	type FileSource,
} from "@/src/services/filePickerService"
import { validFileName, type FileContext, type PickedFile } from "@/src/utils/fileMetadata"
import { ThemedInput } from "@/src/components/ThemedInput"
import { ThemedText } from "@/src/components/ThemedText"
import { FileSheet, FileSheetButton } from "./FileSheet"
import IconClose from "@/assets/icons/incident/close.svg"

type QueuedFile = { id: number; file: PickedFile; name: string }

export type PendingFileAttachmentsHandle = {
	open: () => void
	save: (context: FileContext) => Promise<void>
}

export const PendingFileAttachments = forwardRef<PendingFileAttachmentsHandle, object>(
	function PendingFileAttachments(_props, ref) {
		const { colors } = useTheme()
		const { t } = useTranslation()
		const { status } = useAuth()
		const [sheet, setSheet] = useState<"source" | "rename" | null>(null)
		const [picked, setPicked] = useState<PickedFile | null>(null)
		const [fileName, setFileName] = useState("")
		const [files, setFiles] = useState<QueuedFile[]>([])
		const filesRef = useRef<QueuedFile[]>([])
		const counter = useRef(0)
		const picking = useRef(false)
		const saving = useRef(false)
		const dismissSource = useRef<(() => void) | null>(null)

		const setQueued = (next: QueuedFile[]) => {
			filesRef.current = next
			setFiles(next)
		}

		useImperativeHandle(
			ref,
			() => ({
				open: () => {
					if (!picking.current && !saving.current) setSheet("source")
				},
				save: async (context) => {
					if (saving.current) throw new Error("Attachments are already being saved")
					if (!filesRef.current.length) return
					saving.current = true
					try {
						let user = await getLatestUser()
						if (!user && status === "GUEST") user = await createUser({ name: "" })
						if (!user) throw new Error("No local account for attachments")
						const access = captureFileAccess(user.id)
						for (const item of [...filesRef.current]) {
							await saveManagedEntry(access, context, null, item.name, item.file)
							setQueued(filesRef.current.filter((entry) => entry.id !== item.id))
						}
					} finally {
						saving.current = false
					}
				},
			}),
			[status]
		)

		const selectSource = async (source: FileSource) => {
			if (picking.current || saving.current) return
			picking.current = true
			try {
				await new Promise<void>((resolve) => {
					if (Platform.OS === "ios") dismissSource.current = resolve
					else setTimeout(resolve, 250)
					setSheet(null)
				})
				const result = await pickManagedFile(source)
				if (!result) return
				setPicked(result)
				setFileName(result.name)
				setSheet("rename")
			} catch (error) {
				if (error instanceof FilePermissionError) {
					Alert.alert(
						t("common.error"),
						t(error.canAskAgain ? "files.permission" : "files.permissionSettings"),
						[
							{ text: t("common.cancel"), style: "cancel" },
							...(!error.canAskAgain
								? [
										{
											text: t("files.settings"),
											onPress: () => {
												void Linking.openSettings()
											},
										},
									]
								: []),
						]
					)
				} else {
					console.error("Attachment picker failed:", error)
					Alert.alert(t("common.error"), t("files.errors.pick"))
				}
			} finally {
				picking.current = false
			}
		}

		const addFile = () => {
			if (!picked || !validFileName(fileName) || saving.current) return
			if (
				filesRef.current.some(
					(entry) =>
						`${entry.name}${entry.file.extension}`.toLowerCase() ===
						`${fileName.trim()}${picked.extension}`.toLowerCase()
				)
			) {
				Alert.alert(t("common.error"), t("files.errors.duplicate"))
				return
			}
			counter.current += 1
			setQueued([...filesRef.current, { id: counter.current, file: picked, name: fileName.trim() }])
			setPicked(null)
			setSheet(null)
		}

		return (
			<>
				{files.map((item) => (
					<View key={item.id} style={styles.row}>
						<ThemedText
							variant="subTitle2"
							colorName="primary_base"
							numberOfLines={1}
							style={styles.filename}
						>
							{item.name}
							{item.file.extension}
						</ThemedText>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("common.delete")}
							onPress={() => {
								if (!saving.current)
									setQueued(filesRef.current.filter((entry) => entry.id !== item.id))
							}}
						>
							<IconClose width={18} height={18} color={colors.false} />
						</Pressable>
					</View>
				))}
				<FileSheet
					title="files.sourceTitle"
					visible={sheet === "source"}
					onClose={() => setSheet(null)}
					onDismiss={() => {
						dismissSource.current?.()
						dismissSource.current = null
					}}
				>
					<FileSheetButton tx="files.camera" onPress={() => void selectSource("camera")} />
					<FileSheetButton tx="files.gallery" onPress={() => void selectSource("gallery")} />
					<FileSheetButton tx="files.documents" onPress={() => void selectSource("documents")} />
					<FileSheetButton tx="common.cancel" secondary onPress={() => setSheet(null)} />
				</FileSheet>
				<FileSheet
					title="files.renameTitle"
					visible={sheet === "rename"}
					onClose={() => setSheet(null)}
				>
					<View style={styles.nameRow}>
						<ThemedInput
							variant="regular"
							value={fileName}
							onChangeText={setFileName}
							maxLength={120}
							placeholder={t("files.fileName")}
							autoCorrect={false}
							viewStyle={styles.nameInput}
						/>
						{picked?.extension ? (
							<ThemedText variant="H3" colorName="blue2">
								{picked.extension}
							</ThemedText>
						) : null}
					</View>
					<FileSheetButton tx="files.add" onPress={addFile} disabled={!validFileName(fileName)} />
					<FileSheetButton tx="common.cancel" secondary onPress={() => setSheet(null)} />
				</FileSheet>
			</>
		)
	}
)

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		marginVertical: 5,
	},
	filename: { maxWidth: "75%" },
	nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	nameInput: { flex: 1 },
})
