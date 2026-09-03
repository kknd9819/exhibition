ALTER TABLE document_items ADD COLUMN submitted_by text NOT NULL DEFAULT '';
ALTER TABLE document_items ADD COLUMN approved_by text;
ALTER TABLE document_items ADD COLUMN published_at text;
