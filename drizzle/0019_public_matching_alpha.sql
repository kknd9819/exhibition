ALTER TABLE demand_supply_posts ADD COLUMN publisher_public_account_id TEXT;
ALTER TABLE appointments ADD COLUMN inviter_public_account_id TEXT;
ALTER TABLE appointments ADD COLUMN invitee_public_account_id TEXT;

CREATE INDEX IF NOT EXISTS idx_demand_supply_public_account
  ON demand_supply_posts(publisher_public_account_id, event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_public_account
  ON appointments(inviter_public_account_id, invitee_public_account_id);
