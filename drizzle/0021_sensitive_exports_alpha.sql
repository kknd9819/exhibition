CREATE TABLE IF NOT EXISTS sensitive_export_requests (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  dataset TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  filters_json TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by_account_id TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  reviewed_by_account_id TEXT,
  reviewed_by_name TEXT,
  reviewed_at TEXT,
  review_reason TEXT,
  file_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (requested_by_account_id) REFERENCES employee_accounts(id),
  FOREIGN KEY (reviewed_by_account_id) REFERENCES employee_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_sensitive_export_event_status ON sensitive_export_requests(event_id, status);
CREATE INDEX IF NOT EXISTS idx_sensitive_export_requester ON sensitive_export_requests(requested_by_account_id, requested_at);

CREATE TABLE IF NOT EXISTS sensitive_export_files (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  content TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES sensitive_export_requests(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_sensitive_export_file_request ON sensitive_export_files(request_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_export_file_expiry ON sensitive_export_files(expires_at);

CREATE TABLE IF NOT EXISTS sensitive_export_download_logs (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  downloaded_by_account_id TEXT NOT NULL,
  downloaded_by_name TEXT NOT NULL,
  result TEXT NOT NULL,
  request_idempotency_key TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES sensitive_export_requests(id),
  FOREIGN KEY (file_id) REFERENCES sensitive_export_files(id),
  FOREIGN KEY (downloaded_by_account_id) REFERENCES employee_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_sensitive_export_download_request ON sensitive_export_download_logs(request_id, downloaded_at);
