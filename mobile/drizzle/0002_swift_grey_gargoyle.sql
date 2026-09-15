PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_components` (
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
	FOREIGN KEY (`prosthesis_id`) REFERENCES `prostheses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_components`("id", "prosthesis_id", "type", "name", "manufacturer", "model", "serial_number", "is_test_socket", "installed_at", "warranty_until", "created_at", "updated_at", "deleted_at", "is_dirty") SELECT "id", "prosthesis_id", "type", "name", "manufacturer", "model", "serial_number", "is_test_socket", "installed_at", "warranty_until", "created_at", "updated_at", "deleted_at", "is_dirty" FROM `components`;--> statement-breakpoint
DROP TABLE `components`;--> statement-breakpoint
ALTER TABLE `__new_components` RENAME TO `components`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `components_prosthesis_id_idx` ON `components` (`prosthesis_id`);