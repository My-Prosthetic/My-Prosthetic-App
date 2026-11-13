import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Alert, BackHandler, FlatList, StyleSheet, View } from "react-native"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import type { ParseKeys } from "i18next"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { useSettings } from "@/context/SettingsContext"
import { createUser, getLatestUser } from "@/db/repositories/userRepository"
import { getComponentsByProsthesisId } from "@/db/repositories/componentRepository"
import {
	assertFileContext,
	getFileIncidents,
	getFileProstheses,
	getFileResourceFolders,
	type FileProsthesis,
	type FileResourceFolder,
} from "@/db/repositories/fileRepository"
import type { FileEntry } from "@/db/schema/fileEntries"
import {
	deleteManagedEntry,
	listManagedFiles,
	saveManagedEntry,
	captureFileAccess,
	type FileAccess,
} from "@/src/services/fileStorageService"
import { openManagedFile, type FileSource } from "@/src/services/filePickerService"
import { useFilePicker } from "@/src/hooks/useFilePicker"
import {
	filterFileEntries,
	formatFileSize,
	GENERAL_FILES,
	ManagedFileError,
	validFileName,
	type FileContext,
	type FileContextType,
	type PickedFile,
} from "@/src/utils/fileMetadata"
import { formatFileDate } from "@/src/utils/fileDate"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedInput } from "@/src/components/ThemedInput"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"
import { DropdownSelect, type DropdownOption } from "@/src/components/DropdownSelect"
import { FileSheet, FileSheetButton } from "@/src/components/files/FileSheet"
import { FileRow } from "@/src/components/files/FileRow"
import IconFile from "@/assets/icons/file.svg"
import IconFolder from "@/assets/icons/folder.svg"
import IconPlus from "@/assets/icons/plus.svg"
import IconSearch from "@/assets/icons/search.svg"
import IconFilter from "@/assets/icons/filter.svg"
import IconCamera from "@/assets/icons/camera.svg"
import IconImage from "@/assets/icons/image.svg"
import IconBack from "@/assets/icons/chevron-left.svg"

type Sheet = "source" | "rename" | "folder" | "filter" | "target" | "delete" | null
type Filter = { type: FileContextType; prosthesisId: string | null; resourceId: string | null }
type ResourceRow = FileResourceFolder & { kind: "resource"; name: string }
const CONTEXTS: FileContextType[] = ["general", "prosthesis", "component", "incident"]
const SOURCES = ["camera", "gallery", "documents"] as const
const SOURCE_ICONS = { camera: IconCamera, gallery: IconImage, documents: IconFile }

export default function FilesRoute() {
	const params = useLocalSearchParams<{
		context?: string
		prosthesisId?: string
		resourceId?: string
	}>()
	const { status, sessionKey } = useAuth()
	const type = CONTEXTS.find((candidate) => candidate === params.context) ?? "general"
	const initial: Filter = {
		type,
		prosthesisId: params.prosthesisId ?? null,
		resourceId: params.resourceId ?? null,
	}
	return <FilesScreen key={JSON.stringify([initial, status, sessionKey])} initial={initial} />
}

function FilesScreen({ initial }: { initial: Filter }) {
	const { colors, highContrast } = useTheme()
	const { dateFormat } = useSettings()
	const { status } = useAuth()
	const { t, i18n } = useTranslation()
	const { pickFile, onSourceDismiss } = useFilePicker()
	const router = useRouter()
	const [ownerId, setOwnerId] = useState<FileAccess | null>(null)
	const [entries, setEntries] = useState<FileEntry[]>([])
	const [prostheses, setProstheses] = useState<FileProsthesis[]>([])
	const [fileResources, setFileResources] = useState<FileResourceFolder[]>([])
	const [filter, setFilter] = useState(initial)
	const [draft, setDraft] = useState(initial)
	const [resources, setResources] = useState<DropdownOption<string>[]>([])
	const [resourcesLoading, setResourcesLoading] = useState(false)
	const [folderId, setFolderId] = useState<string | null>(null)
	const [selectedResource, setSelectedResource] = useState<ResourceRow | null>(null)
	const [query, setQuery] = useState("")
	const [sheet, setSheet] = useState<Sheet>(null)
	const [pendingAdd, setPendingAdd] = useState<"source" | "folder" | null>(null)
	const [picked, setPicked] = useState<PickedFile | null>(null)
	const [name, setName] = useState("")
	const [error, setError] = useState<ParseKeys | null>(null)
	const [loadError, setLoadError] = useState(false)
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [deleting, setDeleting] = useState<FileEntry | null>(null)
	const mounted = useRef(true)
	const operation = useRef(false)

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const errorKey = (cause: unknown, fallback: ParseKeys): ParseKeys =>
		cause instanceof ManagedFileError ? `files.errors.${cause.code}` : fallback

	const load = useCallback(async () => {
		setLoading(true)
		setLoadError(false)
		try {
			let user = await getLatestUser()
			if (!user && status === "GUEST") user = await createUser({ name: "" })
			if (!user) throw new ManagedFileError("context")
			if (initial.type !== "general") assertFileContext(user.id, initial, false)
			const access = captureFileAccess(user.id)
			const [files, allProstheses, allResources] = await Promise.all([
				listManagedFiles(access),
				getFileProstheses(user.id),
				getFileResourceFolders(user.id),
			])
			if (!mounted.current) return
			setOwnerId(access)
			setEntries(files)
			setProstheses(allProstheses)
			setFileResources(allResources)
		} catch (cause) {
			console.error("Could not load managed files:", cause)
			if (mounted.current) {
				setLoadError(true)
				setEntries([])
				setFileResources([])
			}
		} finally {
			if (mounted.current) setLoading(false)
		}
	}, [initial, status])

	useFocusEffect(
		useCallback(() => {
			void load()
		}, [load])
	)

	useEffect(() => {
		if (sheet !== "target") return
		let active = true
		if (!draft.prosthesisId || (draft.type !== "component" && draft.type !== "incident")) return
		const loadResources = async () => {
			try {
				const options =
					draft.type === "component"
						? (await getComponentsByProsthesisId(draft.prosthesisId!)).map((item) => ({
								value: item.id,
								label: item.description || `${item.model.brand.name} | ${item.model.name}`,
							}))
						: getFileIncidents(draft.prosthesisId!).map((item) => ({
								value: item.id,
								label:
									item.description ||
									t("files.incidentLabel", {
										date: formatFileDate(item.occurredAt, dateFormat),
									}),
							}))
				if (active) setResources(options)
			} catch (cause) {
				console.error("Could not load file contexts:", cause)
				if (active) setError("files.errors.load")
			} finally {
				if (active) setResourcesLoading(false)
			}
		}
		void loadResources()
		return () => {
			active = false
		}
	}, [sheet, draft.type, draft.prosthesisId, t, dateFormat])

	const currentFolder = entries.find((entry) => entry.id === folderId)
	const activeFilter = useMemo<Filter>(
		() =>
			selectedResource
				? {
						type: selectedResource.type,
						prosthesisId: selectedResource.prosthesisId,
						resourceId: selectedResource.id,
					}
				: filter,
		[selectedResource, filter]
	)
	const context: FileContext | null = useMemo(() => {
		if (currentFolder)
			return {
				type: currentFolder.contextType,
				prosthesisId: currentFolder.prosthesisId,
				resourceId: currentFolder.resourceId,
			}
		if (activeFilter.type === "general") return GENERAL_FILES
		if (
			!activeFilter.prosthesisId ||
			((activeFilter.type === "component" || activeFilter.type === "incident") &&
				!activeFilter.resourceId)
		)
			return null
		return activeFilter
	}, [currentFolder, activeFilter])

	const visible = useMemo((): (FileEntry | ResourceRow)[] => {
		if (
			!folderId &&
			!selectedResource &&
			(filter.type === "component" || filter.type === "incident") &&
			!filter.resourceId
		) {
			const search = query.trim().toLocaleLowerCase(i18n.language)
			return fileResources
				.filter(
					(item) =>
						item.type === filter.type &&
						(!filter.prosthesisId || item.prosthesisId === filter.prosthesisId)
				)
				.filter(
					(item) =>
						!item.deletedAt ||
						entries.some(
							(entry) =>
								entry.contextType === item.type &&
								entry.prosthesisId === item.prosthesisId &&
								entry.resourceId === item.id
						)
				)
				.map((item) => ({
					...item,
					kind: "resource" as const,
					name:
						(item.description?.trim() ||
							item.fallbackName ||
							(item.occurredAt
								? t("files.incidentLabel", { date: formatFileDate(item.occurredAt, dateFormat) })
								: item.id)) + (item.deletedAt ? ` (${t("files.archived")})` : ""),
				}))
				.filter((item) => item.name.toLocaleLowerCase(i18n.language).includes(search))
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		}
		return filterFileEntries(entries, activeFilter, folderId, query, i18n.language)
	}, [
		entries,
		fileResources,
		filter,
		activeFilter,
		selectedResource,
		folderId,
		query,
		i18n.language,
		t,
		dateFormat,
	])

	const goBack = useCallback(() => {
		if (currentFolder) {
			setFolderId(currentFolder.parentId)
			setQuery("")
		} else if (selectedResource) {
			setSelectedResource(null)
			setQuery("")
		} else router.back()
	}, [currentFolder, selectedResource, router])
	useFocusEffect(
		useCallback(() => {
			if (!folderId && !selectedResource) return
			const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
				goBack()
				return true
			})
			return () => subscription.remove()
		}, [folderId, selectedResource, goBack])
	)

	const closeSheet = () => {
		if (!operation.current) {
			setSheet(null)
			setPicked(null)
			setError(null)
			setDeleting(null)
		}
	}
	const prepareFilter = (next: Filter) => {
		setDraft(next)
		if (
			sheet !== "filter" ||
			next.type !== draft.type ||
			next.prosthesisId !== draft.prosthesisId
		) {
			setResources([])
			setResourcesLoading(
				!!next.prosthesisId && (next.type === "component" || next.type === "incident")
			)
		}
		setError(null)
	}
	const beginAdd = (next: "source" | "folder") => {
		if (!context) {
			setPendingAdd(next)
			prepareFilter(filter)
			setError("files.selectTarget")
			setSheet("target")
			return
		}
		if (ownerId) {
			try {
				assertFileContext(ownerId.userId, context)
			} catch (cause) {
				Alert.alert(t("common.error"), t(errorKey(cause, "files.errors.context")))
				return
			}
		}
		setError(null)
		setName("")
		setSheet(next)
	}
	const selectSource = async (source: FileSource) => {
		if (operation.current) return
		operation.current = true
		setBusy(true)
		try {
			const result = await pickFile(source, () => setSheet(null))
			if (!mounted.current || !result) return
			setPicked(result)
			setName(result.name)
			setError(null)
			setSheet("rename")
		} finally {
			operation.current = false
			if (mounted.current) setBusy(false)
		}
	}

	const save = async () => {
		if (operation.current || !ownerId || !context) return
		if (!validFileName(name)) {
			setError("files.errors.invalidName")
			return
		}
		operation.current = true
		setBusy(true)
		setError(null)
		try {
			await saveManagedEntry(
				ownerId,
				context,
				folderId,
				name,
				sheet === "rename" ? (picked ?? undefined) : undefined
			)
			const files = await listManagedFiles(ownerId)
			if (mounted.current) {
				setEntries(files)
				setSheet(null)
				setPicked(null)
				setQuery("")
			}
		} catch (cause) {
			console.error("File save failed:", cause)
			if (mounted.current) setError(errorKey(cause, "files.errors.save"))
		} finally {
			operation.current = false
			if (mounted.current) setBusy(false)
		}
	}
	const openEntry = async (entry: FileEntry) => {
		if (entry.kind === "folder") {
			setFolderId(entry.id)
			setQuery("")
			return
		}
		if (!ownerId || operation.current) return
		operation.current = true
		setBusy(true)
		try {
			await openManagedFile(ownerId, entry.id, t("files.title"))
		} catch (cause) {
			console.error("File open failed:", cause)
			if (mounted.current) Alert.alert(t("common.error"), t(errorKey(cause, "files.errors.open")))
		} finally {
			operation.current = false
			if (mounted.current) setBusy(false)
		}
	}
	const remove = async () => {
		if (!ownerId || !deleting || operation.current) return
		operation.current = true
		setBusy(true)
		setError(null)
		try {
			await deleteManagedEntry(ownerId, deleting.id)
			const files = await listManagedFiles(ownerId)
			if (mounted.current) {
				setEntries(files)
				setSheet(null)
				setDeleting(null)
			}
		} catch (cause) {
			console.error("File deletion failed:", cause)
			if (mounted.current) setError(errorKey(cause, "files.errors.delete"))
		} finally {
			operation.current = false
			if (mounted.current) setBusy(false)
		}
	}
	const disabled = busy || loading || loadError || ownerId === null
	const folderDescendants = deleting
		? entries.filter((entry) => entry.storagePath.startsWith(`${deleting.storagePath}/`)).length
		: 0

	return (
		<ThemedView variant="background" colorName="bg_1">
			<ThemedHeader tx="files.title" onBack={goBack} />
			<FlatList
				data={visible}
				keyExtractor={(entry) =>
					entry.kind === "resource" ? `resource:${entry.type}:${entry.id}` : entry.id
				}
				keyboardShouldPersistTaps="handled"
				style={styles.list}
				contentContainerStyle={styles.listContent}
				refreshing={loading}
				onRefresh={() => {
					if (!busy) void load()
				}}
				ListHeaderComponent={
					<View>
						<View style={styles.searchRow}>
							<ThemedView colorName="bg_0" borderColor="blue1" style={styles.search}>
								<IconSearch color={colors.blue1} width={18} height={18} />
								<ThemedInput
									variant="search"
									placeholder={t("files.search")}
									placeholderTextColor={colors.blue1}
									accessibilityLabel={t("files.search")}
									value={query}
									onChangeText={setQuery}
									viewStyle={styles.searchInput}
									textStyle={styles.searchText}
								/>
							</ThemedView>
							<ThemedView
								onPress={() => {
									prepareFilter({
										...filter,
										prosthesisId: filter.type === "prosthesis" ? filter.prosthesisId : null,
										resourceId: null,
									})
									setSheet("filter")
								}}
								disabled={disabled}
								style={styles.filter}
							>
								<ThemedText tx="files.filter" variant="H2" colorName="blue1" />
								<IconFilter color={colors.blue1} width={26} height={26} />
							</ThemedView>
						</View>
						{(filter.type !== "general" || currentFolder || selectedResource) && (
							<ThemedView
								onPress={currentFolder || selectedResource ? goBack : undefined}
								style={styles.location}
							>
								{(currentFolder || selectedResource) && (
									<IconBack width={16} height={16} color={colors.blue2} />
								)}
								<ThemedText variant="H4" colorName="blue2" numberOfLines={2}>
									{currentFolder
										? `${t("files.parentFolder")} · ${currentFolder.name}`
										: selectedResource
											? `${t(`files.contexts.${selectedResource.type}`)} · ${selectedResource.name}`
											: filter.prosthesisId
												? `${t(`files.contexts.${filter.type}`)} · ${prostheses.find((item) => item.id === filter.prosthesisId)?.name ?? t("files.archivedProsthesis")}`
												: t(`files.contexts.${filter.type}`)}
								</ThemedText>
							</ThemedView>
						)}
						<ThemedView
							variant="wide"
							colorName="blue2"
							onPress={() => beginAdd("source")}
							disabled={disabled}
							style={styles.addButton}
							leftChild={<IconFile color={colors.bg_0} width={23} height={23} />}
							centerChild={<ThemedText tx="files.addFile" variant="H1" colorName="bg_0" />}
							rightChild={<IconPlus color={colors.bg_0} width={24} height={24} />}
						/>
						<ThemedView
							variant="wide"
							colorName="blue2"
							onPress={() => beginAdd("folder")}
							disabled={disabled}
							style={styles.addButton}
							leftChild={<IconFolder color={colors.bg_0} width={23} height={23} />}
							centerChild={<ThemedText tx="files.addFolder" variant="H1" colorName="bg_0" />}
							rightChild={<IconPlus color={colors.bg_0} width={24} height={24} />}
						/>
						<View style={styles.listGap} />
					</View>
				}
				renderItem={({ item }) =>
					item.kind === "resource" ? (
						<View style={[styles.resourceRow, { borderBottomColor: colors.blue0 }]}>
							<ThemedView
								onPress={() => {
									setSelectedResource(item)
									setQuery("")
								}}
								disabled={disabled}
								style={styles.resourceOpen}
								accessibilityLabel={item.name}
							>
								<ThemedView colorName={highContrast ? "bg_2" : "blue0"} style={styles.resourceIcon}>
									<IconFolder width={22} height={22} color={colors.blue2} />
								</ThemedView>
								<View style={styles.resourceInfo}>
									<ThemedText variant="H3" colorName="blue2" numberOfLines={2}>
										{item.name}
									</ThemedText>
									<ThemedText
										variant="H4"
										colorName="blue2"
										style={styles.resourceMeta}
										numberOfLines={1}
									>
										{t("files.types.folder")} ·{" "}
										{prostheses.find((prosthesis) => prosthesis.id === item.prosthesisId)?.name ??
											t("files.archivedProsthesis")}
									</ThemedText>
								</View>
							</ThemedView>
						</View>
					) : (
						<FileRow
							entry={item}
							disabled={disabled}
							onOpen={() => openEntry(item)}
							onDelete={() => {
								setDeleting(item)
								setError(null)
								setSheet("delete")
							}}
						/>
					)
				}
				ListEmptyComponent={
					loading ? (
						<ActivityIndicator color={colors.blue2} />
					) : (
						<View style={styles.empty}>
							<ThemedText
								tx={
									loadError ? "files.errors.load" : query.trim() ? "files.noResults" : "files.empty"
								}
								variant="H3"
								colorName="blue2"
								style={styles.centerText}
							/>
							{loadError && <FileSheetButton tx="files.retry" onPress={load} />}
						</View>
					)
				}
			/>
			{busy && <ActivityIndicator color={colors.blue2} style={styles.progress} />}

			<FileSheet
				title="files.sourceTitle"
				visible={sheet === "source"}
				onClose={closeSheet}
				onDismiss={onSourceDismiss}
			>
				{SOURCES.map((source) => {
					const Icon = SOURCE_ICONS[source]
					return (
						<ThemedView
							key={source}
							onPress={() => selectSource(source)}
							style={[styles.sourceRow, { borderBottomColor: colors.blue0 }]}
						>
							<ThemedView colorName="blue1" style={styles.sourceIcon}>
								<Icon color={colors.bg_0} width={23} height={23} />
							</ThemedView>
							<View style={styles.sourceInfo}>
								<ThemedText tx={`files.${source}`} variant="H3" colorName="blue2" />
								<ThemedText
									tx={`files.${source}Hint`}
									variant="H4"
									colorName="blue2"
									style={styles.sourceHint}
								/>
							</View>
						</ThemedView>
					)
				})}
				<FileSheetButton tx="common.cancel" onPress={closeSheet} />
			</FileSheet>
			{(sheet === "rename" || sheet === "folder") && (
				<FileSheet
					title={sheet === "rename" ? "files.renameTitle" : "files.addFolder"}
					onClose={closeSheet}
					busy={busy}
				>
					<View style={styles.editor}>
						<View style={styles.nameRow}>
							<ThemedInput
								variant="regular"
								value={name}
								onChangeText={(value) => {
									setName(value)
									setError(null)
								}}
								accessibilityLabel={t(sheet === "rename" ? "files.fileName" : "files.folderName")}
								placeholder={t(sheet === "rename" ? "files.fileName" : "files.folderName")}
								editable={!busy}
								maxLength={120}
								autoCorrect={false}
								viewStyle={styles.nameInput}
								textStyle={sheet === "rename" ? styles.nameText : undefined}
								returnKeyType="done"
								onSubmitEditing={() => void save()}
							/>
							{sheet === "rename" && picked?.extension ? (
								<ThemedText variant="H3" colorName="blue1" style={styles.extension}>
									{picked.extension}
								</ThemedText>
							) : null}
						</View>
						{sheet === "rename" && picked && (
							<View style={styles.pickedMeta}>
								<ThemedText variant="H4" colorName="blue2" style={styles.metaLeft}>
									{t(`files.types.${picked.category}`)} ·{" "}
									{formatFileDate(picked.createdAt, dateFormat)}
								</ThemedText>
								<ThemedText variant="H4" colorName="blue2">
									{formatFileSize(picked.size, i18n.language) ?? t("files.unknownSize")}
								</ThemedText>
							</View>
						)}
						{error && (
							<ThemedText tx={error} variant="H4" colorName="false" accessibilityRole="alert" />
						)}
					</View>
					<FileSheetButton tx="files.add" onPress={save} disabled={busy || !validFileName(name)} />
					<FileSheetButton tx="common.cancel" onPress={closeSheet} secondary disabled={busy} />
				</FileSheet>
			)}
			{sheet === "filter" && (
				<FileSheet title="files.filterTitle" onClose={closeSheet}>
					<DropdownSelect
						placeholder={t("files.filter")}
						options={CONTEXTS.map((type) => ({ value: type, label: t(`files.contexts.${type}`) }))}
						value={draft.type}
						onChange={(type) => {
							prepareFilter({
								type,
								prosthesisId:
									type === "prosthesis" ? (draft.prosthesisId ?? prostheses[0]?.id ?? null) : null,
								resourceId: null,
							})
						}}
					/>
					{draft.type === "prosthesis" && (
						<DropdownSelect
							placeholder={t("files.selectProsthesis")}
							options={prostheses.map((item) => ({
								value: item.id,
								label: `${item.name ?? t("files.archivedProsthesis")}${item.deletedAt ? ` (${t("files.archived")})` : ""}`,
							}))}
							value={draft.prosthesisId ?? undefined}
							onChange={(prosthesisId) => {
								prepareFilter({ ...draft, prosthesisId, resourceId: null })
							}}
						/>
					)}
					{draft.type !== "general" && prostheses.length === 0 && (
						<ThemedText tx="files.noProstheses" variant="H4" colorName="blue2" />
					)}
					{error && <ThemedText tx={error} variant="H4" colorName="false" />}
					<FileSheetButton
						tx="files.apply"
						disabled={draft.type === "prosthesis" && !draft.prosthesisId}
						onPress={() => {
							setSelectedResource(null)
							setFilter({
								...draft,
								prosthesisId: draft.type === "prosthesis" ? draft.prosthesisId : null,
								resourceId: null,
							})
							setFolderId(null)
							setQuery("")
							setSheet(null)
							setError(null)
						}}
					/>
					<FileSheetButton tx="common.cancel" onPress={closeSheet} secondary />
				</FileSheet>
			)}
			{sheet === "target" && (
				<FileSheet title="files.targetTitle" onClose={closeSheet}>
					<DropdownSelect
						placeholder={t("files.selectProsthesis")}
						options={prostheses
							.filter((item) => !item.deletedAt)
							.map((item) => ({
								value: item.id,
								label: item.name ?? t("files.archivedProsthesis"),
							}))}
						value={draft.prosthesisId ?? undefined}
						onChange={(prosthesisId) => {
							prepareFilter({ ...draft, prosthesisId, resourceId: null })
						}}
					/>
					{draft.prosthesisId &&
						(resourcesLoading ? (
							<ActivityIndicator color={colors.blue2} />
						) : (
							<DropdownSelect
								placeholder={t(
									draft.type === "component" ? "files.selectComponent" : "files.selectIncident"
								)}
								options={resources}
								value={draft.resourceId ?? undefined}
								onChange={(resourceId) => setDraft({ ...draft, resourceId })}
							/>
						))}
					{draft.prosthesisId && !resourcesLoading && resources.length === 0 && (
						<ThemedText tx="files.noResources" variant="H4" colorName="blue2" />
					)}
					{error && <ThemedText tx={error} variant="H4" colorName="false" />}
					<FileSheetButton
						tx="common.confirm"
						disabled={resourcesLoading || !draft.resourceId}
						onPress={() => {
							setSelectedResource(null)
							setFilter(draft)
							setFolderId(null)
							setName("")
							setError(null)
							setSheet(pendingAdd ?? "source")
							setPendingAdd(null)
						}}
					/>
					<FileSheetButton tx="common.cancel" onPress={closeSheet} secondary />
				</FileSheet>
			)}
			{sheet === "delete" && deleting && (
				<FileSheet
					title={deleting.kind === "folder" ? "files.deleteFolderTitle" : "files.deleteTitle"}
					onClose={closeSheet}
					busy={busy}
				>
					<ThemedText variant="H3" colorName="blue2">
						{t(deleting.kind === "folder" ? "files.deleteFolderConfirm" : "files.deleteConfirm", {
							name: deleting.name,
							count: folderDescendants,
						})}
					</ThemedText>
					{error && <ThemedText tx={error} variant="H4" colorName="false" />}
					<FileSheetButton tx="common.delete" onPress={remove} disabled={busy} />
					<FileSheetButton tx="common.cancel" onPress={closeSheet} secondary disabled={busy} />
				</FileSheet>
			)}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	resourceRow: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 90,
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
	resourceOpen: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		borderRadius: 0,
		justifyContent: "flex-start",
	},
	resourceIcon: {
		width: 54,
		height: 54,
		borderRadius: 27,
		alignItems: "center",
		justifyContent: "center",
	},
	resourceInfo: { flex: 1, gap: 6 },
	resourceMeta: { fontSize: 11, lineHeight: 16 },
	list: { flex: 1, width: "100%" },
	listContent: { paddingBottom: 24 },
	searchRow: {
		flexDirection: "row",
		gap: 12,
		alignItems: "center",
		marginTop: 28,
		marginBottom: 20,
	},
	search: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 13,
		borderRadius: 15,
		minHeight: 40,
	},
	searchInput: {
		flex: 1,
		width: "auto",
		borderWidth: 0,
		minHeight: 38,
		backgroundColor: "transparent",
	},
	searchText: { paddingLeft: 14, paddingRight: 6 },
	filter: { flexDirection: "row", gap: 8, alignItems: "center" },
	location: {
		flexDirection: "row",
		gap: 8,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
		minHeight: 36,
	},
	addButton: { minHeight: 50, borderRadius: 20, marginBottom: 14 },
	listGap: { height: 38 },
	empty: { gap: 20, paddingVertical: 20 },
	centerText: { textAlign: "center" },
	progress: { position: "absolute", right: 16, bottom: 12 },
	sourceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		borderBottomWidth: 1,
		paddingVertical: 10,
		borderRadius: 0,
		justifyContent: "flex-start",
	},
	sourceIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	sourceInfo: { flex: 1, gap: 5 },
	sourceHint: { lineHeight: 18 },
	editor: { minHeight: 160, gap: 14, paddingTop: 12 },
	nameRow: { justifyContent: "center" },
	nameInput: { minHeight: 40 },
	nameText: { paddingRight: 104 },
	extension: { position: "absolute", right: 16, maxWidth: 90 },
	pickedMeta: {
		flexDirection: "row",
		gap: 10,
		justifyContent: "space-between",
		paddingHorizontal: 12,
	},
	metaLeft: { flex: 1 },
})
