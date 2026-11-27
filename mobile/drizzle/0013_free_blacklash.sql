CREATE TABLE `specialist_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`specialist_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`is_unread` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`specialist_id`) REFERENCES `specialists`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "specialist_messages_created_at_check" CHECK("specialist_messages"."created_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')
);
--> statement-breakpoint
CREATE INDEX `specialist_messages_specialist_id_created_at_idx` ON `specialist_messages` (`specialist_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `specialist_messages_is_unread_idx` ON `specialist_messages` (`is_unread`);--> statement-breakpoint
CREATE TABLE `specialists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`surname` text,
	`email` text,
	`phone` text
);
