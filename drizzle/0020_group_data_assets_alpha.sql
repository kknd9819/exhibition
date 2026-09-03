CREATE TABLE IF NOT EXISTS person_masters (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  merged_into_person_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_person_master_merged ON person_masters(merged_into_person_id);

ALTER TABLE public_accounts ADD COLUMN person_master_id TEXT;
INSERT OR IGNORE INTO person_masters (id, display_name, status, merged_into_person_id, created_at, updated_at)
SELECT 'person-master-' || id, display_name, 'ACTIVE', NULL, created_at, updated_at FROM public_accounts;
UPDATE public_accounts SET person_master_id = 'person-master-' || id WHERE person_master_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_public_account_person_master ON public_accounts(person_master_id);

ALTER TABLE enterprises ADD COLUMN merged_into_enterprise_id TEXT;
CREATE INDEX IF NOT EXISTS idx_enterprise_merged_into ON enterprises(merged_into_enterprise_id);

CREATE TABLE IF NOT EXISTS data_merge_records (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  status TEXT NOT NULL,
  field_strategy_json TEXT NOT NULL,
  preview_json TEXT NOT NULL,
  merged_by TEXT NOT NULL,
  merged_at TEXT NOT NULL,
  reverted_by TEXT,
  reverted_at TEXT,
  revert_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_data_merge_entity_status ON data_merge_records(entity_type, status);
CREATE INDEX IF NOT EXISTS idx_data_merge_source ON data_merge_records(source_id);
