import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { prostheses } from "./prostheses"

export const components = sqliteTable(
	"components",
	{
		id: text("id").primaryKey(),

		prosthesisId: text("prosthesis_id")
			.notNull()
			.references(() => prostheses.id),

		type: text("type", {
			enum: ["socket", "knee", "foot", "liner", "adapter", "other"],
		}).notNull(),

		brand: text("brand"),
		model: text("model"),

		isFinal: integer("is_final", {
			mode: "boolean",
		})
			.notNull()
			.default(false),

		isHistorical: integer("is_historical", {
			mode: "boolean",
		})
			.notNull()
			.default(false),

		assemblyDate: text("assembly_date"),
		warrantyEndDate: text("warranty_end_date"),
		expectedExchangeDate: text("expected_exchange_date"),
		description: text("description"),

		remindExchangeEmail: integer("remind_exchange_email", { mode: "boolean" })
			.notNull()
			.default(false),
		remindExchangeApp: integer("remind_exchange_app", { mode: "boolean" })
			.notNull()
			.default(false),
		remindExchangePush: integer("remind_exchange_push", { mode: "boolean" })
			.notNull()
			.default(false),
		remindWarrantyEmail: integer("remind_warranty_email", { mode: "boolean" })
			.notNull()
			.default(false),
		remindWarrantyApp: integer("remind_warranty_app", { mode: "boolean" })
			.notNull()
			.default(false),
		remindWarrantyPush: integer("remind_warranty_push", { mode: "boolean" })
			.notNull()
			.default(false),

		createdAt: text("created_at").notNull(),

		updatedAt: text("updated_at").notNull(),

		deletedAt: text("deleted_at"),

		isDirty: integer("is_dirty", {
			mode: "boolean",
		})
			.notNull()
			.default(true),
	},
	(table) => [index("components_prosthesis_id_idx").on(table.prosthesisId)]
)
