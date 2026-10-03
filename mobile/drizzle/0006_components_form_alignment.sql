ALTER TABLE `components` RENAME COLUMN `manufacturer` TO `brand`;
--> statement-breakpoint
ALTER TABLE `components` RENAME COLUMN `installed_at` TO `assembly_date`;
--> statement-breakpoint
ALTER TABLE `components` RENAME COLUMN `warranty_until` TO `warranty_end_date`;
--> statement-breakpoint
ALTER TABLE `components` ADD `description` text;
--> statement-breakpoint
UPDATE `components`
SET `description` = COALESCE(`description`, `name`)
WHERE `name` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `is_final` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `components`
SET `is_final` = CASE WHEN `is_test_socket` = 0 THEN 1 ELSE 0 END;
--> statement-breakpoint
ALTER TABLE `components` DROP COLUMN `is_test_socket`;
--> statement-breakpoint
ALTER TABLE `components` ADD `is_historical` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `expected_exchange_date` text;
--> statement-breakpoint
ALTER TABLE `components` ADD `remind_exchange_email` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `remind_exchange_app` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `remind_exchange_push` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `remind_warranty_email` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `remind_warranty_app` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` ADD `remind_warranty_push` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `components` DROP COLUMN `name`;
--> statement-breakpoint
ALTER TABLE `components` DROP COLUMN `serial_number`;