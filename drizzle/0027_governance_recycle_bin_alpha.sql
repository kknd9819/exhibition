CREATE TABLE IF NOT EXISTS recycle_bin_items (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT REFERENCES events(id),
  module TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  object_label TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL,
  deleted_by TEXT NOT NULL,
  deleted_at TEXT NOT NULL,
  restored_by TEXT,
  restored_at TEXT,
  restore_reason TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recycle_bin_event_status_time
  ON recycle_bin_items(event_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_object
  ON recycle_bin_items(object_type, object_id);
