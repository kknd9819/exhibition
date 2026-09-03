CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_account_id TEXT NOT NULL,
  event_id TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_type TEXT,
  related_id TEXT,
  href TEXT,
  status TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
CREATE INDEX IF NOT EXISTS idx_user_notification_recipient_status_time ON user_notifications(recipient_type, recipient_account_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_notification_event_time ON user_notifications(event_id, created_at);
