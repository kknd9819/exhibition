CREATE TABLE demand_supply_posts (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  publisher_type text NOT NULL,
  publisher_name text NOT NULL,
  post_type text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  countries_json text NOT NULL DEFAULT '[]',
  description text NOT NULL,
  review_status text NOT NULL,
  submitted_by text NOT NULL,
  approved_by text,
  published_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_demand_supply_event_status ON demand_supply_posts(event_id, review_status);

CREATE TABLE appointments (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  source_type text NOT NULL,
  source_id text,
  inviter_name text NOT NULL,
  invitee_name text NOT NULL,
  proposed_start text NOT NULL,
  proposed_end text NOT NULL,
  location_preference text NOT NULL,
  confirmed_start text,
  confirmed_end text,
  confirmed_location text,
  status text NOT NULL,
  created_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_appointments_event_status ON appointments(event_id, status);

CREATE TABLE appointment_responses (
  id text PRIMARY KEY NOT NULL,
  appointment_id text NOT NULL REFERENCES appointments(id),
  responder_name text NOT NULL,
  action text NOT NULL,
  proposed_start text,
  proposed_end text,
  location_text text,
  note text NOT NULL DEFAULT '',
  created_at text NOT NULL
);

CREATE TABLE schedule_batches (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  name text NOT NULL,
  status text NOT NULL,
  submitter_name text NOT NULL,
  reviewer_name text,
  conflict_report_json text NOT NULL DEFAULT '[]',
  submitted_at text,
  published_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_schedule_batches_event_status ON schedule_batches(event_id, status);

CREATE TABLE meeting_schedules (
  id text PRIMARY KEY NOT NULL,
  event_id text NOT NULL REFERENCES events(id),
  batch_id text NOT NULL REFERENCES schedule_batches(id),
  appointment_id text REFERENCES appointments(id),
  participant_a text NOT NULL,
  participant_b text NOT NULL,
  start_at text NOT NULL,
  end_at text NOT NULL,
  location_text text NOT NULL,
  publish_status text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_meeting_schedules_event_time ON meeting_schedules(event_id, start_at, end_at);
