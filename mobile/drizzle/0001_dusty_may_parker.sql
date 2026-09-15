CREATE TABLE `components` (
	`id` text PRIMARY KEY NOT NULL,
	`prosthesis_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`manufacturer` text,
	`model` text,
	`serial_number` text,
	`is_test_socket` integer,
	`installed_at` text,
	`warranty_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`prosthesis_id`) REFERENCES `prostheses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prostheses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`side` text NOT NULL,
	`limb_type` text NOT NULL,
	`amputation_level` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL
);
