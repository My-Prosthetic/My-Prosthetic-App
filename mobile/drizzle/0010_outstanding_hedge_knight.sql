PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_measures` (
	`id` text PRIMARY KEY NOT NULL,
	`measured_at` text NOT NULL,
	`side` text NOT NULL,
	`limb_type` text NOT NULL,
	`is_dirty` integer DEFAULT true NOT NULL,
	`deleted_at` text,
	`updated_at` text NOT NULL,
	CONSTRAINT "measures_side_check" CHECK("__new_measures"."side" IN ('left', 'right')),
	CONSTRAINT "measures_limb_type_check" CHECK("__new_measures"."limb_type" IN ('upper', 'lower')),
	CONSTRAINT "measures_measured_at_check" CHECK("__new_measures"."measured_at" GLOB '????-??-??T??:??:??.???Z')
);
--> statement-breakpoint
INSERT INTO `__new_measures`("id", "measured_at", "side", "limb_type", "is_dirty", "deleted_at", "updated_at") SELECT "id", "measured_at", "side", "limb_type", "is_dirty", "deleted_at", "updated_at" FROM `measures`;--> statement-breakpoint
DROP TABLE `measures`;--> statement-breakpoint
ALTER TABLE `__new_measures` RENAME TO `measures`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `measures_latest_lookup_idx` ON `measures` (`side`,`limb_type`,`measured_at`);--> statement-breakpoint
CREATE INDEX `measures_sync_idx` ON `measures` (`is_dirty`,`deleted_at`);