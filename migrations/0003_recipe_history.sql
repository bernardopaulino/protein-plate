CREATE TABLE `meal_recipes` (
	`user_id` text NOT NULL,
	`meal` text NOT NULL,
	`recipe_id` text NOT NULL,
	`used_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `meal`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_recipes` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_recipes_user_idx` ON `user_recipes` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `saved_recipes` ADD `favorite` integer DEFAULT false NOT NULL;