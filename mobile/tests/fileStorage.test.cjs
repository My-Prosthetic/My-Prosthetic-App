const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { fileURLToPath, pathToFileURL } = require("node:url")
const { harness } = require("./fileTestHarness.cjs")

test("validates names, identifiers, immutable extensions and file categories", (t) => {
	const h = harness(t)
	for (const name of ["", "..", "a/b", "a\\b", "a\0b", "test.", "con", "nul.pdf", "a".repeat(121)])
		assert.equal(h.metadata.validFileName(name), false, name)
	assert.equal(h.metadata.validFileName("Zdjęcie otarcia (1)"), true)
	assert.equal(
		h.metadata.pickedFile({ uri: "file:///image", name: "photo.HEIC" }).extension,
		".HEIC"
	)
	assert.equal(h.metadata.pickedFile({ uri: "file:///unknown", name: "unknown" }).extension, "")
	for (const [extension, expected] of [
		[".jpg", "image"],
		[".mov", "video"],
		[".pdf", "pdf"],
		[".stl", "model"],
		[".m4a", "audio"],
		[".bin", "document"],
	])
		assert.equal(h.metadata.fileCategory(extension, null), expected)
	assert.throws(() =>
		h.metadata.contextKey({ type: "incident", prosthesisId: "../p", resourceId: "i" })
	)
	assert.notEqual(
		h.metadata.contextKey({ type: "incident", prosthesisId: "p", resourceId: "same" }),
		h.metadata.contextKey({ type: "component", prosthesisId: "p", resourceId: "same" })
	)
	assert.equal(h.metadata.formatFileSize(null, "en"), null)
	assert.equal(h.metadata.formatFileSize(0, "en"), "0 B")
	assert.equal(h.metadata.formatFileSize(1536, "en"), "1.5 KB")
})

test("copies bytes to durable storage and keeps nested folders after service restart", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Folder")
	const folder = h.rows()[0]
	await h.service.saveManagedEntry(h.access, h.context, folder.id, "Child")
	const child = h.rows().find((entry) => entry.name === "Child")
	await h.service.saveManagedEntry(h.access, h.context, child.id, "Renamed", h.asset)
	const entry = h.rows().find((item) => item.kind === "file")
	assert.equal(entry.file_name, "Renamed.pdf")
	assert.equal(entry.size, 20)
	assert.equal(
		fs.readFileSync(path.join(h.root, "files", entry.storage_path, entry.file_name), "utf8"),
		"complete source file"
	)
	h.cache.delete(path.resolve("src/services/fileStorageService.ts"))
	assert.equal((await h.service.listManagedFiles(h.access)).length, 3)
})

test("rejects sibling duplicates, accepts the same name in another context, and validates parent ownership", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Scan", h.asset)
	await assert.rejects(h.service.saveManagedEntry(h.access, h.context, null, "SCAN", h.asset), {
		code: "duplicate",
	})
	const other = { type: "prosthesis", prosthesisId: "p1", resourceId: null }
	await h.service.saveManagedEntry(h.access, other, null, "Scan", h.asset)
	const file = h.rows()[0]
	await assert.rejects(h.service.saveManagedEntry(h.access, other, file.id, "Invalid"), {
		code: "context",
	})
	await assert.rejects(
		h.service.saveManagedEntry(
			h.access,
			{ type: "component", prosthesisId: "p2", resourceId: "c1" },
			null,
			"Invalid"
		),
		{ code: "context" }
	)
	assert.equal(h.rows().length, 2)
})

test("SQLite enforces sibling uniqueness independently of the UI", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Unique")
	assert.throws(
		() =>
			h.sql.exec(
				"INSERT INTO file_entries SELECT 'duplicate',user_id,context_type,context_key,prosthesis_id,resource_id,parent_id,parent_key,kind,name,name_key,file_name,extension,mime_type,category,storage_path,legacy_uri,size,created_at,state FROM file_entries"
			),
		/UNIQUE/
	)
})

test("cleans partial copies and rolls back a failed SQLite finalization", async (t) => {
	const h = harness(t)
	h.faults.copy = true
	await assert.rejects(h.service.saveManagedEntry(h.access, h.context, null, "Partial", h.asset))
	assert.equal(h.rows().length, 0)
	h.faults.copy = false
	h.faults.ready = true
	await assert.rejects(
		h.service.saveManagedEntry(h.access, h.context, null, "SQL failure", h.asset)
	)
	assert.equal(h.rows().length, 0)
	assert.deepEqual(fs.readdirSync(path.join(h.root, "files/users/1/general")), [])
})

test("recovers a pending copy when immediate cleanup also fails", async (t) => {
	const h = harness(t)
	h.faults.copy = true
	h.faults.remove = true
	await assert.rejects(h.service.saveManagedEntry(h.access, h.context, null, "Partial", h.asset))
	assert.equal(h.rows()[0].state, "pending")
	h.faults.copy = false
	h.faults.remove = false
	h.cache.delete(path.resolve("src/services/fileStorageService.ts"))
	assert.deepEqual(await h.service.listManagedFiles(h.access), [])
	assert.deepEqual(fs.readdirSync(path.join(h.root, "files/users/1/general")), [])
})

test("recursive deletion retries physical and SQLite failures without touching another context", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Folder")
	const folder = h.rows()[0]
	await h.service.saveManagedEntry(h.access, h.context, folder.id, "Inside", h.asset)
	await h.service.saveManagedEntry(
		h.access,
		{ type: "prosthesis", prosthesisId: "p2", resourceId: null },
		null,
		"Keep",
		h.asset
	)
	h.faults.remove = true
	await assert.rejects(h.service.deleteManagedEntry(h.access, folder.id))
	assert.equal(h.rows().filter((row) => row.state === "deleting").length, 2)
	h.faults.remove = false
	h.faults.forget = true
	await assert.rejects(h.service.listManagedFiles(h.access))
	h.faults.forget = false
	const remaining = await h.service.listManagedFiles(h.access)
	assert.equal(remaining.length, 1)
	assert.equal(remaining[0].name, "Keep")
})

test("missing physical files can be removed, and stale users cannot read or write", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Missing", h.asset)
	const entry = h.rows()[0]
	fs.unlinkSync(path.join(h.root, "files", entry.storage_path, entry.file_name))
	await assert.rejects(h.service.getManagedFile(h.access, entry.id), { code: "missing" })
	await h.service.deleteManagedEntry(h.access, entry.id)
	h.sql.exec("INSERT INTO users(id,name) VALUES(2,'Second user')")
	await assert.rejects(h.service.listManagedFiles(h.access), { code: "context" })
	await assert.rejects(h.service.saveManagedEntry(h.access, h.context, null, "Stale"), {
		code: "context",
	})
	assert.deepEqual(
		await h.service.listManagedFiles({ userId: 2, session: h.client.getDatabaseSession() }),
		[]
	)
})

test("removing imported media preserves incident originals and prevents reimport after restart", async (t) => {
	const h = harness(t)
	const original = path.join(h.root, "incidents/i1/photo.jpg")
	const audio = path.join(h.root, "incidents/i1/voice.m4a")
	fs.mkdirSync(path.dirname(original), { recursive: true })
	fs.writeFileSync(original, "photo")
	fs.writeFileSync(audio, "voice")
	const photoUri = pathToFileURL(original).href
	const audioUri = pathToFileURL(audio).href
	h.sql
		.prepare(
			"INSERT INTO incidents(id,prosthesis_id,type,occurred_at,photo_uris_json,audio_uri,created_at,updated_at) VALUES('i1','p1','abrasion','2026-01-01',?,?,'2026-01-01','2026-01-01')"
		)
		.run(JSON.stringify([photoUri]), audioUri)
	const entries = await h.service.listManagedFiles(h.access)
	assert.equal(entries.length, 2)
	assert.ok(entries.every((entry) => entry.contextType === "incident"))
	assert.equal((await h.service.listManagedFiles(h.access)).length, 2)
	for (const entry of entries) await h.service.deleteManagedEntry(h.access, entry.id)
	assert.equal(fs.readFileSync(original, "utf8"), "photo")
	assert.equal(fs.readFileSync(audio, "utf8"), "voice")
	const incident = h.sql.prepare("SELECT photo_uris_json, audio_uri FROM incidents").get()
	assert.deepEqual(JSON.parse(incident.photo_uris_json), [photoUri])
	assert.equal(incident.audio_uri, audioUri)
	assert.ok(h.rows().every((row) => row.state === "ignored"))
	assert.deepEqual(await h.service.listManagedFiles(h.access), [])
	h.restart()
	h.client.activateDatabaseSession(
		"user_00000000-0000-4000-8000-000000000001",
		h.client.legacyDatabase
	)
	assert.deepEqual(await h.service.listManagedFiles(h.access), [])
	await h.service.saveManagedEntry(
		h.access,
		{ type: "incident", prosthesisId: "p1", resourceId: "i1" },
		null,
		"photo",
		h.metadata.pickedFile({ uri: h.asset.uri, name: "photo.jpg" })
	)
	assert.equal((await h.service.listManagedFiles(h.access)).length, 1)
	assert.equal(fs.readFileSync(original, "utf8"), "photo")
})

test("path tampering cannot delete outside managed storage", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Safe")
	const entry = h.rows()[0]
	h.sql
		.prepare("UPDATE file_entries SET storage_path=? WHERE id=?")
		.run(`users/1/general/../../${entry.id}`, entry.id)
	await assert.rejects(h.service.deleteManagedEntry(h.access, entry.id), { code: "context" })
	assert.equal(fs.readFileSync(fileURLToPath(h.asset.uri), "utf8"), "complete source file")
})

test("canceling every picker leaves the database and managed filesystem untouched", async (t) => {
	const h = harness(t)
	const picker = h.load("src/services/filePickerService.ts")
	for (const source of ["camera", "gallery", "documents"])
		assert.equal(await picker.pickManagedFile(source), null)
	assert.deepEqual(h.rows(), [])
	assert.equal(fs.existsSync(path.join(h.root, "files")), false)
	assert.deepEqual(h.picker.calls, ["permission", "camera", "gallery", "documents"])
})

test("camera denial retains canAskAgain and does not launch the camera", async (t) => {
	const h = harness(t)
	h.picker.permission = { granted: false, canAskAgain: false }
	await assert.rejects(h.load("src/services/filePickerService.ts").pickManagedFile("camera"), {
		canAskAgain: false,
	})
	assert.deepEqual(h.picker.calls, ["permission"])
	assert.deepEqual(h.rows(), [])
})

test("a gallery selection uses the exported format without requesting broad photo access", async (t) => {
	const h = harness(t)
	h.picker.result = {
		canceled: false,
		assets: [
			{ uri: h.asset.uri, fileName: "original.HEIC", mimeType: "application/pdf", fileSize: 20 },
		],
	}
	const asset = await h.load("src/services/filePickerService.ts").pickManagedFile("gallery")
	assert.equal(asset.extension, ".pdf")
	assert.deepEqual(h.picker.calls, ["gallery"])
	assert.deepEqual(h.rows(), [])
})

test("filters isolate general, prosthesis and component roots, with search and folder navigation", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Zdjęcia")
	const folder = h.rows()[0]
	await h.service.saveManagedEntry(h.access, h.context, folder.id, "Nested", h.asset)
	const prosthesis = { type: "prosthesis", prosthesisId: "p1", resourceId: null }
	const component = { type: "component", prosthesisId: "p1", resourceId: "c1" }
	await h.service.saveManagedEntry(h.access, prosthesis, null, "Prosthesis", h.asset)
	await h.service.saveManagedEntry(h.access, component, null, "Component", h.asset)
	const entries = await h.service.listManagedFiles(h.access)
	const filter = h.metadata.filterFileEntries
	assert.deepEqual(
		filter(entries, h.context, null, "ZDJĘCIA", "pl").map((entry) => entry.name),
		["Zdjęcia"]
	)
	assert.deepEqual(
		filter(entries, h.context, folder.id, "", "pl").map((entry) => entry.name),
		["Nested"]
	)
	assert.deepEqual(
		filter(entries, prosthesis, null, "", "pl").map((entry) => entry.name),
		["Prosthesis"]
	)
	assert.deepEqual(
		filter(entries, { ...component, resourceId: null }, null, "", "pl").map((entry) => entry.name),
		["Component"]
	)
	assert.deepEqual(filter(entries, { ...prosthesis, prosthesisId: "p2" }, null, "", "pl"), [])
	assert.deepEqual(
		filter(
			entries,
			{ type: "component", prosthesisId: null, resourceId: null },
			null,
			"",
			"pl"
		).map((entry) => entry.name),
		["Component"]
	)
	assert.deepEqual(filter(entries, h.context, null, "no matches", "pl"), [])
})

test("component and incident folder categories refer to the correct records", async (t) => {
	const h = harness(t)
	h.sql.exec(`
		INSERT INTO incidents(id, prosthesis_id, type, description, occurred_at, created_at, updated_at)
		VALUES('i1', 'p1', 'other', 'Test incident', '2026-01-02', '2026-01-02', '2026-01-02');
	`)
	const repository = h.load("db/repositories/fileRepository.ts")
	const folders = repository.getFileResourceFolders(h.access.userId)
	assert.deepEqual(
		folders.map(({ type, id, prosthesisId }) => ({ type, id, prosthesisId })),
		[
			{ type: "component", id: "c1", prosthesisId: "p1" },
			{ type: "incident", id: "i1", prosthesisId: "p1" },
		]
	)
	assert.equal(folders[0].fallbackName, "Brand Model")
	assert.equal(folders[1].description, "Test incident")

	await h.service.saveManagedEntry(
		h.access,
		{ type: "component", prosthesisId: "p1", resourceId: "c1" },
		null,
		"Component documentation",
		h.asset
	)
	await h.service.saveManagedEntry(
		h.access,
		{ type: "incident", prosthesisId: "p1", resourceId: "i1" },
		null,
		"Incident documentation",
		h.asset
	)
	const entries = await h.service.listManagedFiles(h.access)
	assert.deepEqual(
		h.metadata
			.filterFileEntries(
				entries,
				{ type: "component", prosthesisId: "p1", resourceId: "c1" },
				null,
				"",
				"pl"
			)
			.map((entry) => entry.name),
		["Component documentation"]
	)
	assert.deepEqual(
		h.metadata
			.filterFileEntries(
				entries,
				{ type: "incident", prosthesisId: "p1", resourceId: "i1" },
				null,
				"",
				"pl"
			)
			.map((entry) => entry.name),
		["Incident documentation"]
	)
})

test("logout preserves rows and files, and rejects queued or stale operations", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Before logout", h.asset)
	const access = h.access
	const before = h.rows()
	await h.service.withFileSessionTransition(async () => {})
	await assert.rejects(
		h.service.saveManagedEntry(access, h.context, null, "After logout", h.asset),
		{ code: "context" }
	)
	assert.deepEqual(h.rows(), before)
	assert.equal(
		fs.existsSync(path.join(h.root, "files", before[0].storage_path, before[0].file_name)),
		true
	)
	h.client.activateDatabaseSession(
		"user_00000000-0000-4000-8000-000000000001",
		h.client.legacyDatabase
	)
	await assert.rejects(h.service.listManagedFiles(access), { code: "context" })
	assert.equal((await h.service.listManagedFiles(h.access)).length, 1)
})

test("date formatting respects all settings and preserves existing three-argument callers", (t) => {
	const h = harness(t)
	const { formatDate } = h.load("src/utils/dateTimeUtils.ts")
	const date = new Date(2026, 4, 10)
	const reference = new Date(2026, 5, 1)
	assert.equal(formatDate(date, "numeric", reference), "10-05-2026")
	assert.equal(formatDate(date, "numeric", reference, "YYYY-MM-DD"), "2026-05-10")
	assert.equal(formatDate(date, "numeric", reference, "DD-MM-YYYY"), "10-05-2026")
	assert.equal(formatDate(date, "numeric", reference, "MM-DD-YYYY"), "05-10-2026")
})

test("file calendar dates honor the global date format without time-zone shifts", (t) => {
	const h = harness(t)
	const { formatFileDate } = h.load("src/utils/fileDate.ts")
	const previous = process.env.TZ
	try {
		for (const zone of ["UTC", "America/Los_Angeles", "Pacific/Auckland", "Europe/Warsaw"]) {
			process.env.TZ = zone
			assert.equal(formatFileDate("2026-05-10", "DD-MM-YYYY"), "10-05-2026")
			assert.equal(formatFileDate("2026-05-10", "YYYY-MM-DD"), "2026-05-10")
			assert.equal(formatFileDate("2026-05-10", "MM-DD-YYYY"), "05-10-2026")
			assert.equal(formatFileDate("2026-06-02", "DD-MM-YYYY"), "02-06-2026")
		}
		assert.equal(formatFileDate("2026-02-30", "DD-MM-YYYY"), "Unknown date")
		assert.equal(formatFileDate("not a date", "DD-MM-YYYY"), "Unknown date")
	} finally {
		if (previous === undefined) delete process.env.TZ
		else process.env.TZ = previous
	}
	for (const file of ["app/(tabs)/(home)/files.tsx", "src/components/files/FileRow.tsx"]) {
		const code = fs.readFileSync(file, "utf8")
		assert.ok(code.includes("formatFileDate("))
		assert.ok(code.includes("dateFormat"))
	}
})

const user = (id, name = "Same display name") => ({
	id: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
	name,
	email: `${id}@example.test`,
	role: "patient",
	email_verified_at: null,
})

test("legacy account A survives logout, account B is isolated, and A reopens its original files and relations", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Folder A")
	const folder = h.rows()[0]
	await h.service.saveManagedEntry(h.access, h.context, folder.id, "PDF A", h.asset)
	await h.service.saveManagedEntry(
		h.access,
		{ type: "component", prosthesisId: "p1", resourceId: "c1" },
		null,
		"Component A",
		h.asset
	)
	const before = h.rows()
	h.secure.set("auth_token", "legacy-token-A")
	h.profiles.set("legacy-token-A", user(37))
	const accounts = h.load("src/services/localAccountService.ts")
	assert.equal(
		(await accounts.restoreLocalAccount()).key,
		"user_00000000-0000-4000-8000-000000000037"
	)
	assert.equal(h.client.getDatabaseSession().database.name, "prosthetic-app.db")
	const aAccess = h.access
	await h.load("db/purgeDataBase.ts").purgeDatabase(accounts.clearLocalCredentials)
	assert.equal(h.client.getDatabaseSession(), null)
	assert.deepEqual(h.rows(), before)
	await assert.rejects(h.service.getManagedFile(aAccess, before[1].id), { code: "context" })
	await accounts.loginLocalAccount("token-B", user(38))
	assert.equal(h.access.userId, aAccess.userId)
	assert.deepEqual(await h.service.listManagedFiles(h.access), [])
	await assert.rejects(h.service.getManagedFile(h.access, before[1].id), { code: "missing" })
	assert.equal(h.service.filePreviewUri({ ...before[1], userId: 1 }), null)
	await h.service.deleteManagedEntry(h.access, before[1].id)
	await assert.rejects(
		h.service.saveManagedEntry(
			h.access,
			{ type: "component", prosthesisId: "p1", resourceId: "c1" },
			null,
			"Invalid"
		),
		{ code: "context" }
	)
	await h.service.saveManagedEntry(h.access, h.context, null, "PDF B", h.asset)
	const bAccess = h.access
	assert.ok(
		h.rows()[0].storage_path.startsWith("accounts/user_00000000-0000-4000-8000-000000000038/")
	)
	await h.load("db/purgeDataBase.ts").purgeDatabase(accounts.clearLocalCredentials)
	await accounts.loginLocalAccount("rotated-token-A", user(37, "Renamed account"))
	assert.deepEqual(h.rows(), before)
	assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM users").get().n, 1)
	assert.equal(
		h.sql.prepare("SELECT prosthesis_id FROM components WHERE id='c1'").get().prosthesis_id,
		"p1"
	)
	await assert.rejects(h.service.listManagedFiles(bAccess), { code: "context" })
	assert.ok((await h.service.getManagedFile(h.access, before[1].id)).uri.endsWith("PDF%20A.pdf"))
})

test("new account folders and every file category persist through a full module restart and offline restore", async (t) => {
	const h = harness(t)
	let accounts = h.load("src/services/localAccountService.ts")
	await accounts.loginLocalAccount("token-new", user(51))
	await h.service.saveManagedEntry(h.access, h.context, null, "Parent")
	const parent = h.rows()[0]
	await h.service.saveManagedEntry(h.access, h.context, parent.id, "Child")
	const child = h.rows().find((entry) => entry.name === "Child")
	for (const [extension, mimeType] of [
		["jpg", "image/jpeg"],
		["mp4", "video/mp4"],
		["pdf", "application/pdf"],
		["m4a", "audio/mp4"],
		["stl", "model/stl"],
	]) {
		const asset = h.metadata.pickedFile({ uri: h.asset.uri, name: `sample.${extension}`, mimeType })
		await h.service.saveManagedEntry(h.access, h.context, child.id, extension, asset)
	}
	const before = h.rows()
	const stale = h.access
	h.restart()
	accounts = h.load("src/services/localAccountService.ts")
	assert.equal(
		(await accounts.restoreLocalAccount()).key,
		"user_00000000-0000-4000-8000-000000000051"
	)
	assert.deepEqual(h.rows(), before)
	await assert.rejects(h.service.listManagedFiles(stale), { code: "context" })
	assert.equal((await h.service.listManagedFiles(h.access)).length, 7)
	for (const entry of before.filter((item) => item.kind === "file"))
		assert.equal(
			fs.readFileSync(path.join(h.root, "files", entry.storage_path, entry.file_name), "utf8"),
			"complete source file"
		)
})

test("an unclaimed legacy database is preserved and never assigned to a newly logging-in account", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Unclaimed", h.asset)
	const before = h.rows()
	const legacySql = h.sql
	await h.load("src/services/localAccountService.ts").loginLocalAccount("new-token", user(99))
	assert.notEqual(h.client.getDatabaseSession().database.name, "prosthetic-app.db")
	assert.deepEqual(h.rows(), [])
	assert.deepEqual(legacySql.prepare("SELECT * FROM file_entries").all(), before)
	assert.equal(h.secure.has("local_legacy_owner_v1"), false)
})

test("invalid incident references and failed copies cannot block valid files or audio in other incidents", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Existing", h.asset)
	function incident(id, photos, audio = null) {
		h.sql
			.prepare(
				"INSERT INTO incidents(id,prosthesis_id,type,occurred_at,photo_uris_json,audio_uri,created_at,updated_at) VALUES(?,'p1','abrasion','2026-01-01',?,?,'2026-01-01','2026-01-01')"
			)
			.run(id, photos, audio)
	}
	function media(id, name) {
		const file = path.join(h.root, "incidents", id, name)
		fs.mkdirSync(path.dirname(file), { recursive: true })
		fs.writeFileSync(file, "original")
		return pathToFileURL(file).href
	}
	const photo = media("good", "photo.jpg")
	const audio = media("bad-json", "voice.m4a")
	incident("bad-uri", JSON.stringify(["http://invalid", "file:///outside/private.jpg"]))
	const failedCopy = media("copy-failure", "copy-failure.jpg")
	const failedMetadata = media("metadata-failure", "metadata-failure.jpg")
	h.faults.copyNames = ["copy-failure.jpg"]
	h.faults.metadataNames = ["metadata-failure.jpg"]
	incident("copy-failure", JSON.stringify([failedCopy]))
	incident("metadata-failure", JSON.stringify([failedMetadata]))
	incident("bad-json", "invalid JSON", audio)
	incident(
		"good",
		JSON.stringify([
			null,
			{ uri: "invalid" },
			photo,
			pathToFileURL(path.join(h.root, "incidents/good/missing.jpg")).href,
		])
	)
	const entries = await h.service.listManagedFiles(h.access)
	assert.equal(entries.length, 3)
	assert.ok(entries.some((entry) => entry.category === "audio"))
	assert.equal((await h.service.listManagedFiles(h.access)).length, 3)
	assert.equal(fs.readFileSync(fileURLToPath(photo), "utf8"), "original")
	assert.equal(fs.readFileSync(fileURLToPath(audio), "utf8"), "original")
	assert.equal(fs.readFileSync(fileURLToPath(failedCopy), "utf8"), "original")
	assert.equal(fs.readFileSync(fileURLToPath(failedMetadata), "utf8"), "original")
	assert.ok(h.logs.length > 0)
})

test("API UUID identity is canonical, rejects invalid IDs and never uses display names for storage", async (t) => {
	const h = harness(t)
	const accounts = h.load("src/services/localAccountService.ts")
	const a = { ...user(61), id: "12345678-1234-4321-ABCD-1234567890AB" }
	await accounts.loginLocalAccount("token-lower", a)
	await h.service.saveManagedEntry(h.access, h.context, null, "Stable", h.asset)
	const before = h.rows()
	await accounts.loginLocalAccount("token-upper", {
		...a,
		id: a.id.toLowerCase(),
		name: "New name",
	})
	assert.deepEqual(h.rows(), before)
	await assert.rejects(accounts.loginLocalAccount("bad-id", { ...a, id: "../../other-user" }))
	assert.deepEqual(h.rows(), before)
})

test("file selection remains separate from saving existing prosthesis and component forms", () => {
	const ts = require("typescript")
	for (const file of [
		"app/(tabs)/(home)/prosthesis/new.tsx",
		"app/(tabs)/(home)/prosthesis/[prosthesisId]/components/new.tsx",
	]) {
		const code = fs.readFileSync(file, "utf8")
		const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
		const buttonHandlers = []
		let saveHandlerFound = false
		function visit(node) {
			if (ts.isVariableDeclaration(node) && node.name.getText(source) === "handleSave") {
				assert.ok(node.initializer && ts.isArrowFunction(node.initializer), file)
				assert.equal(node.initializer.parameters.length, 0, file)
				saveHandlerFound = true
			}
			if (
				ts.isJsxAttribute(node) &&
				node.name.getText(source) === "onPress" &&
				node.initializer &&
				ts.isJsxExpression(node.initializer) &&
				node.initializer.expression
			) {
				buttonHandlers.push(node.initializer.expression.getText(source))
			}
			ts.forEachChild(node, visit)
		}
		visit(source)
		assert.ok(saveHandlerFound, file)
		assert.ok(
			buttonHandlers.some((handler) => handler.includes("handleSave")),
			file
		)
		assert.ok(
			buttonHandlers.some(
				(handler) =>
					handler.includes("handleOnAddFiles") || handler.includes("filesRef.current?.open()")
			),
			file
		)
		assert.ok(code.includes("filesRef.current?.open()"), file)
		assert.ok(code.includes("await filesRef.current?.save("), file)
		assert.ok(code.includes("savingRef.current"), file)
		assert.ok(!code.includes("handleSave(true)"), file)
	}
})

test("soft-deleting linked objects preserves their documents in reachable archive categories", async (t) => {
	const h = harness(t)
	h.sql.exec(
		"INSERT INTO incidents(id,prosthesis_id,type,occurred_at,created_at,updated_at) VALUES('i1','p1','abrasion','2026-01-01','2026-01-01','2026-01-01')"
	)
	for (const context of [
		{ type: "prosthesis", prosthesisId: "p1", resourceId: null },
		{ type: "component", prosthesisId: "p1", resourceId: "c1" },
		{ type: "incident", prosthesisId: "p1", resourceId: "i1" },
	])
		await h.service.saveManagedEntry(h.access, context, null, context.type, h.asset)
	const before = h.rows()
	await h.load("db/repositories/componentRepository.ts").deleteComponent("c1")
	await h.load("db/repositories/prosthesisRepository.ts").deleteProsthesis("p1")
	h.sql.exec("UPDATE incidents SET deleted_at='2026-11-08' WHERE id='i1'")
	assert.deepEqual(h.rows(), before)
	const repository = h.load("db/repositories/fileRepository.ts")
	assert.ok(repository.getFileProstheses(1).find((item) => item.id === "p1").deletedAt)
	assert.doesNotThrow(() =>
		repository.assertFileContext(
			1,
			{ type: "incident", prosthesisId: "p1", resourceId: "i1" },
			false
		)
	)
	for (const entry of await h.service.listManagedFiles(h.access))
		assert.ok((await h.service.getManagedFile(h.access, entry.id)).uri)
	await assert.rejects(
		h.service.saveManagedEntry(
			h.access,
			{ type: "prosthesis", prosthesisId: "p1", resourceId: null },
			null,
			"No new archive writes"
		),
		{ code: "context" }
	)
})

test("validates Unicode and forbidden file name characters", (t) => {
	const h = harness(t)
	for (const name of ["a\x1fb", "a\x7fb"]) {
		assert.equal(h.metadata.validFileName(name), false)
	}
	assert.equal(h.metadata.validFileName("Zdjęcie 👍 (1)"), true)
	assert.equal(h.metadata.pickedFile({ uri: "file:///test", name: "a:b?.pdf" }).name, "a_b_")
	assert.equal(h.metadata.pickedFile({ uri: "file:///test", name: "a\x7fb.pdf" }).name, "a_b")
	assert.equal(h.metadata.pickedFile({ uri: "file:///test", name: "A👍B.pdf" }).name, "A👍B")
	assert.equal(
		h.metadata.pickedFile({ uri: "file:///test", name: "a".repeat(119) + "👍.pdf" }).name,
		"a".repeat(119)
	)
	assert.equal(
		h.metadata.pickedFile({ uri: "file:///test", name: "a".repeat(118) + "👍.pdf" }).name,
		"a".repeat(118) + "👍"
	)
})

test("Android file opening falls back to sharing after viewer failure", async (t) => {
	const h = harness(t)
	await h.service.saveManagedEntry(h.access, h.context, null, "Open", h.asset)
	const entry = h.rows()[0]
	const { openManagedFile } = h.load("src/services/filePickerService.ts")

	await openManagedFile(h.access, entry.id, "Files")
	assert.deepEqual(h.picker.calls, ["open"])

	h.picker.openError = new Error("No installed viewer")
	await openManagedFile(h.access, entry.id, "Files")
	assert.deepEqual(h.picker.calls, ["open", "open", "sharing-available", "share"])
	assert.equal(h.picker.shared.options.dialogTitle, "Files")
	assert.ok(h.picker.shared.uri.startsWith("file:"))

	h.picker.sharingAvailable = false
	await assert.rejects(openManagedFile(h.access, entry.id, "Files"), { code: "unavailable" })
	assert.deepEqual(h.picker.calls.slice(-2), ["open", "sharing-available"])
})
