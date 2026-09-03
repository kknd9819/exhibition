CREATE TABLE otp_challenges (
  id text PRIMARY KEY NOT NULL,
  account_id text NOT NULL REFERENCES employee_accounts(id),
  channel text NOT NULL,
  destination_masked text NOT NULL,
  code_hash text NOT NULL,
  expires_at text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at text,
  created_at text NOT NULL
);

CREATE TABLE login_sessions (
  id text PRIMARY KEY NOT NULL,
  account_id text NOT NULL REFERENCES employee_accounts(id),
  token_hash text NOT NULL,
  expires_at text NOT NULL,
  revoked_at text,
  device text NOT NULL,
  created_at text NOT NULL,
  last_seen_at text NOT NULL
);
CREATE UNIQUE INDEX uidx_login_session_token ON login_sessions(token_hash);
CREATE INDEX idx_login_session_account ON login_sessions(account_id, expires_at);
