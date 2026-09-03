ALTER TABLE enterprise_contact_history ADD COLUMN old_display_name TEXT;
ALTER TABLE enterprise_contact_history ADD COLUMN new_display_name TEXT;
ALTER TABLE enterprise_contact_history ADD COLUMN identity_type TEXT;
ALTER TABLE enterprise_contact_history ADD COLUMN reason TEXT;
ALTER TABLE enterprise_contact_history ADD COLUMN event_id TEXT REFERENCES events(id);
ALTER TABLE enterprise_contact_history ADD COLUMN operator_account_id TEXT REFERENCES employee_accounts(id);

CREATE TABLE IF NOT EXISTS enterprise_contact_handoff_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  identity_type TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  destination_masked TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  requested_by_account_id TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES enterprise_accounts(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (requested_by_account_id) REFERENCES employee_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_enterprise_handoff_account_time ON enterprise_contact_handoff_challenges(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_handoff_identity ON enterprise_contact_handoff_challenges(identity_type, normalized_value);
