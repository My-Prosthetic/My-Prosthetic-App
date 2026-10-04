import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { prostheses } from "./prostheses"
import { models } from "./models"
import { relations } from "drizzle-orm"

export const components = sqliteTable(
	"components",
	{
		id: text("id").primaryKey(),

		prosthesisId: text("prosthesis_id")
			.notNull()
			.references(() => prostheses.id, { onDelete: "restrict" }),

		modelId: text("model_id")
			.notNull()
			.references(() => models.id, { onDelete: "restrict" }),

		isFinal: integer("is_final", {
			mode: "boolean",
		}).default(true),

		isHistorical: integer("is_historical", {
			mode: "boolean",
		})
			.notNull()
			.default(false),

		assemblyDate: text("assembly_date").notNull(),

		warrantyEndDate: text("warranty_end_date"),

		expectedExchangeDate: text("expected_exchange_date"),

		description: text("description"),

		remindExchangeEmail: integer("remind_exchange_email", { mode: "boolean" }),
		remindExchangeApp: integer("remind_exchange_app", { mode: "boolean" }),
		remindExchangePush: integer("remind_exchange_push", { mode: "boolean" }),

		remindWarrantyEmail: integer("remind_warranty_email", { mode: "boolean" }),
		remindWarrantyApp: integer("remind_warranty_app", { mode: "boolean" }),
		remindWarrantyPush: integer("remind_warranty_push", { mode: "boolean" }),

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

export const componentsRelations = relations(components, ({ one }) => ({
	model: one(models, {
		fields: [components.modelId],
		references: [models.id],
	}),
}))
