import { StyleSheet, View } from "react-native"
import type { ComponentType } from "react"
import type { SvgProps } from "react-native-svg"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { useSettings } from "@/context/SettingsContext"
import type { FileEntry } from "@/db/schema/fileEntries"
import { formatFileDate } from "@/src/utils/fileDate"
import { formatFileSize, type FileCategory } from "@/src/utils/fileMetadata"
import { ThemedText } from "../ThemedText"
import { ThemedView } from "../ThemedView"
import IconFile from "@/assets/icons/file.svg"
import IconFolder from "@/assets/icons/folder.svg"
import IconImage from "@/assets/icons/image.svg"
import IconVideo from "@/assets/icons/video.svg"
import IconCube from "@/assets/icons/cube.svg"
import IconPdf from "@/assets/icons/pdf.svg"
import IconAudio from "@/assets/icons/incident/mic.svg"
import IconTrash from "@/assets/icons/trash-bin.svg"

export const FILE_ICONS: Record<FileCategory | "folder", ComponentType<SvgProps>> = {
	document: IconFile,
	folder: IconFolder,
	image: IconImage,
	video: IconVideo,
	model: IconCube,
	pdf: IconPdf,
	audio: IconAudio,
}

export function FileRow({
	entry,
	onOpen,
	onDelete,
	disabled,
}: {
	entry: FileEntry
	onOpen: () => void | Promise<void>
	onDelete: () => void
	disabled: boolean
}) {
	const { colors, highContrast } = useTheme()
	const { dateFormat } = useSettings()
	const { t, i18n } = useTranslation()
	const category = entry.kind === "folder" ? "folder" : (entry.category ?? "document")
	const Icon = FILE_ICONS[category]
	return (
		<View style={[styles.row, { borderBottomColor: colors.blue0 }]}>
			<ThemedView
				onPress={onOpen}
				disabled={disabled}
				style={styles.open}
				accessibilityLabel={entry.fileName}
			>
				<ThemedView
					colorName={entry.kind === "folder" ? (highContrast ? "bg_2" : "blue0") : "blue1"}
					style={styles.icon}
				>
					<Icon
						width={22}
						height={22}
						color={entry.kind === "folder" ? colors.blue2 : colors.bg_0}
					/>
				</ThemedView>
				<View style={styles.info}>
					<ThemedText variant="H3" colorName="blue2" numberOfLines={2}>
						{entry.name}
					</ThemedText>
					<ThemedText variant="H4" colorName="blue2" style={styles.metadata}>
						{t(`files.types.${category}`)} · {formatFileDate(entry.createdAt, dateFormat)}
					</ThemedText>
				</View>
			</ThemedView>
			<View style={styles.trailing}>
				<ThemedView
					onPress={onDelete}
					disabled={disabled}
					style={styles.delete}
					accessibilityLabel={t("files.deleteNamed", { name: entry.name })}
				>
					<IconTrash color={colors.false} width={22} height={22} />
				</ThemedView>
				{entry.kind === "file" && (
					<ThemedText variant="H4" colorName="blue2" numberOfLines={1}>
						{formatFileSize(entry.size, i18n.language) ?? t("files.unknownSize")}
					</ThemedText>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 90,
		paddingVertical: 14,
		borderBottomWidth: 1,
		gap: 6,
	},
	open: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		borderRadius: 0,
		justifyContent: "flex-start",
	},
	icon: {
		width: 54,
		height: 54,
		borderRadius: 27,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	info: { flex: 1, gap: 6 },
	metadata: { fontSize: 11, lineHeight: 16 },
	trailing: { alignItems: "flex-end", maxWidth: 76, gap: 2 },
	delete: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
})
