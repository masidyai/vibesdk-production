ALTER TABLE `apps` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `apps` ADD `published_url` text;--> statement-breakpoint
CREATE UNIQUE INDEX `apps_slug_unique` ON `apps` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `apps_slug_idx` ON `apps` (`slug`);