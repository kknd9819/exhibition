CREATE TABLE IF NOT EXISTS data_import_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL,
  import_type TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  status TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  valid_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  rows_json TEXT NOT NULL,
  errors_json TEXT NOT NULL,
  requested_by_account_id TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  validated_at TEXT NOT NULL,
  committed_at TEXT,
  committed_by_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (requested_by_account_id) REFERENCES employee_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_data_import_event_status ON data_import_jobs(event_id, status);
CREATE INDEX IF NOT EXISTS idx_data_import_requester ON data_import_jobs(requested_by_account_id, created_at);
