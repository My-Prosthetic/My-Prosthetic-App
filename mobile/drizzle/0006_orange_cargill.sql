CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique_idx` ON `brands` ("name" COLLATE NOCASE);--> statement-breakpoint
CREATE TABLE `models` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `models_brand_type_idx` ON `models` (`brand_id`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `models_brand_type_name_unique_idx` ON `models` (`brand_id`,`type`,`name`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_components` (
	`id` text PRIMARY KEY NOT NULL,
	`prosthesis_id` text NOT NULL,
	`model_id` text NOT NULL,
	`is_final` integer,
	`is_historical` integer DEFAULT false NOT NULL,
	`assembly_date` text NOT NULL,
	`warranty_end_date` text,
	`expected_exchange_date` text,
	`description` text,
	`remind_exchange_email` integer,
	`remind_exchange_app` integer,
	`remind_exchange_push` integer,
	`remind_warranty_email` integer,
	`remind_warranty_app` integer,
	`remind_warranty_push` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`prosthesis_id`) REFERENCES `prostheses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_components`("id", "prosthesis_id", "model_id", "is_final", "is_historical", "assembly_date", "warranty_end_date", "expected_exchange_date", "description", "remind_exchange_email", "remind_exchange_app", "remind_exchange_push", "remind_warranty_email", "remind_warranty_app", "remind_warranty_push", "created_at", "updated_at", "deleted_at", "is_dirty") SELECT "id", "prosthesis_id", "model_id", "is_final", "is_historical", "assembly_date", "warranty_end_date", "expected_exchange_date", "description", "remind_exchange_email", "remind_exchange_app", "remind_exchange_push", "remind_warranty_email", "remind_warranty_app", "remind_warranty_push", "created_at", "updated_at", "deleted_at", "is_dirty" FROM `components`;--> statement-breakpoint
DROP TABLE `components`;--> statement-breakpoint
ALTER TABLE `__new_components` RENAME TO `components`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `components_prosthesis_id_idx` ON `components` (`prosthesis_id`);