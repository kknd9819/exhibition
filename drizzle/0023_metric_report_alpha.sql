CREATE TABLE IF NOT EXISTS metric_definitions (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  scope TEXT NOT NULL,
  calculation_mode TEXT NOT NULL,
  version TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metric_snapshot_runs (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT,
  year INTEGER NOT NULL,
  scope TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  status TEXT NOT NULL,
  snapshot_count INTEGER NOT NULL,
  error_message TEXT,
  requested_by_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
CREATE INDEX IF NOT EXISTS idx_metric_run_scope_time ON metric_snapshot_runs(scope_key, started_at);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  run_id TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  event_id TEXT,
  year INTEGER NOT NULL,
  scope_key TEXT NOT NULL,
  value_number TEXT NOT NULL,
  numerator INTEGER,
  denominator INTEGER,
  definition_version TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES metric_snapshot_runs(id),
  FOREIGN KEY (metric_code) REFERENCES metric_definitions(code),
  FOREIGN KEY (event_id) REFERENCES events(id)
);
CREATE INDEX IF NOT EXISTS idx_metric_snapshot_scope_metric_time ON metric_snapshots(scope_key, metric_code, calculated_at);
CREATE INDEX IF NOT EXISTS idx_metric_snapshot_run ON metric_snapshots(run_id);

CREATE TABLE IF NOT EXISTS report_definitions (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  scope TEXT NOT NULL,
  format TEXT NOT NULL,
  columns_json TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_report_definition_code ON report_definitions(code);

CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY NOT NULL,
  definition_id TEXT NOT NULL,
  event_id TEXT,
  year INTEGER NOT NULL,
  filters_json TEXT NOT NULL,
  status TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  result_content TEXT,
  file_name TEXT,
  sha256 TEXT,
  requested_by_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (definition_id) REFERENCES report_definitions(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);
CREATE INDEX IF NOT EXISTS idx_report_run_definition_time ON report_runs(definition_id, started_at);
CREATE INDEX IF NOT EXISTS idx_report_run_event_time ON report_runs(event_id, started_at);

INSERT OR IGNORE INTO metric_definitions VALUES ('registration.records','报名记录','当前范围内报名事实总数；重复报名保留','条','GROUP_AND_EVENT','HOURLY','1.0','数据运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
INSERT OR IGNORE INTO metric_definitions VALUES ('registration.unique_accounts','去重报名账号','按公众账号ID去重的报名人数','人','GROUP_AND_EVENT','HOURLY','1.0','数据运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
INSERT OR IGNORE INTO metric_definitions VALUES ('registration.checked_in','已签到报名','当前状态为CHECKED_IN的报名事实','条','GROUP_AND_EVENT','HOURLY','1.0','现场运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
INSERT OR IGNORE INTO metric_definitions VALUES ('exhibitor.approved','资格通过企业','参展资格状态为APPROVED的本届企业事实','家','GROUP_AND_EVENT','HOURLY','1.0','展商运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
INSERT OR IGNORE INTO metric_definitions VALUES ('matching.appointments','预约记录','当前范围内全部线下面谈预约事实','条','GROUP_AND_EVENT','HOURLY','1.0','合作洽谈','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
INSERT OR IGNORE INTO metric_definitions VALUES ('message.success_rate','消息成功率','成功回执数除以全部回执数；无回执时为0','%','GROUP_AND_EVENT','HOURLY','1.0','消息运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
INSERT OR IGNORE INTO report_definitions VALUES ('report-event-operations','EVENT_OPERATIONS_SNAPSHOT','展会运营事实对照表','按年度或展会输出报名、账号、签到、企业、询盘与预约','GROUP_AND_EVENT','CSV','["eventCode","eventName","year","status","registrationRecords","uniqueAccounts","checkedIn","approvedExhibitors","inquiries","appointments"]','ACTIVE','数据运营','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
