import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  year: integer('year').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  timezone: text('timezone').notNull(),
  startAt: text('start_at').notNull(),
  endAt: text('end_at').notNull(),
  status: text('status').notNull(),
  ownerName: text('owner_name').notNull(),
  ownerAccountId: text('owner_account_id'),
  eventType: text('event_type').notNull().default('EXHIBITION'),
  venueText: text('venue_text').notNull().default(''),
  languagesJson: text('languages_json').notNull().default('["zh-CN"]'),
  version: integer('version').notNull().default(1),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_events_code').on(table.code),
  uniqueIndex('uidx_events_slug').on(table.slug),
  index('idx_events_year_status').on(table.year, table.status),
]);

export const employeeAccounts = sqliteTable('employee_accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email').notNull(),
  groupRole: text('group_role').notNull().default('STAFF'),
  status: text('status').notNull(),
  lastLoginAt: text('last_login_at'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_employee_mobile').on(table.mobile), uniqueIndex('uidx_employee_email').on(table.email)]);

export const otpChallenges = sqliteTable('otp_challenges', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => employeeAccounts.id),
  channel: text('channel').notNull(),
  destinationMasked: text('destination_masked').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: text('consumed_at'),
  createdAt: text('created_at').notNull(),
});

export const loginSessions = sqliteTable('login_sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => employeeAccounts.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  revokedAt: text('revoked_at'),
  device: text('device').notNull(),
  createdAt: text('created_at').notNull(),
  lastSeenAt: text('last_seen_at').notNull(),
}, (table) => [uniqueIndex('uidx_login_session_token').on(table.tokenHash), index('idx_login_session_account').on(table.accountId, table.expiresAt)]);

export const eventMembers = sqliteTable('event_members', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  accountId: text('account_id').notNull().references(() => employeeAccounts.id),
  roleCode: text('role_code').notNull(),
  permissionsJson: text('permissions_json').notNull().default('[]'),
  isReviewer: integer('is_reviewer', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull(),
  joinedAt: text('joined_at').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_event_member_account').on(table.eventId, table.accountId)]);

export const eventFeatures = sqliteTable('event_features', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  featureCode: text('feature_code').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  configJson: text('config_json').notNull().default('{}'),
  updatedBy: text('updated_by').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_event_feature_code').on(table.eventId, table.featureCode)]);

export const eventOwnerHistory = sqliteTable('event_owner_history', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  oldOwnerAccountId: text('old_owner_account_id'),
  newOwnerAccountId: text('new_owner_account_id').notNull(),
  oldOwnerName: text('old_owner_name').notNull(),
  newOwnerName: text('new_owner_name').notNull(),
  reason: text('reason').notNull(),
  operatorName: text('operator_name').notNull(),
  effectiveAt: text('effective_at').notNull(),
});

export const eventCopyJobs = sqliteTable('event_copy_jobs', {
  id: text('id').primaryKey(),
  sourceEventId: text('source_event_id').notNull().references(() => events.id),
  targetEventId: text('target_event_id').references(() => events.id),
  selectionJson: text('selection_json').notNull(),
  status: text('status').notNull(),
  reportJson: text('report_json').notNull(),
  createdBy: text('created_by').notNull(),
  ...timestamps,
}, (table) => [index('idx_event_copy_jobs_source').on(table.sourceEventId, table.createdAt)]);

export const portalPages = sqliteTable('portal_pages', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  pageType: text('page_type').notNull(),
  status: text('status').notNull(),
  currentVersionId: text('current_version_id'),
  version: integer('version').notNull().default(1),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_portal_pages_event_slug').on(table.eventId, table.slug),
  index('idx_portal_pages_event_status').on(table.eventId, table.status),
]);

export const portalPageVersions = sqliteTable('portal_page_versions', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  pageId: text('page_id').notNull().references(() => portalPages.id),
  versionNo: integer('version_no').notNull(),
  language: text('language').notNull(),
  layoutJson: text('layout_json').notNull(),
  changeSummary: text('change_summary').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by'),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_portal_page_versions_no').on(table.pageId, table.versionNo, table.language),
]);

export const portalTranslationJobs = sqliteTable('portal_translation_jobs', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  pageId: text('page_id').notNull().references(() => portalPages.id),
  sourceVersionId: text('source_version_id').notNull().references(() => portalPageVersions.id),
  targetLanguage: text('target_language').notNull(),
  resultVersionId: text('result_version_id').references(() => portalPageVersions.id),
  sourceSha256: text('source_sha256').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(),
  status: text('status').notNull(),
  requestedBy: text('requested_by').notNull(),
  confirmedBy: text('confirmed_by'),
  requestedAt: text('requested_at').notNull(),
  confirmedAt: text('confirmed_at'),
  errorMessage: text('error_message'),
  ...timestamps,
}, (table) => [
  index('idx_portal_translation_jobs_page_language').on(table.pageId, table.targetLanguage, table.createdAt),
]);

export const portalLanguagePublications = sqliteTable('portal_language_publications', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  pageId: text('page_id').notNull().references(() => portalPages.id),
  language: text('language').notNull(),
  currentVersionId: text('current_version_id').references(() => portalPageVersions.id),
  status: text('status').notNull(),
  sourceVersionId: text('source_version_id').references(() => portalPageVersions.id),
  publishedBy: text('published_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_portal_language_publications').on(table.pageId, table.language),
]);

export const reviewTasks = sqliteTable('review_tasks', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  module: text('module').notNull(),
  objectType: text('object_type').notNull(),
  objectId: text('object_id').notNull(),
  versionId: text('version_id'),
  title: text('title').notNull(),
  submitterName: text('submitter_name').notNull(),
  reviewerName: text('reviewer_name'),
  status: text('status').notNull(),
  reason: text('reason'),
  submittedAt: text('submitted_at').notNull(),
  decidedAt: text('decided_at'),
  ...timestamps,
}, (table) => [index('idx_review_tasks_event_status').on(table.eventId, table.status)]);

export const registrationActivities = sqliteTable('registration_activities', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  timezone: text('timezone').notNull().default('Asia/Shanghai'),
  startAt: text('start_at'),
  endAt: text('end_at'),
  registrationStartAt: text('registration_start_at'),
  registrationEndAt: text('registration_end_at'),
  quota: integer('quota').notNull().default(999999),
  locationName: text('location_name').notNull().default(''),
  reviewMode: text('review_mode').notNull(),
  allowEdit: integer('allow_edit', { mode: 'boolean' }).notNull().default(true),
  profileRecheckEnabled: integer('profile_recheck_enabled', { mode: 'boolean' }).notNull().default(true),
  keyProfileFieldsJson: text('key_profile_fields_json').notNull().default('["name","mobile","email","organization","jobTitle","country"]'),
  showInPortal: integer('show_in_portal', { mode: 'boolean' }).notNull().default(true),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  formSchemaJson: text('form_schema_json').notNull().default('{"fields":[]}'),
  formVersion: integer('form_version').notNull(),
  successMessage: text('success_message').notNull().default('报名已提交'),
  notificationJson: text('notification_json').notNull().default('{}'),
  status: text('status').notNull(),
  ...timestamps,
}, (table) => [index('idx_registration_activities_event').on(table.eventId)]);

export const registrationFormVersions = sqliteTable('registration_form_versions', {
  id: text('id').primaryKey(),
  activityId: text('activity_id').notNull().references(() => registrationActivities.id),
  versionNo: integer('version_no').notNull(),
  schemaJson: text('schema_json').notNull(),
  changeSummary: text('change_summary').notNull(),
  createdBy: text('created_by').notNull(),
  status: text('status').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_registration_form_versions_no').on(table.activityId, table.versionNo)]);

export const registrationRecords = sqliteTable('registration_records', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  activityId: text('activity_id').notNull().references(() => registrationActivities.id),
  accountId: text('account_id').notNull(),
  personName: text('person_name').notNull(),
  mobileMasked: text('mobile_masked').notNull(),
  emailMasked: text('email_masked').notNull().default(''),
  country: text('country').notNull(),
  organization: text('organization').notNull(),
  jobTitle: text('job_title').notNull().default(''),
  formVersion: integer('form_version').notNull().default(1),
  answersJson: text('answers_json').notNull().default('{}'),
  status: text('status').notNull(),
  reviewReason: text('review_reason'),
  firstChannel: text('first_channel').notNull(),
  submittedAt: text('submitted_at').notNull(),
  checkedInAt: text('checked_in_at'),
  checkinScope: text('checkin_scope'),
  checkinMethod: text('checkin_method'),
  version: integer('version').notNull().default(1),
  ...timestamps,
}, (table) => [
  index('idx_registration_records_event_status').on(table.eventId, table.status),
  index('idx_registration_records_activity').on(table.activityId),
]);

export const checkinLogs = sqliteTable('checkin_logs', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  activityId: text('activity_id').references(() => registrationActivities.id),
  recordId: text('record_id').notNull().references(() => registrationRecords.id),
  scope: text('scope').notNull(),
  method: text('method').notNull(),
  operatorName: text('operator_name').notNull(),
  result: text('result').notNull(),
  requestKey: text('request_key'),
  occurredAt: text('occurred_at').notNull(),
}, (table) => [index('idx_checkin_logs_event_time').on(table.eventId, table.occurredAt), uniqueIndex('uidx_checkin_request_key').on(table.requestKey)]);

export const registrationAccessCodes = sqliteTable('registration_access_codes', {
  id: text('id').primaryKey(), recordId: text('record_id').notNull().references(() => registrationRecords.id), code: text('code').notNull(), status: text('status').notNull(), issuedAt: text('issued_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('uidx_registration_access_record').on(table.recordId), uniqueIndex('uidx_registration_access_code').on(table.code)]);

export const checkinReversals = sqliteTable('checkin_reversals', {
  id: text('id').primaryKey(), checkinLogId: text('checkin_log_id').notNull().references(() => checkinLogs.id), reason: text('reason').notNull(), operatorName: text('operator_name').notNull(), occurredAt: text('occurred_at').notNull(),
}, (table) => [uniqueIndex('uidx_checkin_reversal_log').on(table.checkinLogId)]);

export const enterprises = sqliteTable('enterprises', {
  id: text('id').primaryKey(),
  accountId: text('account_id'),
  nameZh: text('name_zh').notNull(),
  nameIntl: text('name_intl').notNull(),
  country: text('country').notNull(),
  industry: text('industry').notNull().default(''),
  registrationNo: text('registration_no'),
  accountContact: text('account_contact').notNull(),
  contactName: text('contact_name').notNull().default(''),
  contactEmailMasked: text('contact_email_masked').notNull().default(''),
  website: text('website').notNull().default(''),
  address: text('address').notNull().default(''),
  status: text('status').notNull(),
  mergedIntoEnterpriseId: text('merged_into_enterprise_id'),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_enterprises_country_registration').on(table.country, table.registrationNo),
  uniqueIndex('uidx_enterprises_account').on(table.accountId),
]);

export const eventExhibitors = sqliteTable('event_exhibitors', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  enterpriseId: text('enterprise_id').notNull().references(() => enterprises.id),
  qualificationStatus: text('qualification_status').notNull(),
  publishStatus: text('publish_status').notNull(),
  category: text('category').notNull().default(''),
  description: text('description').notNull().default(''),
  currentVersionId: text('current_version_id'),
  productCount: integer('product_count').notNull().default(0),
  boothNo: text('booth_no'),
  source: text('source').notNull(),
  version: integer('version').notNull().default(1),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_event_exhibitors_event_enterprise').on(table.eventId, table.enterpriseId),
  index('idx_event_exhibitors_event_status').on(table.eventId, table.qualificationStatus, table.publishStatus),
]);

export const exhibitorProfileVersions = sqliteTable('exhibitor_profile_versions', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  eventExhibitorId: text('event_exhibitor_id').notNull().references(() => eventExhibitors.id),
  versionNo: integer('version_no').notNull(),
  profileJson: text('profile_json').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by'),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_exhibitor_profile_version').on(table.eventExhibitorId, table.versionNo)]);

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  eventExhibitorId: text('event_exhibitor_id').notNull().references(() => eventExhibitors.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  publishStatus: text('publish_status').notNull(),
  currentVersionId: text('current_version_id'),
  ...timestamps,
}, (table) => [index('idx_products_event_status').on(table.eventId, table.publishStatus)]);

export const productVersions = sqliteTable('product_versions', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  versionNo: integer('version_no').notNull(),
  contentJson: text('content_json').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by'),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_product_versions_no').on(table.productId, table.versionNo)]);

export const inquiries = sqliteTable('inquiries', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  eventExhibitorId: text('event_exhibitor_id').notNull().references(() => eventExhibitors.id),
  productId: text('product_id').references(() => products.id),
  customerName: text('customer_name').notNull(),
  contactMasked: text('contact_masked').notNull(),
  contactPrivate: text('contact_private').notNull().default(''),
  content: text('content').notNull(),
  status: text('status').notNull(),
  handledBy: text('handled_by'),
  handledAt: text('handled_at'),
  ...timestamps,
}, (table) => [index('idx_inquiries_event_status').on(table.eventId, table.status)]);

export const demandSupplyPosts = sqliteTable('demand_supply_posts', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  publisherType: text('publisher_type').notNull(),
  publisherName: text('publisher_name').notNull(),
  publisherEnterpriseId: text('publisher_enterprise_id').references(() => enterprises.id),
  publisherPublicAccountId: text('publisher_public_account_id'),
  postType: text('post_type').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  countriesJson: text('countries_json').notNull().default('[]'),
  description: text('description').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by').notNull(),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [index('idx_demand_supply_event_status').on(table.eventId, table.reviewStatus)]);

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id'),
  inviterName: text('inviter_name').notNull(),
  inviteeName: text('invitee_name').notNull(),
  inviterEnterpriseId: text('inviter_enterprise_id').references(() => enterprises.id),
  inviteeEnterpriseId: text('invitee_enterprise_id').references(() => enterprises.id),
  inviterPublicAccountId: text('inviter_public_account_id'),
  inviteePublicAccountId: text('invitee_public_account_id'),
  proposedStart: text('proposed_start').notNull(),
  proposedEnd: text('proposed_end').notNull(),
  locationPreference: text('location_preference').notNull(),
  confirmedStart: text('confirmed_start'),
  confirmedEnd: text('confirmed_end'),
  confirmedLocation: text('confirmed_location'),
  status: text('status').notNull(),
  createdBy: text('created_by').notNull(),
  ...timestamps,
}, (table) => [index('idx_appointments_event_status').on(table.eventId, table.status), index('idx_appointments_enterprise').on(table.inviterEnterpriseId, table.inviteeEnterpriseId)]);

export const appointmentResponses = sqliteTable('appointment_responses', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  responderName: text('responder_name').notNull(),
  action: text('action').notNull(),
  proposedStart: text('proposed_start'),
  proposedEnd: text('proposed_end'),
  locationText: text('location_text'),
  note: text('note').notNull().default(''),
  createdAt: text('created_at').notNull(),
});

export const registrationProfileVersions = sqliteTable('registration_profile_versions', {
  id: text('id').primaryKey(),
  recordId: text('record_id').notNull().references(() => registrationRecords.id),
  versionNo: integer('version_no').notNull(),
  valuesJson: text('values_json').notNull(),
  changedFieldsJson: text('changed_fields_json').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by').notNull(),
  approvedBy: text('approved_by'),
  reviewReason: text('review_reason'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [
  uniqueIndex('uidx_registration_profile_version_no').on(table.recordId, table.versionNo),
  index('idx_registration_profile_review_status').on(table.reviewStatus),
]);

export const scheduleBatches = sqliteTable('schedule_batches', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  name: text('name').notNull(),
  status: text('status').notNull(),
  submitterName: text('submitter_name').notNull(),
  reviewerName: text('reviewer_name'),
  conflictReportJson: text('conflict_report_json').notNull().default('[]'),
  submittedAt: text('submitted_at'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [index('idx_schedule_batches_event_status').on(table.eventId, table.status)]);

export const meetingSchedules = sqliteTable('meeting_schedules', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  batchId: text('batch_id').notNull().references(() => scheduleBatches.id),
  appointmentId: text('appointment_id').references(() => appointments.id),
  participantA: text('participant_a').notNull(),
  participantB: text('participant_b').notNull(),
  startAt: text('start_at').notNull(),
  endAt: text('end_at').notNull(),
  locationText: text('location_text').notNull(),
  publishStatus: text('publish_status').notNull(),
  ...timestamps,
}, (table) => [index('idx_meeting_schedules_event_time').on(table.eventId, table.startAt, table.endAt)]);

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  scope: text('scope').notNull(),
  eventId: text('event_id').references(() => events.id),
  assetType: text('asset_type').notNull(),
  originalName: text('original_name').notNull(),
  fileKey: text('file_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  checksum: text('checksum').notNull(),
  status: text('status').notNull(),
  scanResult: text('scan_result').notNull(),
  createdBy: text('created_by').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_assets_file_key').on(table.fileKey), index('idx_assets_event_status').on(table.eventId, table.status)]);

export const assetReferences = sqliteTable('asset_references', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => assets.id),
  eventId: text('event_id').references(() => events.id),
  module: text('module').notNull(),
  objectId: text('object_id').notNull(),
  versionId: text('version_id'),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_asset_references_asset').on(table.assetId)]);

export const contentItems = sqliteTable('content_items', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  contentType: text('content_type').notNull(),
  slug: text('slug').notNull(),
  status: text('status').notNull(),
  currentVersionId: text('current_version_id'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_content_event_slug').on(table.eventId, table.slug), index('idx_content_event_status').on(table.eventId, table.status)]);

export const contentVersions = sqliteTable('content_versions', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => contentItems.id),
  versionNo: integer('version_no').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  body: text('body').notNull(),
  coverAssetId: text('cover_asset_id').references(() => assets.id),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by').notNull(),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_content_version_no').on(table.itemId, table.versionNo)]);

export const documentItems = sqliteTable('document_items', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  title: text('title').notNull(),
  fileAssetId: text('file_asset_id').notNull().references(() => assets.id),
  accessMode: text('access_mode').notNull(),
  registrationActivityId: text('registration_activity_id').references(() => registrationActivities.id),
  status: text('status').notNull(),
  createdBy: text('created_by').notNull(),
  submittedBy: text('submitted_by').notNull(),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [index('idx_documents_event_status').on(table.eventId, table.status)]);

export const documentDownloadLogs = sqliteTable('document_download_logs', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  documentId: text('document_id').notNull().references(() => documentItems.id),
  actorType: text('actor_type').notNull(),
  actorId: text('actor_id'),
  result: text('result').notNull(),
  occurredAt: text('occurred_at').notNull(),
});

export const guestMasters = sqliteTable('guest_masters', {
  id: text('id').primaryKey(),
  nameZh: text('name_zh').notNull(),
  nameIntl: text('name_intl').notNull().default(''),
  mobile: text('mobile'),
  email: text('email'),
  status: text('status').notNull().default('ACTIVE'),
  ...timestamps,
}, (table) => [index('idx_guest_masters_name').on(table.nameZh)]);

export const eventGuests = sqliteTable('event_guests', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  guestMasterId: text('guest_master_id').notNull().references(() => guestMasters.id),
  guestType: text('guest_type').notNull(),
  invitationSource: text('invitation_source').notNull(),
  status: text('status').notNull(),
  currentVersionId: text('current_version_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_event_guest_master').on(table.eventId, table.guestMasterId), index('idx_event_guests_event_status').on(table.eventId, table.status)]);

export const guestProfileVersions = sqliteTable('guest_profile_versions', {
  id: text('id').primaryKey(),
  eventGuestId: text('event_guest_id').notNull().references(() => eventGuests.id),
  versionNo: integer('version_no').notNull(),
  profileJson: text('profile_json').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by').notNull(),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_guest_profile_version').on(table.eventGuestId, table.versionNo)]);

export const agendas = sqliteTable('agendas', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  name: text('name').notNull(),
  timezone: text('timezone').notNull(),
  status: text('status').notNull(),
  currentVersionId: text('current_version_id'),
  ...timestamps,
}, (table) => [index('idx_agendas_event').on(table.eventId)]);

export const agendaSessions = sqliteTable('agenda_sessions', {
  id: text('id').primaryKey(),
  agendaId: text('agenda_id').notNull().references(() => agendas.id),
  parentSessionId: text('parent_session_id'),
  title: text('title').notNull(),
  sessionType: text('session_type').notNull(),
  introduction: text('introduction').notNull().default(''),
  startAt: text('start_at').notNull(),
  endAt: text('end_at').notNull(),
  locationText: text('location_text').notNull().default(''),
  coverAssetId: text('cover_asset_id').references(() => assets.id),
  registrationActivityId: text('registration_activity_id').references(() => registrationActivities.id),
  materialDocumentId: text('material_document_id').references(() => documentItems.id),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status').notNull(),
  ...timestamps,
}, (table) => [index('idx_agenda_sessions_agenda_time').on(table.agendaId, table.startAt)]);

export const sessionGuests = sqliteTable('session_guests', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => agendaSessions.id),
  eventGuestId: text('event_guest_id').notNull().references(() => eventGuests.id),
  role: text('role').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('uidx_session_guest').on(table.sessionId, table.eventGuestId)]);

export const agendaVersions = sqliteTable('agenda_versions', {
  id: text('id').primaryKey(),
  agendaId: text('agenda_id').notNull().references(() => agendas.id),
  versionNo: integer('version_no').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  changeSummary: text('change_summary').notNull(),
  reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by').notNull(),
  approvedBy: text('approved_by'),
  publishedAt: text('published_at'),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_agenda_version').on(table.agendaId, table.versionNo)]);

export const agendaChanges = sqliteTable('agenda_changes', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  agendaId: text('agenda_id').notNull().references(() => agendas.id),
  beforeVersionId: text('before_version_id'),
  afterVersionId: text('after_version_id').notNull(),
  changeJson: text('change_json').notNull(),
  notificationStatus: text('notification_status').notNull(),
  createdAt: text('created_at').notNull(),
});

export const promotionChannels = sqliteTable('promotion_channels', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  channelType: text('channel_type').notNull(),
  ownerName: text('owner_name').notNull(),
  targetPath: text('target_path').notNull(),
  status: text('status').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('uidx_channel_event_code').on(table.eventId, table.code), index('idx_channel_event_status').on(table.eventId, table.status)]);

export const visitorFirstTouches = sqliteTable('visitor_first_touches', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  browserKey: text('browser_key').notNull(),
  channelId: text('channel_id').notNull().references(() => promotionChannels.id),
  landingPage: text('landing_page').notNull(),
  firstAt: text('first_at').notNull(),
}, (table) => [uniqueIndex('uidx_first_touch_event_browser').on(table.eventId, table.browserKey)]);

export const channelVisitHistory = sqliteTable('channel_visit_history', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  browserKey: text('browser_key').notNull(),
  channelId: text('channel_id').notNull().references(() => promotionChannels.id),
  landingPage: text('landing_page').notNull(),
  occurredAt: text('occurred_at').notNull(),
}, (table) => [index('idx_channel_visits_event_time').on(table.eventId, table.occurredAt)]);

export const channelBindings = sqliteTable('channel_bindings', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), recordType: text('record_type').notNull(),
  recordId: text('record_id').notNull(), channelId: text('channel_id').notNull().references(() => promotionChannels.id), boundAt: text('bound_at').notNull(),
}, (table) => [uniqueIndex('uidx_channel_binding_record').on(table.recordType, table.recordId)]);

export const conversionEvents = sqliteTable('conversion_events', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), channelId: text('channel_id').notNull().references(() => promotionChannels.id),
  conversionType: text('conversion_type').notNull(), objectId: text('object_id').notNull(), dedupKey: text('dedup_key').notNull(), occurredAt: text('occurred_at').notNull(),
}, (table) => [uniqueIndex('uidx_conversion_dedup').on(table.dedupKey), index('idx_conversion_channel_type').on(table.channelId, table.conversionType)]);

export const recruitmentPlans = sqliteTable('recruitment_plans', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), name: text('name').notNull(), targetType: text('target_type').notNull(),
  ownerName: text('owner_name').notNull(), startAt: text('start_at'), endAt: text('end_at'), status: text('status').notNull(), ...timestamps,
}, (table) => [index('idx_recruitment_plans_event').on(table.eventId)]);

export const recruitmentTargets = sqliteTable('recruitment_targets', {
  id: text('id').primaryKey(), planId: text('plan_id').notNull().references(() => recruitmentPlans.id), source: text('source').notNull(),
  targetRef: text('target_ref'), displayName: text('display_name').notNull(), assigneeName: text('assignee_name').notNull(), stage: text('stage').notNull(),
  snapshotJson: text('snapshot_json').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [index('idx_recruitment_targets_plan_stage').on(table.planId, table.stage)]);

export const messageTemplates = sqliteTable('message_templates', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), name: text('name').notNull(), channel: text('channel').notNull(),
  language: text('language').notNull(), templateType: text('template_type').notNull(), status: text('status').notNull(), currentVersionId: text('current_version_id'),
  createdBy: text('created_by').notNull(), ...timestamps,
}, (table) => [index('idx_message_templates_event_status').on(table.eventId, table.status)]);

export const messageTemplateVersions = sqliteTable('message_template_versions', {
  id: text('id').primaryKey(), templateId: text('template_id').notNull().references(() => messageTemplates.id), versionNo: integer('version_no').notNull(),
  subject: text('subject').notNull(), content: text('content').notNull(), variablesJson: text('variables_json').notNull(), reviewStatus: text('review_status').notNull(),
  submittedBy: text('submitted_by').notNull(), approvedBy: text('approved_by'), publishedAt: text('published_at'), ...timestamps,
}, (table) => [uniqueIndex('uidx_message_template_version').on(table.templateId, table.versionNo)]);

export const messageTasks = sqliteTable('message_tasks', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), name: text('name').notNull(), taskType: text('task_type').notNull(),
  channel: text('channel').notNull(), templateVersionId: text('template_version_id').notNull().references(() => messageTemplateVersions.id), recipientSource: text('recipient_source').notNull(),
  filterSnapshotJson: text('filter_snapshot_json').notNull(), recipientCount: integer('recipient_count').notNull(), dedupCount: integer('dedup_count').notNull(),
  unsubscribeCount: integer('unsubscribe_count').notNull(), invalidCount: integer('invalid_count').notNull(), status: text('status').notNull(), creatorName: text('creator_name').notNull(),
  reviewerName: text('reviewer_name'), scheduleAt: text('schedule_at'), ...timestamps,
}, (table) => [index('idx_message_tasks_event_status').on(table.eventId, table.status)]);

export const messageRecipientSnapshots = sqliteTable('message_recipient_snapshots', {
  id: text('id').primaryKey(), taskId: text('task_id').notNull().references(() => messageTasks.id), source: text('source').notNull(), sourceRef: text('source_ref'),
  displayName: text('display_name').notNull(), contact: text('contact').notNull(), consentStatus: text('consent_status').notNull(), variablesJson: text('variables_json').notNull(),
  status: text('status').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_message_recipients_task_status').on(table.taskId, table.status)]);

export const messageDeliveries = sqliteTable('message_deliveries', {
  id: text('id').primaryKey(), taskId: text('task_id').notNull().references(() => messageTasks.id), recipientId: text('recipient_id').notNull().references(() => messageRecipientSnapshots.id),
  provider: text('provider').notNull(), providerRequestId: text('provider_request_id').notNull(), status: text('status').notNull(), attempts: integer('attempts').notNull(),
  reason: text('reason'), occurredAt: text('occurred_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('uidx_message_delivery_task_recipient').on(table.taskId, table.recipientId)]);

export const unsubscribeRecords = sqliteTable('unsubscribe_records', {
  id: text('id').primaryKey(), eventId: text('event_id').references(() => events.id), identity: text('identity').notNull(), channel: text('channel').notNull(),
  scope: text('scope').notNull(), source: text('source').notNull(), occurredAt: text('occurred_at').notNull(),
}, (table) => [uniqueIndex('uidx_unsubscribe_identity_scope').on(table.identity, table.channel, table.scope)]);

export const personMasters = sqliteTable('person_masters', {
  id: text('id').primaryKey(), displayName: text('display_name').notNull(), status: text('status').notNull(), mergedIntoPersonId: text('merged_into_person_id'), ...timestamps,
}, (table) => [index('idx_person_master_merged').on(table.mergedIntoPersonId)]);

export const publicAccounts = sqliteTable('public_accounts', {
  id: text('id').primaryKey(), personMasterId: text('person_master_id').references(() => personMasters.id), displayName: text('display_name').notNull(), status: text('status').notNull(), ...timestamps,
});

export const publicIdentities = sqliteTable('public_identities', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull().references(() => publicAccounts.id), identityType: text('identity_type').notNull(),
  normalizedValue: text('normalized_value').notNull(), displayMasked: text('display_masked').notNull(), verifiedAt: text('verified_at').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('uidx_public_identity_type_value').on(table.identityType, table.normalizedValue), index('idx_public_identity_account').on(table.accountId)]);

export const publicOtpChallenges = sqliteTable('public_otp_challenges', {
  id: text('id').primaryKey(), identityType: text('identity_type').notNull(), normalizedValue: text('normalized_value').notNull(), destinationMasked: text('destination_masked').notNull(),
  codeHash: text('code_hash').notNull(), expiresAt: text('expires_at').notNull(), attemptCount: integer('attempt_count').notNull().default(0), consumedAt: text('consumed_at'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_public_otp_identity_time').on(table.identityType, table.normalizedValue, table.createdAt)]);

export const publicSessions = sqliteTable('public_sessions', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull().references(() => publicAccounts.id), tokenHash: text('token_hash').notNull(), rememberDays: integer('remember_days').notNull(),
  expiresAt: text('expires_at').notNull(), lastSeenAt: text('last_seen_at').notNull(), revokedAt: text('revoked_at'), createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('uidx_public_session_token').on(table.tokenHash), index('idx_public_session_account').on(table.accountId, table.expiresAt)]);

export const enterpriseAccounts = sqliteTable('enterprise_accounts', {
  id: text('id').primaryKey(), enterpriseId: text('enterprise_id').notNull().references(() => enterprises.id), displayName: text('display_name').notNull(),
  status: text('status').notNull(), lastLoginAt: text('last_login_at'), ...timestamps,
}, (table) => [uniqueIndex('uidx_enterprise_account_enterprise').on(table.enterpriseId)]);

export const enterpriseIdentities = sqliteTable('enterprise_identities', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull().references(() => enterpriseAccounts.id), identityType: text('identity_type').notNull(),
  normalizedValue: text('normalized_value').notNull(), displayMasked: text('display_masked').notNull(), verifiedAt: text('verified_at').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('uidx_enterprise_identity_type_value').on(table.identityType, table.normalizedValue), index('idx_enterprise_identity_account').on(table.accountId)]);

export const enterpriseOtpChallenges = sqliteTable('enterprise_otp_challenges', {
  id: text('id').primaryKey(), identityType: text('identity_type').notNull(), normalizedValue: text('normalized_value').notNull(), destinationMasked: text('destination_masked').notNull(),
  codeHash: text('code_hash').notNull(), expiresAt: text('expires_at').notNull(), attemptCount: integer('attempt_count').notNull().default(0), consumedAt: text('consumed_at'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_enterprise_otp_identity_time').on(table.identityType, table.normalizedValue, table.createdAt)]);

export const enterpriseSessions = sqliteTable('enterprise_sessions', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull().references(() => enterpriseAccounts.id), tokenHash: text('token_hash').notNull(), rememberDays: integer('remember_days').notNull(),
  expiresAt: text('expires_at').notNull(), lastSeenAt: text('last_seen_at').notNull(), revokedAt: text('revoked_at'), createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('uidx_enterprise_session_token').on(table.tokenHash), index('idx_enterprise_session_account').on(table.accountId, table.expiresAt)]);

export const enterpriseContactHistory = sqliteTable('enterprise_contact_history', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull().references(() => enterpriseAccounts.id), oldIdentityMasked: text('old_identity_masked'),
  newIdentityMasked: text('new_identity_masked').notNull(), oldDisplayName: text('old_display_name'), newDisplayName: text('new_display_name'), identityType: text('identity_type'),
  reason: text('reason'), eventId: text('event_id').references(() => events.id), operatorAccountId: text('operator_account_id').references(() => employeeAccounts.id),
  operatorName: text('operator_name').notNull(), verifiedAt: text('verified_at').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_enterprise_contact_history_account').on(table.accountId, table.createdAt)]);

export const enterpriseContactHandoffChallenges = sqliteTable('enterprise_contact_handoff_challenges', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull().references(() => enterpriseAccounts.id), eventId: text('event_id').notNull().references(() => events.id),
  identityType: text('identity_type').notNull(), normalizedValue: text('normalized_value').notNull(), destinationMasked: text('destination_masked').notNull(), codeHash: text('code_hash').notNull(),
  expiresAt: text('expires_at').notNull(), attemptCount: integer('attempt_count').notNull().default(0), requestedByAccountId: text('requested_by_account_id').notNull().references(() => employeeAccounts.id),
  requestedByName: text('requested_by_name').notNull(), consumedAt: text('consumed_at'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_enterprise_handoff_account_time').on(table.accountId, table.createdAt), index('idx_enterprise_handoff_identity').on(table.identityType, table.normalizedValue)]);

export const userNotifications = sqliteTable('user_notifications', {
  id: text('id').primaryKey(), recipientType: text('recipient_type').notNull(), recipientAccountId: text('recipient_account_id').notNull(), eventId: text('event_id').references(() => events.id),
  category: text('category').notNull(), title: text('title').notNull(), body: text('body').notNull(), relatedType: text('related_type'), relatedId: text('related_id'), href: text('href'),
  status: text('status').notNull(), readAt: text('read_at'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_user_notification_recipient_status_time').on(table.recipientType, table.recipientAccountId, table.status, table.createdAt), index('idx_user_notification_event_time').on(table.eventId, table.createdAt)]);

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  eventId: text('event_id'),
  actorName: text('actor_name').notNull(),
  module: text('module').notNull(),
  objectType: text('object_type').notNull(),
  objectId: text('object_id').notNull(),
  action: text('action').notNull(),
  result: text('result').notNull(),
  requestId: text('request_id').notNull(),
  occurredAt: text('occurred_at').notNull(),
}, (table) => [index('idx_audit_logs_event_time').on(table.eventId, table.occurredAt)]);

export const recycleBinItems = sqliteTable('recycle_bin_items', {
  id: text('id').primaryKey(),
  eventId: text('event_id').references(() => events.id),
  module: text('module').notNull(),
  objectType: text('object_type').notNull(),
  objectId: text('object_id').notNull(),
  objectLabel: text('object_label').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  status: text('status').notNull(),
  deletedBy: text('deleted_by').notNull(),
  deletedAt: text('deleted_at').notNull(),
  restoredBy: text('restored_by'),
  restoredAt: text('restored_at'),
  restoreReason: text('restore_reason'),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_recycle_bin_event_status_time').on(table.eventId, table.status, table.deletedAt),
  index('idx_recycle_bin_object').on(table.objectType, table.objectId),
]);

export const dataMergeRecords = sqliteTable('data_merge_records', {
  id: text('id').primaryKey(), entityType: text('entity_type').notNull(), sourceId: text('source_id').notNull(), targetId: text('target_id').notNull(), status: text('status').notNull(), fieldStrategyJson: text('field_strategy_json').notNull(), previewJson: text('preview_json').notNull(), mergedBy: text('merged_by').notNull(), mergedAt: text('merged_at').notNull(), revertedBy: text('reverted_by'), revertedAt: text('reverted_at'), revertReason: text('revert_reason'),
}, (table) => [index('idx_data_merge_entity_status').on(table.entityType, table.status), index('idx_data_merge_source').on(table.sourceId)]);

export const sensitiveExportRequests = sqliteTable('sensitive_export_requests', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), scope: text('scope').notNull(), dataset: text('dataset').notNull(),
  fieldsJson: text('fields_json').notNull(), filtersJson: text('filters_json').notNull(), purpose: text('purpose').notNull(), status: text('status').notNull(),
  requestedByAccountId: text('requested_by_account_id').notNull().references(() => employeeAccounts.id), requestedByName: text('requested_by_name').notNull(), requestedAt: text('requested_at').notNull(),
  reviewedByAccountId: text('reviewed_by_account_id').references(() => employeeAccounts.id), reviewedByName: text('reviewed_by_name'), reviewedAt: text('reviewed_at'), reviewReason: text('review_reason'), fileId: text('file_id'),
  ...timestamps,
}, (table) => [index('idx_sensitive_export_event_status').on(table.eventId, table.status), index('idx_sensitive_export_requester').on(table.requestedByAccountId, table.requestedAt)]);

export const sensitiveExportFiles = sqliteTable('sensitive_export_files', {
  id: text('id').primaryKey(), requestId: text('request_id').notNull().references(() => sensitiveExportRequests.id), fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(), content: text('content').notNull(), sha256: text('sha256').notNull(), rowCount: integer('row_count').notNull(),
  generatedAt: text('generated_at').notNull(), expiresAt: text('expires_at').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('uidx_sensitive_export_file_request').on(table.requestId), index('idx_sensitive_export_file_expiry').on(table.expiresAt)]);

export const sensitiveExportDownloadLogs = sqliteTable('sensitive_export_download_logs', {
  id: text('id').primaryKey(), requestId: text('request_id').notNull().references(() => sensitiveExportRequests.id), fileId: text('file_id').notNull().references(() => sensitiveExportFiles.id),
  downloadedByAccountId: text('downloaded_by_account_id').notNull().references(() => employeeAccounts.id), downloadedByName: text('downloaded_by_name').notNull(),
  result: text('result').notNull(), requestIdempotencyKey: text('request_idempotency_key').notNull(), downloadedAt: text('downloaded_at').notNull(),
}, (table) => [index('idx_sensitive_export_download_request').on(table.requestId, table.downloadedAt)]);

export const dataImportJobs = sqliteTable('data_import_jobs', {
  id: text('id').primaryKey(), eventId: text('event_id').notNull().references(() => events.id), importType: text('import_type').notNull(), sourceFileName: text('source_file_name').notNull(),
  sourceSha256: text('source_sha256').notNull(), status: text('status').notNull(), rowCount: integer('row_count').notNull(), validCount: integer('valid_count').notNull(), errorCount: integer('error_count').notNull(),
  rowsJson: text('rows_json').notNull(), errorsJson: text('errors_json').notNull(), requestedByAccountId: text('requested_by_account_id').notNull().references(() => employeeAccounts.id),
  requestedByName: text('requested_by_name').notNull(), validatedAt: text('validated_at').notNull(), committedAt: text('committed_at'), committedByName: text('committed_by_name'), ...timestamps,
}, (table) => [index('idx_data_import_event_status').on(table.eventId, table.status), index('idx_data_import_requester').on(table.requestedByAccountId, table.createdAt)]);

export const metricDefinitions = sqliteTable('metric_definitions', {
  code: text('code').primaryKey(), name: text('name').notNull(), description: text('description').notNull(), unit: text('unit').notNull(), scope: text('scope').notNull(),
  calculationMode: text('calculation_mode').notNull(), version: text('version').notNull(), ownerName: text('owner_name').notNull(), status: text('status').notNull(), ...timestamps,
});

export const metricSnapshotRuns = sqliteTable('metric_snapshot_runs', {
  id: text('id').primaryKey(), eventId: text('event_id').references(() => events.id), year: integer('year').notNull(), scope: text('scope').notNull(), scopeKey: text('scope_key').notNull(),
  status: text('status').notNull(), snapshotCount: integer('snapshot_count').notNull(), errorMessage: text('error_message'), requestedByName: text('requested_by_name').notNull(),
  startedAt: text('started_at').notNull(), completedAt: text('completed_at'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_metric_run_scope_time').on(table.scopeKey, table.startedAt)]);

export const metricSnapshots = sqliteTable('metric_snapshots', {
  id: text('id').primaryKey(), runId: text('run_id').notNull().references(() => metricSnapshotRuns.id), metricCode: text('metric_code').notNull().references(() => metricDefinitions.code),
  eventId: text('event_id').references(() => events.id), year: integer('year').notNull(), scopeKey: text('scope_key').notNull(), valueNumber: text('value_number').notNull(),
  numerator: integer('numerator'), denominator: integer('denominator'), definitionVersion: text('definition_version').notNull(), periodStart: text('period_start').notNull(), periodEnd: text('period_end').notNull(), calculatedAt: text('calculated_at').notNull(),
}, (table) => [index('idx_metric_snapshot_scope_metric_time').on(table.scopeKey, table.metricCode, table.calculatedAt), index('idx_metric_snapshot_run').on(table.runId)]);

export const reportDefinitions = sqliteTable('report_definitions', {
  id: text('id').primaryKey(), code: text('code').notNull(), name: text('name').notNull(), description: text('description').notNull(), scope: text('scope').notNull(),
  format: text('format').notNull(), columnsJson: text('columns_json').notNull(), status: text('status').notNull(), ownerName: text('owner_name').notNull(), ...timestamps,
}, (table) => [uniqueIndex('uidx_report_definition_code').on(table.code)]);

export const reportRuns = sqliteTable('report_runs', {
  id: text('id').primaryKey(), definitionId: text('definition_id').notNull().references(() => reportDefinitions.id), eventId: text('event_id').references(() => events.id), year: integer('year').notNull(),
  filtersJson: text('filters_json').notNull(), status: text('status').notNull(), rowCount: integer('row_count').notNull(), resultContent: text('result_content'), fileName: text('file_name'), sha256: text('sha256'),
  requestedByName: text('requested_by_name').notNull(), startedAt: text('started_at').notNull(), completedAt: text('completed_at'), errorMessage: text('error_message'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_report_run_definition_time').on(table.definitionId, table.startedAt), index('idx_report_run_event_time').on(table.eventId, table.startedAt)]);
