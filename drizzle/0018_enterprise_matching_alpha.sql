ALTER TABLE demand_supply_posts ADD COLUMN publisher_enterprise_id text REFERENCES enterprises(id);
ALTER TABLE appointments ADD COLUMN inviter_enterprise_id text REFERENCES enterprises(id);
ALTER TABLE appointments ADD COLUMN invitee_enterprise_id text REFERENCES enterprises(id);

CREATE INDEX idx_appointments_enterprise ON appointments(inviter_enterprise_id, invitee_enterprise_id);

UPDATE demand_supply_posts
SET publisher_enterprise_id = (SELECT id FROM enterprises WHERE enterprises.name_zh = demand_supply_posts.publisher_name LIMIT 1)
WHERE publisher_enterprise_id IS NULL;

UPDATE appointments
SET inviter_enterprise_id = (SELECT id FROM enterprises WHERE enterprises.name_zh = appointments.inviter_name LIMIT 1),
    invitee_enterprise_id = (SELECT id FROM enterprises WHERE enterprises.name_zh = appointments.invitee_name LIMIT 1)
WHERE inviter_enterprise_id IS NULL OR invitee_enterprise_id IS NULL;
