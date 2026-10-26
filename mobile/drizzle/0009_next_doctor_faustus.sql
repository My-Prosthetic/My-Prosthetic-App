CREATE TABLE `measure_levels` (
	`measure_id` text NOT NULL,
	`level` integer NOT NULL,
	`distance` integer NOT NULL,
	`value` real NOT NULL,
	PRIMARY KEY(`measure_id`, `level`),
	FOREIGN KEY (`measure_id`) REFERENCES `measures`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "measure_levels_level_check" CHECK("measure_levels"."level" BETWEEN 1 AND 5),
	CONSTRAINT "measure_levels_distance_check" CHECK("measure_levels"."distance" > 0)
);
--> statement-breakpoint
CREATE TABLE `measures` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`side` text NOT NULL,
	`limb_type` text NOT NULL,
	`is_dirty` integer DEFAULT true NOT NULL,
	`deleted_at` text,
	`updated_at` text NOT NULL,
	CONSTRAINT "measures_side_check" CHECK("measures"."side" IN ('left', 'right')),
	CONSTRAINT "measures_limb_type_check" CHECK("measures"."limb_type" IN ('upper', 'lower'))
);
