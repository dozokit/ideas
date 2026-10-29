-- 1.4.0: a post is an idea or a bug report. A bug adds what the person expected, where it happened
-- (a page or a link) and an optional screenshot, kept in R2 under "screenshots/" (posts.screenshot is its key).
-- Every post before this one is an idea.
ALTER TABLE posts ADD COLUMN type TEXT NOT NULL DEFAULT 'idea' CHECK (type IN ('idea', 'bug'));
ALTER TABLE posts ADD COLUMN expected TEXT;
ALTER TABLE posts ADD COLUMN place TEXT;
ALTER TABLE posts ADD COLUMN screenshot TEXT;
-- Bugs have their own statuses, same shape as boards.statuses; new bugs start in the first one.
ALTER TABLE boards ADD COLUMN bug_statuses TEXT NOT NULL DEFAULT '[{"id":"new","label":""},{"id":"confirmed","label":""},{"id":"fixing","label":""},{"id":"fixed","label":""}]';

-- Developer tokens (board Settings → Connect → For your developers): each reads one board's posts
-- through /mcp. Only the token's SHA-256 is kept; the token itself is shown once, when it is made.
CREATE TABLE tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX tokens_board ON tokens (board_id);
