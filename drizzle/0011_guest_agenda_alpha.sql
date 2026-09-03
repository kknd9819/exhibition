CREATE TABLE IF NOT EXISTS guest_masters (
  id TEXT PRIMARY KEY, name_zh TEXT NOT NULL, name_intl TEXT NOT NULL DEFAULT '', mobile TEXT, email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guest_masters_name ON guest_masters(name_zh);

CREATE TABLE IF NOT EXISTS event_guests (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), guest_master_id TEXT NOT NULL REFERENCES guest_masters(id),
  guest_type TEXT NOT NULL, invitation_source TEXT NOT NULL, status TEXT NOT NULL, current_version_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_event_guest_master ON event_guests(event_id, guest_master_id);
CREATE INDEX IF NOT EXISTS idx_event_guests_event_status ON event_guests(event_id, status);

CREATE TABLE IF NOT EXISTS guest_profile_versions (
  id TEXT PRIMARY KEY, event_guest_id TEXT NOT NULL REFERENCES event_guests(id), version_no INTEGER NOT NULL,
  profile_json TEXT NOT NULL, review_status TEXT NOT NULL, submitted_by TEXT NOT NULL, approved_by TEXT,
  published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_guest_profile_version ON guest_profile_versions(event_guest_id, version_no);

CREATE TABLE IF NOT EXISTS agendas (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), name TEXT NOT NULL, timezone TEXT NOT NULL,
  status TEXT NOT NULL, current_version_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agendas_event ON agendas(event_id);

CREATE TABLE IF NOT EXISTS agenda_sessions (
  id TEXT PRIMARY KEY, agenda_id TEXT NOT NULL REFERENCES agendas(id), parent_session_id TEXT, title TEXT NOT NULL,
  session_type TEXT NOT NULL, introduction TEXT NOT NULL DEFAULT '', start_at TEXT NOT NULL, end_at TEXT NOT NULL,
  location_text TEXT NOT NULL DEFAULT '', cover_asset_id TEXT REFERENCES assets(id),
  registration_activity_id TEXT REFERENCES registration_activities(id), material_document_id TEXT REFERENCES document_items(id),
  sort_order INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agenda_sessions_agenda_time ON agenda_sessions(agenda_id, start_at);

CREATE TABLE IF NOT EXISTS session_guests (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES agenda_sessions(id), event_guest_id TEXT NOT NULL REFERENCES event_guests(id),
  role TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_session_guest ON session_guests(session_id, event_guest_id);

CREATE TABLE IF NOT EXISTS agenda_versions (
  id TEXT PRIMARY KEY, agenda_id TEXT NOT NULL REFERENCES agendas(id), version_no INTEGER NOT NULL, snapshot_json TEXT NOT NULL,
  change_summary TEXT NOT NULL, review_status TEXT NOT NULL, submitted_by TEXT NOT NULL, approved_by TEXT,
  published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_agenda_version ON agenda_versions(agenda_id, version_no);

CREATE TABLE IF NOT EXISTS agenda_changes (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), agenda_id TEXT NOT NULL REFERENCES agendas(id),
  before_version_id TEXT, after_version_id TEXT NOT NULL, change_json TEXT NOT NULL,
  notification_status TEXT NOT NULL, created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO agendas (id,event_id,name,timezone,status,current_version_id,created_at,updated_at)
SELECT 'agenda-morocco-main','evt-morocco-2026','大会日程','Africa/Casablanca','DRAFT',NULL,'2026-08-28T00:00:00.000Z','2026-08-28T00:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM events WHERE id='evt-morocco-2026');
