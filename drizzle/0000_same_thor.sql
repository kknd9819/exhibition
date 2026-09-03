CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`actor_name` text NOT NULL,
	`module` text NOT NULL,
	`object_type` text NOT NULL,
	`object_id` text NOT NULL,
	`action` text NOT NULL,
	`result` text NOT NULL,
	`request_id` text NOT NULL,
	`occurred_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_event_time` ON `audit_logs` (`event_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `enterprises` (
	`id` text PRIMARY KEY NOT NULL,
	`name_zh` text NOT NULL,
	`name_intl` text NOT NULL,
	`country` text NOT NULL,
	`registration_no` text,
	`account_contact` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_enterprises_country_registration` ON `enterprises` (`country`,`registration_no`);--> statement-breakpoint
CREATE TABLE `event_exhibitors` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`enterprise_id` text NOT NULL,
	`qualification_status` text NOT NULL,
	`publish_status` text NOT NULL,
	`product_count` integer DEFAULT 0 NOT NULL,
	`booth_no` text,
	`source` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enterprise_id`) REFERENCES `enterprises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_event_exhibitors_event_enterprise` ON `event_exhibitors` (`event_id`,`enterprise_id`);--> statement-breakpoint
CREATE INDEX `idx_event_exhibitors_event_status` ON `event_exhibitors` (`event_id`,`qualification_status`,`publish_status`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`year` integer NOT NULL,
	`city` text NOT NULL,
	`country` text NOT NULL,
	`timezone` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text NOT NULL,
	`owner_name` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_events_code` ON `events` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_events_slug` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_events_year_status` ON `events` (`year`,`status`);--> statement-breakpoint
CREATE TABLE `portal_page_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`page_id` text NOT NULL,
	`version_no` integer NOT NULL,
	`language` text NOT NULL,
	`layout_json` text NOT NULL,
	`change_summary` text NOT NULL,
	`review_status` text NOT NULL,
	`submitted_by` text,
	`approved_by` text,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`page_id`) REFERENCES `portal_pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_portal_page_versions_no` ON `portal_page_versions` (`page_id`,`version_no`,`language`);--> statement-breakpoint
CREATE TABLE `portal_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`page_type` text NOT NULL,
	`status` text NOT NULL,
	`current_version_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_portal_pages_event_slug` ON `portal_pages` (`event_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_portal_pages_event_status` ON `portal_pages` (`event_id`,`status`);--> statement-breakpoint
CREATE TABLE `registration_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`review_mode` text NOT NULL,
	`form_version` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_registration_activities_event` ON `registration_activities` (`event_id`);--> statement-breakpoint
CREATE TABLE `registration_records` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`account_id` text NOT NULL,
	`person_name` text NOT NULL,
	`mobile_masked` text NOT NULL,
	`country` text NOT NULL,
	`organization` text NOT NULL,
	`status` text NOT NULL,
	`first_channel` text NOT NULL,
	`submitted_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activity_id`) REFERENCES `registration_activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_registration_records_event_status` ON `registration_records` (`event_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_registration_records_activity` ON `registration_records` (`activity_id`);--> statement-breakpoint
CREATE TABLE `review_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`module` text NOT NULL,
	`object_type` text NOT NULL,
	`object_id` text NOT NULL,
	`version_id` text,
	`title` text NOT NULL,
	`submitter_name` text NOT NULL,
	`reviewer_name` text,
	`status` text NOT NULL,
	`reason` text,
	`submitted_at` text NOT NULL,
	`decided_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_review_tasks_event_status` ON `review_tasks` (`event_id`,`status`);