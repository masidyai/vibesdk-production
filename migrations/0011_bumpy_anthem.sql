CREATE TABLE `custom_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`verified` integer DEFAULT false,
	`verification_token` text NOT NULL,
	`cloudflare_hostname_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_domains_domain_unique` ON `custom_domains` (`domain`);--> statement-breakpoint
CREATE INDEX `custom_domains_app_idx` ON `custom_domains` (`app_id`);--> statement-breakpoint
CREATE INDEX `custom_domains_user_idx` ON `custom_domains` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `custom_domains_domain_idx` ON `custom_domains` (`domain`);