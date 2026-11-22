CREATE TABLE `specialists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`surname` text,
	`email` text,
	`phone` text
);
--> statement-breakpoint
CREATE TABLE `specialist_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`specialist_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`is_unread` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`specialist_id`) REFERENCES `specialists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `specialist_messages_specialist_id_created_at_idx` ON `specialist_messages` (`specialist_id`,`created_at`);