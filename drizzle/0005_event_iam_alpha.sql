ALTER TABLE events ADD COLUMN owner_account_id text;
ALTER TABLE events ADD COLUMN event_type text NOT NULL DEFAULT 'EXHIBITION';
ALTER TABLE events ADD COLUMN venue_text text NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN languages_json text NOT NULL DEFAULT '["zh-CN"]';

CREATE TABLE employee_accounts (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  status text NOT NULL,
  last_login_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_employee_mobile ON employee_accounts(mobile);
CREATE UNIQUE INDEX uidx_employee_email ON employee_accounts(email);

CREATE TABLE event_members (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  account_id text NOT NULL REFERENCES employee_accounts(id),
  role_code text NOT NULL,
  permissions_json text NOT NULL DEFAULT '[]',
  is_reviewer integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  joined_at text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_event_member_account ON event_members(event_id, account_id);

CREATE TABLE event_features (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  feature_code text NOT NULL,
  enabled integer NOT NULL DEFAULT 1,
  config_json text NOT NULL DEFAULT '{}',
  updated_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_event_feature_code ON event_features(event_id, feature_code);

CREATE TABLE event_owner_history (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  old_owner_account_id text,
  new_owner_account_id text NOT NULL,
  old_owner_name text NOT NULL,
  new_owner_name text NOT NULL,
  reason text NOT NULL,
  operator_name text NOT NULL,
  effective_at text NOT NULL
);

CREATE TABLE event_copy_jobs (
  id text PRIMARY KEY NOT NULL,
  source_event_id text NOT NULL REFERENCES events(id),
  target_event_id text REFERENCES events(id),
  selection_json text NOT NULL,
  status text NOT NULL,
  report_json text NOT NULL,
  created_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_event_copy_jobs_source ON event_copy_jobs(source_event_id, created_at);
