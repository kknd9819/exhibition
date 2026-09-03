-- Generated from db/schema.ts. Do not edit by hand.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(191) NOT NULL,
  `code` TEXT NULL,
  `slug` TEXT NULL,
  `name` TEXT NULL,
  `short_name` TEXT NULL,
  `year` BIGINT NULL,
  `city` TEXT NULL,
  `country` TEXT NULL,
  `timezone` TEXT NULL,
  `start_at` TEXT NULL,
  `end_at` TEXT NULL,
  `status` TEXT NULL,
  `owner_name` TEXT NULL,
  `owner_account_id` TEXT NULL,
  `event_type` TEXT NULL,
  `venue_text` TEXT NULL,
  `languages_json` LONGTEXT NULL,
  `version` BIGINT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employee_accounts` (
  `id` VARCHAR(191) NOT NULL,
  `name` TEXT NULL,
  `mobile` TEXT NULL,
  `email` TEXT NULL,
  `group_role` TEXT NULL,
  `status` TEXT NULL,
  `last_login_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `otp_challenges` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `channel` TEXT NULL,
  `destination_masked` TEXT NULL,
  `code_hash` TEXT NULL,
  `expires_at` TEXT NULL,
  `attempts` BIGINT NULL,
  `consumed_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `token_hash` TEXT NULL,
  `expires_at` TEXT NULL,
  `revoked_at` TEXT NULL,
  `device` TEXT NULL,
  `created_at` TEXT NULL,
  `last_seen_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_members` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `account_id` TEXT NULL,
  `role_code` TEXT NULL,
  `permissions_json` LONGTEXT NULL,
  `is_reviewer` BIGINT NULL,
  `status` TEXT NULL,
  `joined_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_features` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `feature_code` TEXT NULL,
  `enabled` BIGINT NULL,
  `config_json` LONGTEXT NULL,
  `updated_by` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_owner_history` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `old_owner_account_id` TEXT NULL,
  `new_owner_account_id` TEXT NULL,
  `old_owner_name` TEXT NULL,
  `new_owner_name` TEXT NULL,
  `reason` LONGTEXT NULL,
  `operator_name` TEXT NULL,
  `effective_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_copy_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `source_event_id` TEXT NULL,
  `target_event_id` TEXT NULL,
  `selection_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `report_json` LONGTEXT NULL,
  `created_by` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portal_pages` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `slug` TEXT NULL,
  `title` TEXT NULL,
  `page_type` TEXT NULL,
  `status` TEXT NULL,
  `current_version_id` TEXT NULL,
  `version` BIGINT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portal_page_versions` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `page_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `language` TEXT NULL,
  `layout_json` LONGTEXT NULL,
  `change_summary` TEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portal_translation_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `page_id` TEXT NULL,
  `source_version_id` TEXT NULL,
  `target_language` TEXT NULL,
  `result_version_id` LONGTEXT NULL,
  `source_sha256` TEXT NULL,
  `provider` TEXT NULL,
  `model` TEXT NULL,
  `prompt_version` TEXT NULL,
  `status` TEXT NULL,
  `requested_by` TEXT NULL,
  `confirmed_by` TEXT NULL,
  `requested_at` TEXT NULL,
  `confirmed_at` TEXT NULL,
  `error_message` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portal_language_publications` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `page_id` TEXT NULL,
  `language` TEXT NULL,
  `current_version_id` TEXT NULL,
  `status` TEXT NULL,
  `source_version_id` TEXT NULL,
  `published_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `review_tasks` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `module` TEXT NULL,
  `object_type` TEXT NULL,
  `object_id` TEXT NULL,
  `version_id` TEXT NULL,
  `title` TEXT NULL,
  `submitter_name` TEXT NULL,
  `reviewer_name` TEXT NULL,
  `status` TEXT NULL,
  `reason` LONGTEXT NULL,
  `submitted_at` TEXT NULL,
  `decided_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registration_activities` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `name` TEXT NULL,
  `description` LONGTEXT NULL,
  `timezone` TEXT NULL,
  `start_at` TEXT NULL,
  `end_at` TEXT NULL,
  `registration_start_at` TEXT NULL,
  `registration_end_at` TEXT NULL,
  `quota` BIGINT NULL,
  `location_name` TEXT NULL,
  `review_mode` TEXT NULL,
  `allow_edit` BIGINT NULL,
  `profile_recheck_enabled` BIGINT NULL,
  `key_profile_fields_json` LONGTEXT NULL,
  `show_in_portal` BIGINT NULL,
  `is_private` BIGINT NULL,
  `form_schema_json` LONGTEXT NULL,
  `form_version` BIGINT NULL,
  `success_message` TEXT NULL,
  `notification_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registration_form_versions` (
  `id` VARCHAR(191) NOT NULL,
  `activity_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `schema_json` LONGTEXT NULL,
  `change_summary` TEXT NULL,
  `created_by` TEXT NULL,
  `status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registration_records` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `activity_id` TEXT NULL,
  `account_id` TEXT NULL,
  `person_name` TEXT NULL,
  `mobile_masked` TEXT NULL,
  `email_masked` TEXT NULL,
  `country` TEXT NULL,
  `organization` TEXT NULL,
  `job_title` TEXT NULL,
  `form_version` BIGINT NULL,
  `answers_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `review_reason` LONGTEXT NULL,
  `first_channel` TEXT NULL,
  `submitted_at` TEXT NULL,
  `checked_in_at` TEXT NULL,
  `checkin_scope` TEXT NULL,
  `checkin_method` TEXT NULL,
  `version` BIGINT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `checkin_logs` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `activity_id` TEXT NULL,
  `record_id` TEXT NULL,
  `scope` TEXT NULL,
  `method` TEXT NULL,
  `operator_name` TEXT NULL,
  `result` LONGTEXT NULL,
  `request_key` TEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registration_access_codes` (
  `id` VARCHAR(191) NOT NULL,
  `record_id` TEXT NULL,
  `code` TEXT NULL,
  `status` TEXT NULL,
  `issued_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `checkin_reversals` (
  `id` VARCHAR(191) NOT NULL,
  `checkin_log_id` TEXT NULL,
  `reason` LONGTEXT NULL,
  `operator_name` TEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprises` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `name_zh` TEXT NULL,
  `name_intl` TEXT NULL,
  `country` TEXT NULL,
  `industry` TEXT NULL,
  `registration_no` TEXT NULL,
  `account_contact` TEXT NULL,
  `contact_name` TEXT NULL,
  `contact_email_masked` TEXT NULL,
  `website` TEXT NULL,
  `address` TEXT NULL,
  `status` TEXT NULL,
  `merged_into_enterprise_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_exhibitors` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `enterprise_id` TEXT NULL,
  `qualification_status` TEXT NULL,
  `publish_status` TEXT NULL,
  `category` TEXT NULL,
  `description` LONGTEXT NULL,
  `current_version_id` TEXT NULL,
  `product_count` BIGINT NULL,
  `booth_no` TEXT NULL,
  `source` TEXT NULL,
  `version` BIGINT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exhibitor_profile_versions` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `event_exhibitor_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `profile_json` LONGTEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `event_exhibitor_id` TEXT NULL,
  `name` TEXT NULL,
  `category` TEXT NULL,
  `publish_status` TEXT NULL,
  `current_version_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_versions` (
  `id` VARCHAR(191) NOT NULL,
  `product_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `content_json` LONGTEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `event_exhibitor_id` TEXT NULL,
  `product_id` TEXT NULL,
  `customer_name` TEXT NULL,
  `contact_masked` TEXT NULL,
  `contact_private` TEXT NULL,
  `content` LONGTEXT NULL,
  `status` TEXT NULL,
  `handled_by` TEXT NULL,
  `handled_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `demand_supply_posts` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `publisher_type` TEXT NULL,
  `publisher_name` TEXT NULL,
  `publisher_enterprise_id` TEXT NULL,
  `publisher_public_account_id` TEXT NULL,
  `post_type` TEXT NULL,
  `title` TEXT NULL,
  `category` TEXT NULL,
  `countries_json` LONGTEXT NULL,
  `description` LONGTEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `source_type` TEXT NULL,
  `source_id` TEXT NULL,
  `inviter_name` TEXT NULL,
  `invitee_name` TEXT NULL,
  `inviter_enterprise_id` TEXT NULL,
  `invitee_enterprise_id` TEXT NULL,
  `inviter_public_account_id` TEXT NULL,
  `invitee_public_account_id` TEXT NULL,
  `proposed_start` TEXT NULL,
  `proposed_end` TEXT NULL,
  `location_preference` TEXT NULL,
  `confirmed_start` TEXT NULL,
  `confirmed_end` TEXT NULL,
  `confirmed_location` TEXT NULL,
  `status` TEXT NULL,
  `created_by` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointment_responses` (
  `id` VARCHAR(191) NOT NULL,
  `appointment_id` TEXT NULL,
  `responder_name` TEXT NULL,
  `action` TEXT NULL,
  `proposed_start` TEXT NULL,
  `proposed_end` TEXT NULL,
  `location_text` TEXT NULL,
  `note` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registration_profile_versions` (
  `id` VARCHAR(191) NOT NULL,
  `record_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `values_json` LONGTEXT NULL,
  `changed_fields_json` LONGTEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `review_reason` LONGTEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `schedule_batches` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `name` TEXT NULL,
  `status` TEXT NULL,
  `submitter_name` TEXT NULL,
  `reviewer_name` TEXT NULL,
  `conflict_report_json` LONGTEXT NULL,
  `submitted_at` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meeting_schedules` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `batch_id` TEXT NULL,
  `appointment_id` TEXT NULL,
  `participant_a` TEXT NULL,
  `participant_b` TEXT NULL,
  `start_at` TEXT NULL,
  `end_at` TEXT NULL,
  `location_text` TEXT NULL,
  `publish_status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assets` (
  `id` VARCHAR(191) NOT NULL,
  `scope` TEXT NULL,
  `event_id` TEXT NULL,
  `asset_type` TEXT NULL,
  `original_name` TEXT NULL,
  `file_key` TEXT NULL,
  `mime_type` TEXT NULL,
  `size_bytes` BIGINT NULL,
  `checksum` TEXT NULL,
  `status` TEXT NULL,
  `scan_result` LONGTEXT NULL,
  `created_by` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_references` (
  `id` VARCHAR(191) NOT NULL,
  `asset_id` TEXT NULL,
  `event_id` TEXT NULL,
  `module` TEXT NULL,
  `object_id` TEXT NULL,
  `version_id` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_items` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `content_type` LONGTEXT NULL,
  `slug` TEXT NULL,
  `status` TEXT NULL,
  `current_version_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_versions` (
  `id` VARCHAR(191) NOT NULL,
  `item_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `title` TEXT NULL,
  `summary` TEXT NULL,
  `body` LONGTEXT NULL,
  `cover_asset_id` TEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_items` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `title` TEXT NULL,
  `file_asset_id` TEXT NULL,
  `access_mode` TEXT NULL,
  `registration_activity_id` TEXT NULL,
  `status` TEXT NULL,
  `created_by` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_download_logs` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `document_id` LONGTEXT NULL,
  `actor_type` TEXT NULL,
  `actor_id` TEXT NULL,
  `result` LONGTEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guest_masters` (
  `id` VARCHAR(191) NOT NULL,
  `name_zh` TEXT NULL,
  `name_intl` TEXT NULL,
  `mobile` TEXT NULL,
  `email` TEXT NULL,
  `status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_guests` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `guest_master_id` TEXT NULL,
  `guest_type` TEXT NULL,
  `invitation_source` TEXT NULL,
  `status` TEXT NULL,
  `current_version_id` TEXT NULL,
  `sort_order` BIGINT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guest_profile_versions` (
  `id` VARCHAR(191) NOT NULL,
  `event_guest_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `profile_json` LONGTEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agendas` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `name` TEXT NULL,
  `timezone` TEXT NULL,
  `status` TEXT NULL,
  `current_version_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agenda_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `agenda_id` TEXT NULL,
  `parent_session_id` TEXT NULL,
  `title` TEXT NULL,
  `session_type` TEXT NULL,
  `introduction` LONGTEXT NULL,
  `start_at` TEXT NULL,
  `end_at` TEXT NULL,
  `location_text` TEXT NULL,
  `cover_asset_id` TEXT NULL,
  `registration_activity_id` TEXT NULL,
  `material_document_id` LONGTEXT NULL,
  `sort_order` BIGINT NULL,
  `status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `session_guests` (
  `id` VARCHAR(191) NOT NULL,
  `session_id` TEXT NULL,
  `event_guest_id` TEXT NULL,
  `role` TEXT NULL,
  `sort_order` BIGINT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agenda_versions` (
  `id` VARCHAR(191) NOT NULL,
  `agenda_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `snapshot_json` LONGTEXT NULL,
  `change_summary` TEXT NULL,
  `review_status` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agenda_changes` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `agenda_id` TEXT NULL,
  `before_version_id` TEXT NULL,
  `after_version_id` TEXT NULL,
  `change_json` LONGTEXT NULL,
  `notification_status` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promotion_channels` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `code` TEXT NULL,
  `name` TEXT NULL,
  `channel_type` TEXT NULL,
  `owner_name` TEXT NULL,
  `target_path` TEXT NULL,
  `status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitor_first_touches` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `browser_key` TEXT NULL,
  `channel_id` TEXT NULL,
  `landing_page` TEXT NULL,
  `first_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `channel_visit_history` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `browser_key` TEXT NULL,
  `channel_id` TEXT NULL,
  `landing_page` TEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `channel_bindings` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `record_type` TEXT NULL,
  `record_id` TEXT NULL,
  `channel_id` TEXT NULL,
  `bound_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversion_events` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `channel_id` TEXT NULL,
  `conversion_type` TEXT NULL,
  `object_id` TEXT NULL,
  `dedup_key` TEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recruitment_plans` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `name` TEXT NULL,
  `target_type` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `owner_name` TEXT NULL,
  `start_at` TEXT NULL,
  `end_at` TEXT NULL,
  `status` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recruitment_targets` (
  `id` VARCHAR(191) NOT NULL,
  `plan_id` TEXT NULL,
  `source` TEXT NULL,
  `target_ref` TEXT NULL,
  `display_name` TEXT NULL,
  `assignee_name` TEXT NULL,
  `stage` TEXT NULL,
  `snapshot_json` LONGTEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `message_templates` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `name` TEXT NULL,
  `channel` TEXT NULL,
  `language` TEXT NULL,
  `template_type` TEXT NULL,
  `status` TEXT NULL,
  `current_version_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `created_by` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `message_template_versions` (
  `id` VARCHAR(191) NOT NULL,
  `template_id` TEXT NULL,
  `version_no` BIGINT NULL,
  `subject` TEXT NULL,
  `content` LONGTEXT NULL,
  `variables_json` LONGTEXT NULL,
  `review_status` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `published_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `message_tasks` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `name` TEXT NULL,
  `task_type` TEXT NULL,
  `channel` TEXT NULL,
  `template_version_id` TEXT NULL,
  `recipient_source` TEXT NULL,
  `filter_snapshot_json` LONGTEXT NULL,
  `recipient_count` BIGINT NULL,
  `dedup_count` BIGINT NULL,
  `unsubscribe_count` BIGINT NULL,
  `invalid_count` BIGINT NULL,
  `status` TEXT NULL,
  `creator_name` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `reviewer_name` TEXT NULL,
  `schedule_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `message_recipient_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `task_id` TEXT NULL,
  `source` TEXT NULL,
  `source_ref` TEXT NULL,
  `display_name` TEXT NULL,
  `contact` TEXT NULL,
  `consent_status` TEXT NULL,
  `variables_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `message_deliveries` (
  `id` VARCHAR(191) NOT NULL,
  `task_id` TEXT NULL,
  `recipient_id` TEXT NULL,
  `provider` TEXT NULL,
  `provider_request_id` TEXT NULL,
  `status` TEXT NULL,
  `attempts` BIGINT NULL,
  `reason` LONGTEXT NULL,
  `occurred_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `unsubscribe_records` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `identity` TEXT NULL,
  `channel` TEXT NULL,
  `scope` TEXT NULL,
  `source` TEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `person_masters` (
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `id` VARCHAR(191) NOT NULL,
  `display_name` TEXT NULL,
  `status` TEXT NULL,
  `merged_into_person_id` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `public_accounts` (
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `id` VARCHAR(191) NOT NULL,
  `person_master_id` TEXT NULL,
  `display_name` TEXT NULL,
  `status` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `public_identities` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `identity_type` TEXT NULL,
  `normalized_value` TEXT NULL,
  `display_masked` TEXT NULL,
  `verified_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `public_otp_challenges` (
  `id` VARCHAR(191) NOT NULL,
  `identity_type` TEXT NULL,
  `normalized_value` TEXT NULL,
  `destination_masked` TEXT NULL,
  `code_hash` TEXT NULL,
  `expires_at` TEXT NULL,
  `attempt_count` BIGINT NULL,
  `consumed_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `public_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `token_hash` TEXT NULL,
  `remember_days` BIGINT NULL,
  `expires_at` TEXT NULL,
  `last_seen_at` TEXT NULL,
  `revoked_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprise_accounts` (
  `id` VARCHAR(191) NOT NULL,
  `enterprise_id` TEXT NULL,
  `display_name` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `status` TEXT NULL,
  `last_login_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprise_identities` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `identity_type` TEXT NULL,
  `normalized_value` TEXT NULL,
  `display_masked` TEXT NULL,
  `verified_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprise_otp_challenges` (
  `id` VARCHAR(191) NOT NULL,
  `identity_type` TEXT NULL,
  `normalized_value` TEXT NULL,
  `destination_masked` TEXT NULL,
  `code_hash` TEXT NULL,
  `expires_at` TEXT NULL,
  `attempt_count` BIGINT NULL,
  `consumed_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprise_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `token_hash` TEXT NULL,
  `remember_days` BIGINT NULL,
  `expires_at` TEXT NULL,
  `last_seen_at` TEXT NULL,
  `revoked_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprise_contact_history` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `old_identity_masked` TEXT NULL,
  `new_identity_masked` TEXT NULL,
  `old_display_name` TEXT NULL,
  `new_display_name` TEXT NULL,
  `identity_type` TEXT NULL,
  `reason` LONGTEXT NULL,
  `event_id` TEXT NULL,
  `operator_account_id` TEXT NULL,
  `operator_name` TEXT NULL,
  `verified_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enterprise_contact_handoff_challenges` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` TEXT NULL,
  `event_id` TEXT NULL,
  `identity_type` TEXT NULL,
  `normalized_value` TEXT NULL,
  `destination_masked` TEXT NULL,
  `code_hash` TEXT NULL,
  `expires_at` TEXT NULL,
  `attempt_count` BIGINT NULL,
  `requested_by_account_id` TEXT NULL,
  `requested_by_name` TEXT NULL,
  `consumed_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` VARCHAR(191) NOT NULL,
  `recipient_type` TEXT NULL,
  `recipient_account_id` TEXT NULL,
  `event_id` TEXT NULL,
  `category` TEXT NULL,
  `title` TEXT NULL,
  `body` LONGTEXT NULL,
  `related_type` TEXT NULL,
  `related_id` TEXT NULL,
  `href` TEXT NULL,
  `status` TEXT NULL,
  `read_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `actor_name` TEXT NULL,
  `module` TEXT NULL,
  `object_type` TEXT NULL,
  `object_id` TEXT NULL,
  `action` TEXT NULL,
  `result` LONGTEXT NULL,
  `request_id` TEXT NULL,
  `occurred_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recycle_bin_items` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `module` TEXT NULL,
  `object_type` TEXT NULL,
  `object_id` TEXT NULL,
  `object_label` TEXT NULL,
  `snapshot_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `deleted_by` TEXT NULL,
  `deleted_at` TEXT NULL,
  `restored_by` TEXT NULL,
  `restored_at` TEXT NULL,
  `restore_reason` LONGTEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `data_merge_records` (
  `id` VARCHAR(191) NOT NULL,
  `entity_type` TEXT NULL,
  `source_id` TEXT NULL,
  `target_id` TEXT NULL,
  `status` TEXT NULL,
  `field_strategy_json` LONGTEXT NULL,
  `preview_json` LONGTEXT NULL,
  `merged_by` TEXT NULL,
  `merged_at` TEXT NULL,
  `reverted_by` TEXT NULL,
  `reverted_at` TEXT NULL,
  `revert_reason` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sensitive_export_requests` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `scope` TEXT NULL,
  `dataset` TEXT NULL,
  `fields_json` LONGTEXT NULL,
  `filters_json` LONGTEXT NULL,
  `purpose` TEXT NULL,
  `status` TEXT NULL,
  `requested_by_account_id` TEXT NULL,
  `requested_by_name` TEXT NULL,
  `requested_at` TEXT NULL,
  `reviewed_by_account_id` TEXT NULL,
  `reviewed_by_name` TEXT NULL,
  `reviewed_at` TEXT NULL,
  `review_reason` LONGTEXT NULL,
  `file_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sensitive_export_files` (
  `id` VARCHAR(191) NOT NULL,
  `request_id` TEXT NULL,
  `file_name` TEXT NULL,
  `mime_type` TEXT NULL,
  `content` LONGTEXT NULL,
  `sha256` TEXT NULL,
  `row_count` BIGINT NULL,
  `generated_at` TEXT NULL,
  `expires_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sensitive_export_download_logs` (
  `id` VARCHAR(191) NOT NULL,
  `request_id` TEXT NULL,
  `file_id` TEXT NULL,
  `downloaded_by_account_id` TEXT NULL,
  `downloaded_by_name` TEXT NULL,
  `result` LONGTEXT NULL,
  `request_idempotency_key` TEXT NULL,
  `downloaded_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `data_import_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `import_type` TEXT NULL,
  `source_file_name` TEXT NULL,
  `source_sha256` TEXT NULL,
  `status` TEXT NULL,
  `row_count` BIGINT NULL,
  `valid_count` BIGINT NULL,
  `error_count` BIGINT NULL,
  `rows_json` LONGTEXT NULL,
  `errors_json` LONGTEXT NULL,
  `requested_by_account_id` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `requested_by_name` TEXT NULL,
  `validated_at` TEXT NULL,
  `committed_at` TEXT NULL,
  `committed_by_name` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `metric_definitions` (
  `code` VARCHAR(191) NOT NULL,
  `name` TEXT NULL,
  `description` LONGTEXT NULL,
  `unit` TEXT NULL,
  `scope` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `calculation_mode` TEXT NULL,
  `version` TEXT NULL,
  `owner_name` TEXT NULL,
  `status` TEXT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `metric_snapshot_runs` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` TEXT NULL,
  `year` BIGINT NULL,
  `scope` TEXT NULL,
  `scope_key` TEXT NULL,
  `status` TEXT NULL,
  `snapshot_count` BIGINT NULL,
  `error_message` TEXT NULL,
  `requested_by_name` TEXT NULL,
  `started_at` TEXT NULL,
  `completed_at` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `metric_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `run_id` TEXT NULL,
  `metric_code` TEXT NULL,
  `event_id` TEXT NULL,
  `year` BIGINT NULL,
  `scope_key` TEXT NULL,
  `value_number` TEXT NULL,
  `numerator` BIGINT NULL,
  `denominator` BIGINT NULL,
  `definition_version` TEXT NULL,
  `period_start` TEXT NULL,
  `period_end` TEXT NULL,
  `calculated_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_definitions` (
  `id` VARCHAR(191) NOT NULL,
  `code` TEXT NULL,
  `name` TEXT NULL,
  `description` LONGTEXT NULL,
  `scope` TEXT NULL,
  `created_at` TEXT NULL,
  `updated_at` TEXT NULL,
  `format` TEXT NULL,
  `columns_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `owner_name` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_runs` (
  `id` VARCHAR(191) NOT NULL,
  `definition_id` TEXT NULL,
  `event_id` TEXT NULL,
  `year` BIGINT NULL,
  `filters_json` LONGTEXT NULL,
  `status` TEXT NULL,
  `row_count` BIGINT NULL,
  `result_content` LONGTEXT NULL,
  `file_name` TEXT NULL,
  `sha256` TEXT NULL,
  `requested_by_name` TEXT NULL,
  `started_at` TEXT NULL,
  `completed_at` TEXT NULL,
  `error_message` TEXT NULL,
  `created_at` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `api_mutation_log` (
  `id` VARCHAR(191) NOT NULL,
  `method` VARCHAR(16) NOT NULL,
  `path` VARCHAR(1024) NOT NULL,
  `actor_name` VARCHAR(255) NULL,
  `request_json` LONGTEXT NULL,
  `response_json` LONGTEXT NULL,
  `occurred_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;