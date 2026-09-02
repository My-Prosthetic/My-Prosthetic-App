ALTER TABLE `deposits` RENAME COLUMN `amout` TO `amount`;
--> statement-breakpoint
CREATE INDEX `deposits_goal_id_idx` ON `deposits` (`goal_id`);