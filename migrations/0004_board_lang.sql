-- 1.2.3: each board can be set to one language; visitors then see it in that language, with no language picker.
-- Empty means each visitor's browser language, as before.
ALTER TABLE boards ADD COLUMN lang TEXT;
