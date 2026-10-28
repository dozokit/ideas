-- A board is an address (its id, e.g. "roadmap") the owner creates. Visibility "team" hides
-- everything from outsiders; "sso_secret" signs the links a company tool mints for /sso.
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'team')),
  sso_secret TEXT NOT NULL,
  allowed_domains TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

-- A person. Google users are told apart by Google's own "sub"; a signed-link (SSO) user's ext_id
-- is prefixed with the board id, so a company tool can never collide with or impersonate a Google user.
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'sso')),
  ext_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (provider, ext_id)
);

-- Who has ever signed in through a team board's signed link, or a Google user whose domain
-- matched: once in here, they keep seeing the board even if allowed_domains changes later.
CREATE TABLE board_members (
  board_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (board_id, user_id)
);

-- One idea. votes and comments are kept here too (recomputed from the tables below on every
-- write in the same batch), so listing a board never counts rows across the whole site.
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'planned', 'in_progress', 'done')),
  votes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX posts_board_status_votes ON posts (board_id, status, votes DESC);
CREATE INDEX posts_board_created ON posts (board_id, created_at DESC);

-- One vote per person per idea. The UNIQUE constraint is the only guard against a second vote:
-- insert "on conflict do nothing", then check whether a row actually changed.
CREATE TABLE votes (
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (post_id, user_id)
);
CREATE INDEX votes_user ON votes (user_id);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX comments_post_created ON comments (post_id, created_at);

-- Every signed-link token's jti, so a link can only ever sign someone in once. Rows past their
-- exp are swept on each /sso call; this table is never backed up (it holds nothing useful, and
-- it would just grow the backup).
CREATE TABLE sso_jti (
  board_id TEXT NOT NULL,
  jti TEXT NOT NULL,
  exp INTEGER NOT NULL,
  PRIMARY KEY (board_id, jti)
);
CREATE INDEX sso_jti_exp ON sso_jti (exp);
