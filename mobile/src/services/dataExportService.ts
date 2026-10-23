import * as FileSystem from "expo-file-system/legacy"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import { Platform } from "react-native"

import type {
	MedicalProfileExport,
	ProsthesisExport,
	RawExportRow,
	StructuredDataExport,
} from "@/db/repositories/exportRepository"

export type ExportFileFormat = "pdf" | "json"

export interface ExportLabels {
	reportTitle: string
	generatedAt: string
	dateRange: string
	medicalProfile: string
	conditions: string
	medications: string
	prostheses: string
	components: string
	incidents: string
	noRows: string
}

interface GenerateExportFileOptions {
	format: ExportFileFormat
	exportData: StructuredDataExport
	locale: string
	labels: ExportLabels
}

export interface GeneratedExportFile {
	uri: string
	fileName: string
	mimeType: "application/pdf" | "application/json"
	uti: "com.adobe.pdf" | "public.json"
	base64?: string
	textContent?: string
}

export interface DownloadExportResult {
	saved: boolean
	cancelled: boolean
	uri?: string
}

function escapeHtml(value: unknown) {
	const normalized =
		value === null || value === undefined
			? ""
			: typeof value === "object"
				? JSON.stringify(value)
				: String(value)

	return normalized
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
}

function prettyKey(key: string) {
	return key
		.replace(/_/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/\b\w/g, (character) => character.toUpperCase())
}

function renderObjectTable(row: Record<string, unknown>, noRowsLabel: string) {
	const entries = Object.entries(row)

	if (entries.length === 0) {
		return `<p class="empty">${escapeHtml(noRowsLabel)}</p>`
	}

	return `
		<table class="kv-table">
			<tbody>
				${entries
					.map(
						([key, value]) => `
							<tr>
								<th>${escapeHtml(prettyKey(key))}</th>
								<td>${escapeHtml(value)}</td>
							</tr>
						`
					)
					.join("")}
			</tbody>
		</table>
	`
}

function renderRowsTable(rows: RawExportRow[], noRowsLabel: string) {
	if (rows.length === 0) {
		return `<p class="empty">${escapeHtml(noRowsLabel)}</p>`
	}

	const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))

	return `
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						${columns.map((column) => `<th>${escapeHtml(prettyKey(column))}</th>`).join("")}
					</tr>
				</thead>
				<tbody>
					${rows
						.map(
							(row) => `
								<tr>
									${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}
								</tr>
							`
						)
						.join("")}
				</tbody>
			</table>
		</div>
	`
}

function renderMedicalProfile(medicalProfile: MedicalProfileExport, labels: ExportLabels) {
	return `
		<section>
			<h2>${escapeHtml(labels.medicalProfile)}</h2>
			${renderObjectTable(medicalProfile.profile as unknown as Record<string, unknown>, labels.noRows)}

			<h3>${escapeHtml(labels.conditions)}</h3>
			${renderRowsTable(medicalProfile.conditions as unknown as RawExportRow[], labels.noRows)}

			<h3>${escapeHtml(labels.medications)}</h3>
			${renderRowsTable(medicalProfile.medications as unknown as RawExportRow[], labels.noRows)}
		</section>
	`
}

function renderProsthesis(entry: ProsthesisExport, labels: ExportLabels) {
	return `
		<section class="prosthesis">
			<h2>${escapeHtml(entry.prosthesis.name)}</h2>
			${renderObjectTable(entry.prosthesis as unknown as Record<string, unknown>, labels.noRows)}

			${
				entry.components
					? `
						<h3>${escapeHtml(labels.components)}</h3>
						${renderRowsTable(entry.components as unknown as RawExportRow[], labels.noRows)}
					`
					: ""
			}

			${
				entry.incidents
					? `
						<h3>${escapeHtml(labels.incidents)}</h3>
						${renderRowsTable(entry.incidents, labels.noRows)}
					`
					: ""
			}
		</section>
	`
}

function buildPdfHtml(exportData: StructuredDataExport, locale: string, labels: ExportLabels) {
	const dateFormatter = new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	})
	const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<style>
		@page { margin: 24px; }
		body {
			font-family: Arial, sans-serif;
			color: #2B3A51;
			font-size: 11px;
		}
		h1 {
			color: #065A8E;
			font-size: 22px;
			margin: 0 0 12px;
		}
		h2 {
			color: #065A8E;
			font-size: 16px;
			margin: 24px 0 8px;
		}
		h3 {
			color: #065A8E;
			font-size: 13px;
			margin: 15px 0 6px;
		}
		.meta {
			margin-bottom: 18px;
			color: #526274;
		}
		.meta p {
			margin: 3px 0;
		}
		.prosthesis {
			page-break-inside: avoid;
		}
		.table-wrap {
			width: 100%;
			overflow: hidden;
		}
		table {
			border-collapse: collapse;
			width: 100%;
			table-layout: fixed;
		}
		th, td {
			border: 1px solid #D3EEFF;
			padding: 6px;
			vertical-align: top;
			word-break: break-word;
			font-size: 9px;
		}
		th {
			background: #F1F6FB;
			color: #065A8E;
		}
		.kv-table th {
			width: 32%;
			text-align: left;
		}
		.empty {
			color: #526274;
		}
	</style>
</head>
<body>
	<h1>${escapeHtml(labels.reportTitle)}</h1>

	<div class="meta">
		<p>
			<strong>${escapeHtml(labels.generatedAt)}:</strong>
			${escapeHtml(dateTimeFormatter.format(new Date(exportData.exportedAt)))}
		</p>
		<p>
			<strong>${escapeHtml(labels.dateRange)}:</strong>
			${escapeHtml(dateFormatter.format(new Date(exportData.dateRange.from)))}
			–
			${escapeHtml(dateFormatter.format(new Date(exportData.dateRange.to)))}
		</p>
	</div>

	${
		exportData.data.medicalProfile
			? renderMedicalProfile(exportData.data.medicalProfile, labels)
			: ""
	}

	${
		exportData.data.prostheses.length > 0
			? `
				<h2>${escapeHtml(labels.prostheses)}</h2>
				${exportData.data.prostheses.map((entry) => renderProsthesis(entry, labels)).join("")}
			`
			: ""
	}
</body>
</html>`
}

function buildFileName(extension: "pdf" | "json") {
	const timestamp = new Date()
		.toISOString()
		.replace(/[:.]/g, "-")
		.replace("T", "_")
		.replace("Z", "")

	return `my-prosthetic-export_${timestamp}.${extension}`
}

async function generateJsonFile(exportData: StructuredDataExport): Promise<GeneratedExportFile> {
	if (!FileSystem.cacheDirectory) {
		throw new Error("Cache directory is unavailable")
	}

	const fileName = buildFileName("json")
	const uri = `${FileSystem.cacheDirectory}${fileName}`
	const textContent = JSON.stringify(exportData, null, 2)

	await FileSystem.writeAsStringAsync(uri, textContent, {
		encoding: FileSystem.EncodingType.UTF8,
	})

	return {
		uri,
		fileName,
		mimeType: "application/json",
		uti: "public.json",
		textContent,
	}
}

async function generatePdfFile(
	exportData: StructuredDataExport,
	locale: string,
	labels: ExportLabels
): Promise<GeneratedExportFile> {
	if (!FileSystem.cacheDirectory) {
		throw new Error("Cache directory is unavailable")
	}

	const html = buildPdfHtml(exportData, locale, labels)
	const fileName = buildFileName("pdf")

	const result = await Print.printToFileAsync({
		html,
		base64: true,
	})

	if (!result.base64) {
		throw new Error("expo-print did not return PDF Base64 data")
	}

	// result.uri points to expo-print's private Print cache on Android.
	// Recreate the PDF in our own cache so expo-sharing can read it.
	const uri = `${FileSystem.cacheDirectory}${fileName}`

	await FileSystem.writeAsStringAsync(uri, result.base64, {
		encoding: FileSystem.EncodingType.Base64,
	})

	return {
		uri,
		fileName,
		mimeType: "application/pdf",
		uti: "com.adobe.pdf",
		base64: result.base64,
	}
}

export async function generateExportFile({
	format,
	exportData,
	locale,
	labels,
}: GenerateExportFileOptions): Promise<GeneratedExportFile> {
	if (format === "json") {
		return generateJsonFile(exportData)
	}

	return generatePdfFile(exportData, locale, labels)
}

export async function downloadExportFile(file: GeneratedExportFile): Promise<DownloadExportResult> {
	if (Platform.OS === "android") {
		const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()

		if (!permission.granted) {
			return {
				saved: false,
				cancelled: true,
			}
		}

		const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
			permission.directoryUri,
			file.fileName,
			file.mimeType
		)

		if (file.mimeType === "application/pdf") {
			if (!file.base64) {
				throw new Error("Generated PDF has no Base64 content")
			}

			await FileSystem.writeAsStringAsync(destinationUri, file.base64, {
				encoding: FileSystem.EncodingType.Base64,
			})
		} else {
			if (file.textContent === undefined) {
				throw new Error("Generated JSON has no text content")
			}

			await FileSystem.writeAsStringAsync(destinationUri, file.textContent, {
				encoding: FileSystem.EncodingType.UTF8,
			})
		}

		return {
			saved: true,
			cancelled: false,
			uri: destinationUri,
		}
	}

	if (!FileSystem.documentDirectory) {
		throw new Error("Document directory is unavailable")
	}

	const destinationUri = `${FileSystem.documentDirectory}${file.fileName}`

	if (file.mimeType === "application/pdf") {
		if (!file.base64) {
			throw new Error("Generated PDF has no Base64 content")
		}

		await FileSystem.writeAsStringAsync(destinationUri, file.base64, {
			encoding: FileSystem.EncodingType.Base64,
		})
	} else {
		if (file.textContent === undefined) {
			throw new Error("Generated JSON has no text content")
		}

		await FileSystem.writeAsStringAsync(destinationUri, file.textContent, {
			encoding: FileSystem.EncodingType.UTF8,
		})
	}

	return {
		saved: true,
		cancelled: false,
		uri: destinationUri,
	}
}

export async function shareExportFile(file: GeneratedExportFile, options: { dialogTitle: string }) {
	const sharingAvailable = await Sharing.isAvailableAsync()

	if (!sharingAvailable) {
		return false
	}

	await Sharing.shareAsync(file.uri, {
		dialogTitle: options.dialogTitle,
		mimeType: file.mimeType,
		UTI: file.uti,
	})

	return true
}
