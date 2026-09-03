CREATE TABLE IF NOT EXISTS public_accounts (id TEXT PRIMARY KEY,display_name TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public_identities (id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES public_accounts(id),identity_type TEXT NOT NULL,normalized_value TEXT NOT NULL,display_masked TEXT NOT NULL,verified_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_public_identity_type_value ON public_identities(identity_type,normalized_value);
CREATE INDEX IF NOT EXISTS idx_public_identity_account ON public_identities(account_id);
CREATE TABLE IF NOT EXISTS public_otp_challenges (id TEXT PRIMARY KEY,identity_type TEXT NOT NULL,normalized_value TEXT NOT NULL,destination_masked TEXT NOT NULL,code_hash TEXT NOT NULL,expires_at TEXT NOT NULL,attempt_count INTEGER NOT NULL DEFAULT 0,consumed_at TEXT,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_public_otp_identity_time ON public_otp_challenges(identity_type,normalized_value,created_at);
CREATE TABLE IF NOT EXISTS public_sessions (id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES public_accounts(id),token_hash TEXT NOT NULL,remember_days INTEGER NOT NULL,expires_at TEXT NOT NULL,last_seen_at TEXT NOT NULL,revoked_at TEXT,created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_public_session_token ON public_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_public_session_account ON public_sessions(account_id,expires_at);
