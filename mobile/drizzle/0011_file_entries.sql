CREATE TABLE `file_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`context_type` text NOT NULL,
	`context_key` text NOT NULL,
	`prosthesis_id` text,
	`resource_id` text,
	`parent_id` text,
	`parent_key` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`file_name` text NOT NULL,
	`extension` text DEFAULT '' NOT NULL,
	`mime_type` text,
	`category` text,
	`storage_path` text NOT NULL,
	`legacy_uri` text,
	`size` integer,
	`created_at` text NOT NULL,
	`state` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`parent_id`) REFERENCES `file_entries`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `file_entries_owner_idx` ON `file_entries` (`user_id`,`context_key`,`parent_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `file_entries_sibling_name_idx` ON `file_entries` (`user_id`,`context_key`,`parent_key`,`name_key`);
