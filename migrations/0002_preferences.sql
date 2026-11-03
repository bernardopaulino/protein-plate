ALTER TABLE `profiles` ADD `weight_kg` real;--> statement-breakpoint
ALTER TABLE `profiles` ADD `manual_target` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `pre_workout_meal` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `diet` text DEFAULT 'omnivore' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `allergies` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `liked_foods` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `equipment` text DEFAULT '["stove","microwave"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `cook_minutes` integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `health_consent_at` integer;--> statement-breakpoint
ALTER TABLE `profiles` ADD `onboarded_at` integer;