const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { fileURLToPath, pathToFileURL } = require("node:url")
const { randomUUID, createHash } = require("node:crypto")
const { DatabaseSync } = require("node:sqlite")
const ts = require("typescript")
const { drizzle } = require(
	path.join(path.dirname(require.resolve("drizzle-orm/expo-sqlite")), "driver.cjs")
)

function harness(t) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "prosthetic-files-test-"))
	const faults = { copy: false, remove: false, ready: false, forget: false }
	const connections = new Map()
	const secure = new Map()
	const kv = new Map()
	const profiles = new Map()
	const logs = []
	t.after(() => {
		for (const item of connections.values()) item.sql.close()
		assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()))
		assert.ok(path.basename(root).startsWith("prosthetic-files-test-"))
		fs.rmSync(root, { recursive: true, force: true })
	})
	const toPath = (value) => {
		const uri = typeof value === "string" ? value : value.uri
		return uri.startsWith("file:") ? fileURLToPath(uri) : uri
	}
	const insideRoot = (target) => {
		const relative = path.relative(root, path.resolve(target))
		assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative))
	}
	class Directory {
		constructor(...parts) {
			this.path = path.resolve(...parts.map(toPath))
		}
		get uri() {
			return pathToFileURL(this.path + path.sep).href
		}
		get exists() {
			return fs.existsSync(this.path)
		}
		create() {
			insideRoot(this.path)
			fs.mkdirSync(this.path, { recursive: true })
		}
		delete() {
			insideRoot(this.path)
			if (faults.remove) throw new Error("Injected filesystem deletion failure")
			fs.rmSync(this.path, { recursive: true })
		}
	}
	class File {
		constructor(...parts) {
			this.path = path.resolve(...parts.map(toPath))
		}
		get uri() {
			return pathToFileURL(this.path).href
		}
		get name() {
			return path.basename(this.path)
		}
		get parentDirectory() {
			return new Directory(path.dirname(this.path))
		}
		get exists() {
			return fs.existsSync(this.path)
		}
		get size() {
			return fs.statSync(this.path).size
		}
		get type() {
			if (faults.metadataNames?.includes(this.name)) throw new Error("Injected metadata failure")
			return this.path.endsWith(".jpg") ? "image/jpeg" : "application/pdf"
		}
		get contentUri() {
			return this.uri
		}
		async copy(destination) {
			insideRoot(destination.path)
			if (faults.copy || faults.copyNames?.includes(this.name)) {
				fs.writeFileSync(destination.path, "partial")
				throw new Error("Injected copy failure")
			}
			await fs.promises.copyFile(this.path, destination.path, fs.constants.COPYFILE_EXCL)
		}
		delete() {
			insideRoot(this.path)
			if (faults.remove) throw new Error("Injected deletion failure")
			fs.unlinkSync(this.path)
		}
	}
	function connection(name) {
		if (connections.has(name)) return connections.get(name)
		assert.match(name, /^[a-zA-Z0-9_.-]+$/)
		const sql = new DatabaseSync(path.join(root, name), { enableDoubleQuotedStringLiterals: true })
		const adapter = {
			__testSql: sql,
			execSync: (query) => sql.exec(query),
			prepareSync(query) {
				const statement = sql.prepare(query)
				return {
					executeSync(params) {
						if (
							faults.ready &&
							query.startsWith('update "file_entries"') &&
							params.includes("ready")
						)
							throw new Error("Injected SQLite update failure")
						if (faults.forget && query.startsWith('delete from "file_entries"'))
							throw new Error("Injected SQLite delete failure")
						if (/^\s*(select|pragma)/i.test(query)) {
							const rows = statement.all(...params)
							return { getAllSync: () => rows, getFirstSync: () => rows[0] }
						}
						const result = statement.run(...params)
						return { changes: result.changes, lastInsertRowId: result.lastInsertRowid }
					},
					executeForRawResultSync(params) {
						statement.setReturnArrays(true)
						return { getAllSync: () => statement.all(...params) }
					},
				}
			},
		}
		const result = { sql, adapter }
		connections.set(name, result)
		return result
	}
	const cache = new Map()
	const picker = {
		result: { canceled: true, assets: null },
		permission: { granted: true, canAskAgain: true },
		calls: [],
		openError: null,
		sharingAvailable: true,
		shared: null,
	}
	const native = {
		"react-native": { Platform: { OS: "android" } },
		"drizzle-orm/expo-sqlite": { drizzle },
		"expo-sqlite": { openDatabaseSync: (name) => connection(name).adapter },
		"expo-sqlite/kv-store": {
			Storage: {
				getItemAsync: async (key) => kv.get(key) ?? null,
				setItemAsync: async (key, value) => {
					kv.set(key, value)
				},
			},
		},
		"expo-secure-store": {
			getItemAsync: async (key) => secure.get(key) ?? null,
			setItemAsync: async (key, value) => {
				secure.set(key, value)
			},
			deleteItemAsync: async (key) => {
				secure.delete(key)
			},
		},
		"expo-crypto": {
			randomUUID,
			CryptoDigestAlgorithm: { SHA256: "sha256" },
			digestStringAsync: async (algorithm, value) =>
				createHash(algorithm).update(value).digest("hex"),
		},
		"expo-file-system": { Directory, File, Paths: { document: new Directory(root) } },
		"expo-image-picker": {
			UIImagePickerPreferredAssetRepresentationMode: { Current: "current" },
			requestCameraPermissionsAsync: async () => {
				picker.calls.push("permission")
				return picker.permission
			},
			launchCameraAsync: async () => {
				picker.calls.push("camera")
				return picker.result
			},
			launchImageLibraryAsync: async () => {
				picker.calls.push("gallery")
				return picker.result
			},
		},
		"expo-document-picker": {
			getDocumentAsync: async () => {
				picker.calls.push("documents")
				return picker.result
			},
		},
		"expo-intent-launcher": {
			startActivityAsync: async () => {
				picker.calls.push("open")
				if (picker.openError) throw picker.openError
			},
		},
		"expo-sharing": {
			isAvailableAsync: async () => {
				picker.calls.push("sharing-available")
				return picker.sharingAvailable
			},
			shareAsync: async (uri, options) => {
				picker.calls.push("share")
				picker.shared = { uri, options }
			},
		},
		"@/translations/i18n": {
			__esModule: true,
			default: {
				language: "pl",
				t: (key) => (key === "files.unknownDate" ? "Unknown date" : "dzisiaj"),
			},
		},
		"@/src/services/authService": {
			authService: {
				profile: async (token) => {
					if (!profiles.has(token)) throw new Error("Injected profile lookup failure")
					return profiles.get(token)
				},
			},
		},
	}
	function resolve(target) {
		for (const candidate of [target, target + ".ts", target + ".js", path.join(target, "index.ts")])
			if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
		throw new Error(`Missing test module ${target}`)
	}
	function load(file) {
		file = resolve(path.resolve(file))
		if (cache.has(file)) return cache.get(file).exports
		const module = { exports: {} }
		cache.set(file, module)
		if (file.endsWith(".sql")) {
			module.exports = fs.readFileSync(file, "utf8")
			return module.exports
		}
		if (file.endsWith(".json")) {
			module.exports = JSON.parse(fs.readFileSync(file, "utf8"))
			return module.exports
		}
		const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2022,
				esModuleInterop: true,
			},
		}).outputText
		const localRequire = (name) => {
			if (native[name]) return native[name]
			if (name.startsWith("@/") || name.startsWith(".")) {
				const target = name.startsWith("@/")
					? path.resolve(name.slice(2))
					: path.resolve(path.dirname(file), name)
				const alias =
					"@/" + path.relative(process.cwd(), target).replaceAll(path.sep, "/").replace(/\.ts$/, "")
				if (native[alias]) return native[alias]
				return load(target)
			}
			return require(name)
		}
		new Function("require", "module", "exports", "console", "__DEV__", output)(
			localRequire,
			module,
			module.exports,
			{
				warn: (...values) => logs.push(values),
				error: (...values) => logs.push(values),
				info() {},
			},
			false
		)
		return module.exports
	}
	let client = load("db/client.ts")
	const sql = client.expoDb.__testSql
	const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"))
	for (const entry of journal.entries) sql.exec(fs.readFileSync(`drizzle/${entry.tag}.sql`, "utf8"))
	sql.exec(
		'CREATE TABLE "__drizzle_migrations" (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at NUMERIC)'
	)
	sql
		.prepare('INSERT INTO "__drizzle_migrations" (hash,created_at) VALUES (?,?)')
		.run("existing", journal.entries.at(-1).when)
	sql.exec("PRAGMA foreign_keys=ON")
	sql.exec(`INSERT INTO users(id,name) VALUES(1,'First user');
		INSERT INTO prostheses(id,name,side,limb_type,amputation_level,created_at,updated_at) VALUES('p1','First','left','lower','test','2026-01-01','2026-01-01'),('p2','Second','right','lower','test','2026-01-01','2026-01-01');
		INSERT INTO brands(id,name) VALUES('b1','Brand');
		INSERT INTO models(id,brand_id,name,type) VALUES('m1','b1','Model','socket');
		INSERT INTO components(id,prosthesis_id,model_id,assembly_date,created_at,updated_at) VALUES('c1','p1','m1','2026-01-01','2026-01-01','2026-01-01');`)
	client.activateDatabaseSession("user_00000000-0000-4000-8000-000000000001", client.legacyDatabase)
	const metadata = load("src/utils/fileMetadata.ts")
	const source = path.join(root, "source.pdf")
	fs.writeFileSync(source, "complete source file")
	const asset = metadata.pickedFile({
		uri: pathToFileURL(source).href,
		name: "source.pdf",
		mimeType: "application/pdf",
	})
	return {
		root,
		faults,
		metadata,
		asset,
		load,
		cache,
		picker,
		secure,
		profiles,
		logs,
		get client() {
			return client
		},
		restart() {
			cache.clear()
			client = load("db/client.ts")
		},
		get sql() {
			return client.expoDb.__testSql
		},
		get access() {
			return { userId: 1, session: client.getDatabaseSession() }
		},
		get service() {
			return load("src/services/fileStorageService.ts")
		},
		rows: () => client.expoDb.__testSql.prepare("SELECT * FROM file_entries").all(),
		context: { type: "general", prosthesisId: null, resourceId: null },
	}
}

module.exports = { harness }
