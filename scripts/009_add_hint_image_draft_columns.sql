ALTER TABLE questions 
ADD COLUMN hint_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER subject,
ADD COLUMN hint_text TEXT NULL AFTER hint_enabled,
ADD COLUMN image_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER hint_text,
ADD COLUMN image_url VARCHAR(1024) NULL AFTER image_enabled,
ADD COLUMN draft_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER image_url;

UPDATE questions SET hint_enabled = COALESCE(hint_enabled, FALSE);
UPDATE questions SET image_enabled = COALESCE(image_enabled, FALSE);
UPDATE questions SET draft_enabled = COALESCE(draft_enabled, FALSE);
