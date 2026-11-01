-- 1.5.0: a public board can let anyone post, with no signed link. Someone's first vote, idea, bug or
-- comment makes them a visitor named "<visitor_name> 1234" (empty: "Visitor"), signed in on that browser.
ALTER TABLE boards ADD COLUMN anyone_can_post INTEGER NOT NULL DEFAULT 0;
ALTER TABLE boards ADD COLUMN visitor_name TEXT;
