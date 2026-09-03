ALTER TABLE checkin_logs ADD COLUMN request_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_checkin_request_key ON checkin_logs(request_key);

CREATE TABLE IF NOT EXISTS registration_access_codes (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES registration_records(id),
  code TEXT NOT NULL,
  status TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_registration_access_record ON registration_access_codes(record_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_registration_access_code ON registration_access_codes(code);

CREATE TABLE IF NOT EXISTS checkin_reversals (
  id TEXT PRIMARY KEY,
  checkin_log_id TEXT NOT NULL REFERENCES checkin_logs(id),
  reason TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_checkin_reversal_log ON checkin_reversals(checkin_log_id);

INSERT OR IGNORE INTO registration_access_codes (id,record_id,code,status,issued_at,updated_at)
SELECT 'access-' || id,id,'EXPO-' || upper(substr(hex(randomblob(8)),1,16)),'ACTIVE',created_at,updated_at FROM registration_records;
