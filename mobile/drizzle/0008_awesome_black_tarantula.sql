CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`prosthesis_id` text NOT NULL,
	`component_id` text,
	`type` text NOT NULL,
	`coordinates_json` text,
	`intensity` integer,
	`activity` text,
	`description` text,
	`occurred_at` text NOT NULL,
	`photo_uris_json` text DEFAULT '[]' NOT NULL,
	`audio_uri` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`is_dirty` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`prosthesis_id`) REFERENCES `prostheses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `incidents_prosthesis_id_idx` ON `incidents` (`prosthesis_id`);--> statement-breakpoint
CREATE INDEX `incidents_component_id_idx` ON `incidents` (`component_id`);--> statement-breakpoint
CREATE INDEX `incidents_occurred_at_idx` ON `incidents` (`occurred_at`);