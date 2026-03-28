CREATE TABLE `charging_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`station_id` integer,
	`phone_brand` text NOT NULL,
	`start_battery` integer NOT NULL,
	`target_battery` integer DEFAULT 100,
	`cost_pesos` real NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'active',
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`station_id`) REFERENCES `charging_stations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `charging_stations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text DEFAULT 'PSPCS' NOT NULL,
	`owner_id` integer,
	`owner_name` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`address` text NOT NULL,
	`contact_number` text,
	`is_active` integer DEFAULT true,
	`solar_watts` real,
	`battery_level` real,
	`output_voltage` text DEFAULT '3.6VDC',
	`total_sessions` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient_email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`phone_brand` text,
	`phone_battery` integer,
	`contact_number` text,
	`address` text,
	`worklife_answer` text,
	`is_subscribed` integer DEFAULT false,
	`subscription_expiry` integer,
	`gcash_number` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);