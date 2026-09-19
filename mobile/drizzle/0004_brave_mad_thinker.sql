CREATE TABLE `conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`medical_profile_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`medical_profile_id`) REFERENCES `medical_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `conditions_medical_profile_id_idx` ON `conditions` (`medical_profile_id`);--> statement-breakpoint
CREATE TABLE `medical_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`k_level` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`medical_profile_id` text NOT NULL,
	`name` text NOT NULL,
	`usage` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`medical_profile_id`) REFERENCES `medical_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `medications_medical_profile_id_idx` ON `medications` (`medical_profile_id`);