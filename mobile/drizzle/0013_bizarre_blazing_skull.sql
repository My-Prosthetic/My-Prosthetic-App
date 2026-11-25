CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`specialist_id` text NOT NULL,
	`specialist_name` text NOT NULL,
	`permissions` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_patient_specialist_unique` ON `shares` (`patient_id`,`specialist_id`);--> statement-breakpoint
CREATE TABLE `share_sync_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`specialist_id` text NOT NULL,
	`operation` text NOT NULL,
	`permissions` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL
);
