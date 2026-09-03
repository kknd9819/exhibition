CREATE TABLE IF NOT EXISTS portal_translation_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id),
  page_id TEXT NOT NULL REFERENCES portal_pages(id),
  source_version_id TEXT NOT NULL REFERENCES portal_page_versions(id),
  target_language TEXT NOT NULL,
  result_version_id TEXT REFERENCES portal_page_versions(id),
  source_sha256 TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  confirmed_by TEXT,
  requested_at TEXT NOT NULL,
  confirmed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_translation_jobs_page_language ON portal_translation_jobs(page_id,target_language,created_at);

CREATE TABLE IF NOT EXISTS portal_language_publications (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id),
  page_id TEXT NOT NULL REFERENCES portal_pages(id),
  language TEXT NOT NULL,
  current_version_id TEXT REFERENCES portal_page_versions(id),
  status TEXT NOT NULL,
  source_version_id TEXT REFERENCES portal_page_versions(id),
  published_by TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_portal_language_publications ON portal_language_publications(page_id,language);
