CREATE TABLE IF NOT EXISTS enterprise_accounts (
  id TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_enterprise_account_enterprise ON enterprise_accounts(enterprise_id);

CREATE TABLE IF NOT EXISTS enterprise_identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES enterprise_accounts(id),
  identity_type TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  display_masked TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_enterprise_identity_type_value ON enterprise_identities(identity_type,normalized_value);
CREATE INDEX IF NOT EXISTS idx_enterprise_identity_account ON enterprise_identities(account_id);

CREATE TABLE IF NOT EXISTS enterprise_otp_challenges (
  id TEXT PRIMARY KEY,
  identity_type TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  destination_masked TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enterprise_otp_identity_time ON enterprise_otp_challenges(identity_type,normalized_value,created_at);

CREATE TABLE IF NOT EXISTS enterprise_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES enterprise_accounts(id),
  token_hash TEXT NOT NULL,
  remember_days INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_enterprise_session_token ON enterprise_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_enterprise_session_account ON enterprise_sessions(account_id,expires_at);

CREATE TABLE IF NOT EXISTS enterprise_contact_history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES enterprise_accounts(id),
  old_identity_masked TEXT,
  new_identity_masked TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enterprise_contact_history_account ON enterprise_contact_history(account_id,created_at);

INSERT OR IGNORE INTO enterprise_accounts (id,enterprise_id,display_name,status,last_login_at,created_at,updated_at)
SELECT account_id,id,CASE WHEN contact_name='' THEN name_zh ELSE contact_name END,'ACTIVE',NULL,created_at,updated_at
FROM enterprises WHERE account_id IS NOT NULL;

INSERT OR IGNORE INTO enterprise_identities (id,account_id,identity_type,normalized_value,display_masked,verified_at,created_at) VALUES
('enterprise-identity-demo-cn','enterprise-account-001','CN_MOBILE','13800002048','138****2048','2026-08-28T00:00:00.000Z','2026-08-28T00:00:00.000Z'),
('enterprise-identity-demo-ma','enterprise-account-002','INTL_MOBILE','+212600000889','+212 *** 889','2026-08-28T00:00:00.000Z','2026-08-28T00:00:00.000Z');

INSERT OR IGNORE INTO events (id,code,slug,name,short_name,year,city,country,timezone,start_at,end_at,status,owner_name,owner_account_id,event_type,venue_text,languages_json,version,created_at,updated_at) VALUES
('evt-africa-2025-history','CFE-AF-2025-HISTORY','2025-africa-history','2025年中国—非洲经贸合作交流活动（历史演示）','非洲经贸交流活动',2025,'内罗毕','肯尼亚','Africa/Nairobi','2025-09-18T09:00:00+03:00','2025-09-19T18:00:00+03:00','ARCHIVED','李敏','employee-limin','INTERNAL_ACTIVITY','内罗毕会议中心','["zh-CN","en"]',1,'2025-01-10T00:00:00.000Z','2025-10-01T00:00:00.000Z');

INSERT OR IGNORE INTO event_exhibitors (id,event_id,enterprise_id,qualification_status,publish_status,category,description,current_version_id,product_count,booth_no,source,version,created_at,updated_at) VALUES
('exhibitor-001-history','evt-africa-2025-history','enterprise-001','APPROVED','PUBLISHED','技术装备','2025届独立参展资料，用于验证企业账号历届管理。','exhibitor-profile-001-history-v1',1,'H-012','历史数据直接录入',1,'2025-02-01T00:00:00.000Z','2025-09-20T00:00:00.000Z');

INSERT OR IGNORE INTO exhibitor_profile_versions (id,event_id,event_exhibitor_id,version_no,profile_json,review_status,submitted_by,approved_by,published_at,created_at,updated_at) VALUES
('exhibitor-profile-001-history-v1','evt-africa-2025-history','exhibitor-001-history',1,'{"nameZh":"华南智能制造有限公司","nameIntl":"South China Intelligent Manufacturing Co., Ltd.","category":"技术装备","country":"中国","description":"2025届独立参展资料，用于验证历届展会事实隔离。","website":"https://example.cn","publicContact":false}','PUBLISHED','企业账号：企业联络员A','赵强','2025-03-01T00:00:00.000Z','2025-02-01T00:00:00.000Z','2025-03-01T00:00:00.000Z');

INSERT OR IGNORE INTO products (id,event_id,event_exhibitor_id,name,category,publish_status,current_version_id,created_at,updated_at) VALUES
('product-001-history','evt-africa-2025-history','exhibitor-001-history','柔性制造单元（2025届）','技术装备','PUBLISHED','product-001-history-v1','2025-02-02T00:00:00.000Z','2025-03-02T00:00:00.000Z');

INSERT OR IGNORE INTO product_versions (id,product_id,version_no,content_json,review_status,submitted_by,approved_by,published_at,created_at,updated_at) VALUES
('product-001-history-v1','product-001-history',1,'{"name":"柔性制造单元（2025届）","category":"技术装备","summary":"仅属于2025届的独立产品资料。","images":[]}','PUBLISHED','企业账号：企业联络员A','赵强','2025-03-02T00:00:00.000Z','2025-02-02T00:00:00.000Z','2025-03-02T00:00:00.000Z');
