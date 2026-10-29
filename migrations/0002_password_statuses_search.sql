-- 1.1.0: the admin signs in with one password, people only ever come in through a board's signed
-- link, each board sets its own statuses, logo and colour, and ideas get a search index so a new
-- one can point at the ones already suggested.

-- Nobody signs in by email domain any more: a board's members are the people its signed link let in.
ALTER TABLE boards DROP COLUMN allowed_domains;
-- The board's statuses, in order, as JSON [{id, label}]. New ideas start in the first one. An empty
-- label shows the translated name of one of the four built-in ids; a typed one shows as typed.
ALTER TABLE boards ADD COLUMN statuses TEXT NOT NULL DEFAULT '[{"id":"open","label":""},{"id":"planned","label":""},{"id":"in_progress","label":""},{"id":"done","label":""}]';
-- A data URL (PNG, JPEG, SVG or WebP, 200 KB at most), only ever shown as <img src>, never inlined.
ALTER TABLE boards ADD COLUMN logo TEXT;
-- "#rrggbb", the accent colour of the board's page.
ALTER TABLE boards ADD COLUMN color TEXT;

-- posts.status is now any id from its board's statuses: the table is rebuilt without its CHECK.
CREATE TABLE posts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  votes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
INSERT INTO posts_new (id, board_id, user_id, title, body, status, votes, comments, created_at)
  SELECT id, board_id, user_id, title, body, status, votes, comments, created_at FROM posts;
DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;
CREATE INDEX posts_board_status_votes ON posts (board_id, status, votes DESC);
CREATE INDEX posts_board_created ON posts (board_id, created_at DESC);

-- Ideas' titles and bodies, for "Already suggested?". It reads its text from posts (external
-- content), kept in step by the triggers below; it isn't backed up, since it's rebuilt from posts.
CREATE VIRTUAL TABLE posts_fts USING fts5(title, body, content='posts', content_rowid='id');
CREATE TRIGGER posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts (rowid, title, body) VALUES (new.id, new.title, new.body);
END;
CREATE TRIGGER posts_fts_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts (posts_fts, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
END;
CREATE TRIGGER posts_fts_update AFTER UPDATE OF title, body ON posts BEGIN
  INSERT INTO posts_fts (posts_fts, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
  INSERT INTO posts_fts (rowid, title, body) VALUES (new.id, new.title, new.body);
END;
INSERT INTO posts_fts (posts_fts) VALUES ('rebuild');

-- The password set on the admin page, as a PBKDF2 hash. secret_mac ties it to the PASSWORD secret it
-- replaced: once that secret is edited in Cloudflare, this row stops counting. Never backed up.
CREATE TABLE password (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  secret_mac TEXT NOT NULL,
  changed_at INTEGER NOT NULL
);

-- A random id made once for this copy, sent with the daily version check so Dozokit can count
-- copies in use. share = 0 (Admin → Updates) sends nothing and shows no update notice.
CREATE TABLE install (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  uid TEXT NOT NULL,
  share INTEGER NOT NULL DEFAULT 1
);
