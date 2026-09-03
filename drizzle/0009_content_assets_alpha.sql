CREATE TABLE assets (
  id text PRIMARY KEY NOT NULL,
  scope text NOT NULL,
  event_id text REFERENCES events(id),
  asset_type text NOT NULL,
  original_name text NOT NULL,
  file_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  checksum text NOT NULL,
  status text NOT NULL,
  scan_result text NOT NULL,
  created_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_assets_file_key ON assets(file_key);
CREATE INDEX idx_assets_event_status ON assets(event_id, status);

CREATE TABLE asset_references (
  id text PRIMARY KEY NOT NULL,
  asset_id text NOT NULL REFERENCES assets(id),
  event_id text REFERENCES events(id),
  module text NOT NULL,
  object_id text NOT NULL,
  version_id text,
  created_at text NOT NULL
);
CREATE INDEX idx_asset_references_asset ON asset_references(asset_id);

CREATE TABLE content_items (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  content_type text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL,
  current_version_id text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_content_event_slug ON content_items(event_id, slug);
CREATE INDEX idx_content_event_status ON content_items(event_id, status);

CREATE TABLE content_versions (
  id text PRIMARY KEY NOT NULL,
  item_id text NOT NULL REFERENCES content_items(id),
  version_no integer NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL,
  cover_asset_id text REFERENCES assets(id),
  review_status text NOT NULL,
  submitted_by text NOT NULL,
  approved_by text,
  published_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_content_version_no ON content_versions(item_id, version_no);

CREATE TABLE document_items (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  title text NOT NULL,
  file_asset_id text NOT NULL REFERENCES assets(id),
  access_mode text NOT NULL,
  registration_activity_id text REFERENCES registration_activities(id),
  status text NOT NULL,
  created_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_documents_event_status ON document_items(event_id, status);

CREATE TABLE document_download_logs (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  document_id text NOT NULL REFERENCES document_items(id),
  actor_type text NOT NULL,
  actor_id text,
  result text NOT NULL,
  occurred_at text NOT NULL
);
