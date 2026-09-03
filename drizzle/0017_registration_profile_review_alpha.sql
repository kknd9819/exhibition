ALTER TABLE registration_activities ADD COLUMN profile_recheck_enabled integer NOT NULL DEFAULT 1;
ALTER TABLE registration_activities ADD COLUMN key_profile_fields_json text NOT NULL DEFAULT '["name","mobile","email","organization","jobTitle","country"]';

CREATE TABLE registration_profile_versions (
  id text PRIMARY KEY NOT NULL,
  record_id text NOT NULL REFERENCES registration_records(id),
  version_no integer NOT NULL,
  values_json text NOT NULL,
  changed_fields_json text NOT NULL,
  review_status text NOT NULL,
  submitted_by text NOT NULL,
  approved_by text,
  review_reason text,
  published_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE UNIQUE INDEX uidx_registration_profile_version_no ON registration_profile_versions(record_id, version_no);
CREATE INDEX idx_registration_profile_review_status ON registration_profile_versions(review_status);

INSERT INTO registration_profile_versions (
  id, record_id, version_no, values_json, changed_fields_json, review_status,
  submitted_by, approved_by, review_reason, published_at, created_at, updated_at
)
SELECT
  'registration-profile-initial-' || id,
  id,
  version,
  answers_json,
  '[]',
  CASE WHEN status IN ('APPROVED', 'CHECKED_IN') THEN 'PUBLISHED' WHEN status = 'REJECTED' THEN 'RETURNED' ELSE 'PENDING' END,
  person_name,
  NULL,
  review_reason,
  CASE WHEN status IN ('APPROVED', 'CHECKED_IN') THEN updated_at ELSE NULL END,
  created_at,
  updated_at
FROM registration_records;
