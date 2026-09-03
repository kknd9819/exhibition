ALTER TABLE `enterprises` ADD `account_id` text;
--> statement-breakpoint
ALTER TABLE `enterprises` ADD `industry` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `enterprises` ADD `contact_name` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `enterprises` ADD `contact_email_masked` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `enterprises` ADD `website` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `enterprises` ADD `address` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_enterprises_account` ON `enterprises` (`account_id`);
--> statement-breakpoint
ALTER TABLE `event_exhibitors` ADD `category` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `event_exhibitors` ADD `description` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `event_exhibitors` ADD `current_version_id` text;
--> statement-breakpoint
CREATE TABLE `exhibitor_profile_versions` (`id` text PRIMARY KEY NOT NULL,`event_id` text NOT NULL,`event_exhibitor_id` text NOT NULL,`version_no` integer NOT NULL,`profile_json` text NOT NULL,`review_status` text NOT NULL,`submitted_by` text,`approved_by` text,`published_at` text,`created_at` text NOT NULL,`updated_at` text NOT NULL,FOREIGN KEY (`event_id`) REFERENCES `events`(`id`),FOREIGN KEY (`event_exhibitor_id`) REFERENCES `event_exhibitors`(`id`));
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_exhibitor_profile_version` ON `exhibitor_profile_versions` (`event_exhibitor_id`,`version_no`);
--> statement-breakpoint
CREATE TABLE `products` (`id` text PRIMARY KEY NOT NULL,`event_id` text NOT NULL,`event_exhibitor_id` text NOT NULL,`name` text NOT NULL,`category` text NOT NULL,`publish_status` text NOT NULL,`current_version_id` text,`created_at` text NOT NULL,`updated_at` text NOT NULL,FOREIGN KEY (`event_id`) REFERENCES `events`(`id`),FOREIGN KEY (`event_exhibitor_id`) REFERENCES `event_exhibitors`(`id`));
--> statement-breakpoint
CREATE INDEX `idx_products_event_status` ON `products` (`event_id`,`publish_status`);
--> statement-breakpoint
CREATE TABLE `product_versions` (`id` text PRIMARY KEY NOT NULL,`product_id` text NOT NULL,`version_no` integer NOT NULL,`content_json` text NOT NULL,`review_status` text NOT NULL,`submitted_by` text,`approved_by` text,`published_at` text,`created_at` text NOT NULL,`updated_at` text NOT NULL,FOREIGN KEY (`product_id`) REFERENCES `products`(`id`));
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_product_versions_no` ON `product_versions` (`product_id`,`version_no`);
--> statement-breakpoint
CREATE TABLE `inquiries` (`id` text PRIMARY KEY NOT NULL,`event_id` text NOT NULL,`event_exhibitor_id` text NOT NULL,`product_id` text,`customer_name` text NOT NULL,`contact_masked` text NOT NULL,`content` text NOT NULL,`status` text NOT NULL,`handled_by` text,`handled_at` text,`created_at` text NOT NULL,`updated_at` text NOT NULL,FOREIGN KEY (`event_id`) REFERENCES `events`(`id`),FOREIGN KEY (`event_exhibitor_id`) REFERENCES `event_exhibitors`(`id`),FOREIGN KEY (`product_id`) REFERENCES `products`(`id`));
--> statement-breakpoint
CREATE INDEX `idx_inquiries_event_status` ON `inquiries` (`event_id`,`status`);
