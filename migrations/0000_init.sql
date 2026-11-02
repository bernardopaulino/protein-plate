CREATE TABLE `day_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_plans_user_name_unique` ON `day_plans` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `food_moments` (
	`food_id` text NOT NULL,
	`moment` text NOT NULL,
	PRIMARY KEY(`food_id`, `moment`),
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `food_portions` (
	`id` text PRIMARY KEY NOT NULL,
	`food_id` text NOT NULL,
	`label_pt` text NOT NULL,
	`label_en` text NOT NULL,
	`grams` real NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `food_portions_food_idx` ON `food_portions` (`food_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `food_portions_one_default_idx` ON `food_portions` (`food_id`) WHERE "food_portions"."is_default" = 1;--> statement-breakpoint
CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`name_pt` text NOT NULL,
	`name_en` text NOT NULL,
	`category` text NOT NULL,
	`role` text NOT NULL,
	`protein_per_100g` real NOT NULL,
	`kcal_per_100g` real NOT NULL,
	`carbs_per_100g` real NOT NULL,
	`fat_per_100g` real NOT NULL,
	`weight_basis` text NOT NULL,
	`processing` text NOT NULL,
	`ease` integer NOT NULL,
	`example_rank` integer NOT NULL,
	`tca_code` text NOT NULL,
	`ideas_pt` text NOT NULL,
	`ideas_en` text NOT NULL,
	`data_version` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `foods_role_category_idx` ON `foods` (`role`,`category`);--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`meal` text NOT NULL,
	`food_id` text NOT NULL,
	`portion_id` text NOT NULL,
	`portion_count` real NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `day_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "plan_items_portion_count_check" CHECK("plan_items"."portion_count" >= 0.5 AND "plan_items"."portion_count" <= 4 AND "plan_items"."portion_count" * 2 = CAST("plan_items"."portion_count" * 2 AS INTEGER))
);
--> statement-breakpoint
CREATE INDEX `plan_items_plan_idx` ON `plan_items` (`plan_id`,`position`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`daily_target_g` integer NOT NULL,
	`intensity` text NOT NULL,
	`meals` text NOT NULL,
	`post_workout_meal` text,
	`locale` text DEFAULT 'pt' NOT NULL,
	`consent_version` integer,
	`consented_at` integer,
	`last_import_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`recipe_id` text NOT NULL,
	`position` integer NOT NULL,
	`food_id` text NOT NULL,
	`grams` real NOT NULL,
	PRIMARY KEY(`recipe_id`, `position`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`cache_key` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`meal` text NOT NULL,
	`post_workout` integer NOT NULL,
	`servings` integer NOT NULL,
	`prep_minutes` integer NOT NULL,
	`steps` text NOT NULL,
	`protein_per_serving_g` real NOT NULL,
	`meal_target_g` real NOT NULL,
	`model` text NOT NULL,
	`prompt_version` integer NOT NULL,
	`food_data_version` integer NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_cache_key_unique` ON `recipes` (`cache_key`);--> statement-breakpoint
CREATE INDEX `recipes_created_idx` ON `recipes` (`created_at`);--> statement-breakpoint
CREATE TABLE `saved_recipes` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`saved_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_recipes_user_idx` ON `saved_recipes` (`user_id`,`saved_at`);--> statement-breakpoint
CREATE TABLE `usage_counters` (
	`key_hash` text NOT NULL,
	`day` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`key_hash`, `day`)
);
--> statement-breakpoint
CREATE INDEX `usage_counters_day_idx` ON `usage_counters` (`day`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);