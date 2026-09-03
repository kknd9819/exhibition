ALTER TABLE `registration_activities` ADD `description` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `timezone` text DEFAULT 'Asia/Shanghai' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `start_at` text;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `end_at` text;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `registration_start_at` text;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `registration_end_at` text;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `quota` integer DEFAULT 999999 NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `location_name` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `allow_edit` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `show_in_portal` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `is_private` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `form_schema_json` text DEFAULT '{"fields":[]}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `success_message` text DEFAULT '报名已提交' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_activities` ADD `notification_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
CREATE TABLE `registration_form_versions` (
  `id` text PRIMARY KEY NOT NULL,
  `activity_id` text NOT NULL,
  `version_no` integer NOT NULL,
  `schema_json` text NOT NULL,
  `change_summary` text NOT NULL,
  `created_by` text NOT NULL,
  `status` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`activity_id`) REFERENCES `registration_activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_registration_form_versions_no` ON `registration_form_versions` (`activity_id`,`version_no`);
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `email_masked` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `job_title` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `form_version` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `answers_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `review_reason` text;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `checked_in_at` text;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `checkin_scope` text;
--> statement-breakpoint
ALTER TABLE `registration_records` ADD `checkin_method` text;
--> statement-breakpoint
CREATE TABLE `checkin_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `event_id` text NOT NULL,
  `activity_id` text,
  `record_id` text NOT NULL,
  `scope` text NOT NULL,
  `method` text NOT NULL,
  `operator_name` text NOT NULL,
  `result` text NOT NULL,
  `occurred_at` text NOT NULL,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`activity_id`) REFERENCES `registration_activities`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`record_id`) REFERENCES `registration_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_checkin_logs_event_time` ON `checkin_logs` (`event_id`,`occurred_at`);
