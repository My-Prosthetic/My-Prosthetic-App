CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique_idx` ON `brands` (`name`);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `models_brand_type_idx` ON `models` (`brand_id`,`type`);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_brand_type_name_unique_idx` ON `models` (`brand_id`,`type`,`name`);
--> statement-breakpoint
DROP TABLE `components`;
--> statement-breakpoint
CREATE TABLE `components` (
	`id` text PRIMARY KEY NOT NULL,
	`prosthesis_id` text NOT NULL,
	`model_id` text NOT NULL,
	`is_final` integer DEFAULT true,
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
CREATE INDEX `components_prosthesis_id_idx` ON `components` (`prosthesis_id`);