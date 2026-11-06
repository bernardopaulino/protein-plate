ALTER TABLE `recipes` ADD `pre_workout` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `source_recipe_id` text;--> statement-breakpoint
CREATE INDEX `recipes_library_idx` ON `recipes` (`locale`,`meal`,`food_data_version`);