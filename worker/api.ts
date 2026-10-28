import type { Env } from "./index";
import { currentUser, isAdmin, googleReady, devLoginReady, setupNeeded } from "./auth";
import { getBoard, canSee, BOARD_ID, type Board } from "./boards";
import { verifyTurnstile, turnstileSetupNeeded } from "./turnstile";
import { randomToken } from "./crypto";
import type { User } from "./users";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

const STATUSES = ["open", "planned", "in_progress", "done"] as const;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function requiredText(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t && t.length <= max ? t : null;
}

// Not provided at all is fine (null); provided but too long or the wrong type is not.
function optionalText(raw: unknown, max: number): string | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!t) return null;
  return t.length <= max ? t : undefined;
}

function cleanDomains(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return "";
  if (typeof raw !== "string") return null;
  const parts = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return parts.every((d) => DOMAIN.test(d)) ? parts.join(",") : null;
}

const cleanVisibility = (raw: unknown) => (raw === "public" || raw === "team" ? raw : null);
const cleanStatus = (raw: unknown) => (typeof raw === "string" && (STATUSES as readonly string[]).includes(raw) ? raw : null);

const boardView = (b: Board) => ({ id: b.id, name: b.name, visibility: b.visibility, allowedDomains: b.allowed_domains, createdAt: b.created_at });
const teamOnly = (b: Board) => json({ error: "team_only", name: b.name, visibility: b.visibility }, 403);

// This copy's release. Raise it with each tag on github.com/dozokit/ideas (v1.0.0) and its CHANGELOG.md entry.
const VERSION = "1.0.0";

// The newest release, when it is newer than this copy. GitHub is asked at most once a day per
// Cloudflare location (an hour after a failure); offline or rate-limited means no answer.
async function checkVersion(): Promise<{ version: string; latest: string | null }> {
  let latest: string | null = null;
  try {
    const res = await fetch("https://api.github.com/repos/dozokit/ideas/releases/latest", {
      headers: { accept: "application/vnd.github+json", "user-agent": "dozokit-ideas" },
      signal: AbortSignal.timeout(3000),
      cf: { cacheTtlByStatus: { "200-299": 24 * 3600, "300-599": 3600 }, cacheEverything: true },
    });
    const tag = res.ok ? String(((await res.json()) as { tag_name?: string }).tag_name ?? "").replace(/^v/, "") : "";
    const [a, b] = [tag, VERSION].map((v) => v.split(".").map(Number));
    const i = a.findIndex((n, k) => n !== b[k]);
    if (/^\d+\.\d+\.\d+$/.test(tag) && i !== -1 && a[i] > b[i]) latest = tag;
  } catch {}
  return { version: VERSION, latest };
}

export async function me(req: Request, env: Env) {
  const user = await currentUser(req, env);
  const admin = isAdmin(env, user);
  const { version, latest } = await checkVersion();
  return json({
    user: user ? { id: user.id, name: user.name, email: user.email, admin } : null,
    config: {
      googleReady: googleReady(env),
      devLogin: devLoginReady(req, env),
      turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? "",
      setupNeeded: setupNeeded(req, env),
    },
    version,
    latest,
  });
}

// ---- boards -------------------------------------------------------------

async function listBoards(env: Env, admin: boolean) {
  const { results } = admin
    ? await env.DB.prepare("select * from boards order by created_at desc").all<Board>()
    : await env.DB.prepare("select * from boards where visibility = 'public' order by created_at desc").all<Board>();
  return json(results.map(boardView));
}

async function createBoard(req: Request, env: Env, admin: boolean) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id.trim().toLowerCase() : "";
  if (!BOARD_ID.test(id)) return json({ error: "invalid_id" }, 400);
  const name = requiredText(body.name, 100);
  if (!name) return json({ error: "invalid_name" }, 400);
  const visibility = cleanVisibility(body.visibility);
  if (!visibility) return json({ error: "invalid_visibility" }, 400);
  const allowedDomains = cleanDomains(body.allowedDomains);
  if (allowedDomains === null) return json({ error: "invalid_domains" }, 400);
  const secret = randomToken(32);
  const now = Date.now();
  const r = await env.DB.prepare("insert into boards (id, name, visibility, sso_secret, allowed_domains, created_at) values (?, ?, ?, ?, ?, ?) on conflict do nothing")
    .bind(id, name, visibility, secret, allowedDomains, now)
    .run();
  if (!r.meta.changes) return json({ error: "board_exists" }, 409);
  return json(boardView({ id, name, visibility, sso_secret: secret, allowed_domains: allowedDomains, created_at: now }), 201);
}

async function updateBoard(req: Request, env: Env, admin: boolean, id: string) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = body.name === undefined ? board.name : requiredText(body.name, 100);
  if (!name) return json({ error: "invalid_name" }, 400);
  const visibility = body.visibility === undefined ? board.visibility : cleanVisibility(body.visibility);
  if (!visibility) return json({ error: "invalid_visibility" }, 400);
  const allowedDomains = body.allowedDomains === undefined ? board.allowed_domains : cleanDomains(body.allowedDomains);
  if (allowedDomains === null) return json({ error: "invalid_domains" }, 400);
  await env.DB.prepare("update boards set name = ?, visibility = ?, allowed_domains = ? where id = ?").bind(name, visibility, allowedDomains, id).run();
  return json(boardView({ ...board, name, visibility, allowed_domains: allowedDomains }));
}

async function rotateSecret(env: Env, admin: boolean, id: string) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  const secret = randomToken(32);
  await env.DB.prepare("update boards set sso_secret = ? where id = ?").bind(secret, id).run();
  return json({ secret });
}

async function boardSso(env: Env, admin: boolean, id: string, url: URL) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  return json({ boardId: board.id, secret: board.sso_secret, audience: url.origin });
}

async function getBoardInfo(env: Env, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  if (!(await canSee(env, board, user, admin))) return teamOnly(board);
  return json({ id: board.id, name: board.name, visibility: board.visibility, canSee: true });
}

// ---- posts ----------------------------------------------------------------

async function listPosts(env: Env, url: URL, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  if (!(await canSee(env, board, user, admin))) return teamOnly(board);
  const status = url.searchParams.get("status");
  if (status && !cleanStatus(status)) return json({ error: "invalid_status" }, 400);
  const sort = url.searchParams.get("sort") === "new" ? "p.created_at desc" : "p.votes desc, p.created_at desc";
  const sql =
    `select p.id, p.title, p.status, p.votes, p.comments, p.created_at, u.name as author,` +
    ` exists(select 1 from votes v where v.post_id = p.id and v.user_id = ?) as voted` +
    ` from posts p join users u on u.id = p.user_id where p.board_id = ?` +
    (status ? " and p.status = ?" : "") +
    ` order by ${sort} limit 200`;
  const params = status ? [user?.id ?? -1, board.id, status] : [user?.id ?? -1, board.id];
  const { results } = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();
  return json(results.map((r) => ({ id: r.id, title: r.title, status: r.status, votes: r.votes, comments: r.comments, createdAt: r.created_at, author: r.author, voted: Boolean(r.voted) })));
}

async function createPost(req: Request, env: Env, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  if (!user) return json({ error: "sign_in" }, 401);
  if (!(await canSee(env, board, user, admin))) return teamOnly(board);
  const setup = turnstileSetupNeeded(req, env);
  if (setup) return json({ error: "setup_needed" }, 503);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = requiredText(body.title, 120);
  if (!title) return json({ error: "invalid_title" }, 400);
  const text = optionalText(body.body, 2000);
  if (text === undefined) return json({ error: "invalid_body" }, 400);
  if (!(await verifyTurnstile(body.turnstile, req, env))) return json({ error: "turnstile_failed" }, 400);
  const now = Date.now();
  const row = await env.DB.prepare("insert into posts (board_id, user_id, title, body, status, votes, comments, created_at) values (?, ?, ?, ?, 'open', 0, 0, ?) returning id")
    .bind(board.id, user.id, title, text, now)
    .first<{ id: number }>();
  return json({ id: row!.id, title, body: text, status: "open", votes: 0, comments: 0, createdAt: now, author: user.name, voted: false }, 201);
}

async function getPost(env: Env, id: number, user: User | null, admin: boolean) {
  const post = await env.DB.prepare(
    "select p.id, p.title, p.body, p.status, p.votes, p.comments, p.created_at, p.board_id, u.name as author from posts p join users u on u.id = p.user_id where p.id = ?",
  )
    .bind(id)
    .first<{ id: number; title: string; body: string | null; status: string; votes: number; comments: number; created_at: number; board_id: string; author: string }>();
  if (!post) return json({ error: "not_found" }, 404);
  const board = await getBoard(env, post.board_id);
  if (!board) return json({ error: "not_found" }, 404);
  if (!(await canSee(env, board, user, admin))) return teamOnly(board);
  const voted = user ? Boolean(await env.DB.prepare("select 1 from votes where post_id = ? and user_id = ?").bind(id, user.id).first()) : false;
  const { results: comments } = await env.DB.prepare(
    "select c.id, c.body, c.created_at, u.name as author from comments c join users u on u.id = c.user_id where c.post_id = ? order by c.created_at limit 200",
  )
    .bind(id)
    .all<{ id: number; body: string; created_at: number; author: string }>();
  return json({
    post: { id: post.id, title: post.title, body: post.body, status: post.status, votes: post.votes, comments: post.comments, createdAt: post.created_at, author: post.author, voted },
    board: { id: board.id, name: board.name, visibility: board.visibility },
    comments: comments.map((c) => ({ id: c.id, body: c.body, author: c.author, createdAt: c.created_at })),
  });
}

async function withPostBoard(env: Env, id: number) {
  const post = await env.DB.prepare("select id, board_id from posts where id = ?").bind(id).first<{ id: number; board_id: string }>();
  if (!post) return null;
  const board = await getBoard(env, post.board_id);
  return board ? { post, board } : null;
}

async function votePost(req: Request, env: Env, id: number, user: User | null, admin: boolean) {
  const hit = await withPostBoard(env, id);
  if (!hit) return json({ error: "not_found" }, 404);
  if (!user) return json({ error: "sign_in" }, 401);
  if (!(await canSee(env, hit.board, user, admin))) return teamOnly(hit.board);
  const setup = turnstileSetupNeeded(req, env);
  if (setup) return json({ error: "setup_needed" }, 503);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!(await verifyTurnstile(body.turnstile, req, env))) return json({ error: "turnstile_failed" }, 400);
  const [inserted] = await env.DB.batch([
    env.DB.prepare("insert into votes (post_id, user_id, created_at) values (?, ?, ?) on conflict (post_id, user_id) do nothing").bind(id, user.id, Date.now()),
    env.DB.prepare("update posts set votes = (select count(*) from votes where post_id = ?) where id = ?").bind(id, id),
  ]);
  if (!inserted.meta.changes) return json({ error: "already_voted" }, 409);
  return json({ ok: true });
}

async function addComment(req: Request, env: Env, id: number, user: User | null, admin: boolean) {
  const hit = await withPostBoard(env, id);
  if (!hit) return json({ error: "not_found" }, 404);
  if (!user) return json({ error: "sign_in" }, 401);
  if (!(await canSee(env, hit.board, user, admin))) return teamOnly(hit.board);
  const setup = turnstileSetupNeeded(req, env);
  if (setup) return json({ error: "setup_needed" }, 503);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const text = requiredText(body.body, 1000);
  if (!text) return json({ error: "invalid_body" }, 400);
  if (!(await verifyTurnstile(body.turnstile, req, env))) return json({ error: "turnstile_failed" }, 400);
  const now = Date.now();
  const [row] = await env.DB.batch([
    env.DB.prepare("insert into comments (post_id, user_id, body, created_at) values (?, ?, ?, ?) returning id").bind(id, user.id, text, now),
    env.DB.prepare("update posts set comments = (select count(*) from comments where post_id = ?) where id = ?").bind(id, id),
  ]);
  const created = row.results[0] as { id: number } | undefined;
  return json({ id: created?.id, body: text, author: user.name, createdAt: now }, 201);
}

async function updatePostStatus(req: Request, env: Env, admin: boolean, id: number) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const body = (await req.json().catch(() => ({}))) as { status?: unknown };
  const status = cleanStatus(body.status);
  if (!status) return json({ error: "invalid_status" }, 400);
  const r = await env.DB.prepare("update posts set status = ? where id = ?").bind(status, id).run();
  if (!r.meta.changes) return json({ error: "not_found" }, 404);
  return json({ ok: true, status });
}

async function deletePost(env: Env, admin: boolean, id: number) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const post = await env.DB.prepare("select id from posts where id = ?").bind(id).first();
  if (!post) return json({ error: "not_found" }, 404);
  await env.DB.batch([
    env.DB.prepare("delete from votes where post_id = ?").bind(id),
    env.DB.prepare("delete from comments where post_id = ?").bind(id),
    env.DB.prepare("delete from posts where id = ?").bind(id),
  ]);
  return json({ ok: true });
}

async function mergePost(req: Request, env: Env, admin: boolean, id: number) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const body = (await req.json().catch(() => ({}))) as { into?: unknown };
  const into = Number(body.into);
  if (!Number.isInteger(into) || into === id) return json({ error: "invalid_target" }, 400);
  const [source, target] = await Promise.all([
    env.DB.prepare("select id, board_id from posts where id = ?").bind(id).first<{ id: number; board_id: string }>(),
    env.DB.prepare("select id, board_id from posts where id = ?").bind(into).first<{ id: number; board_id: string }>(),
  ]);
  if (!source || !target) return json({ error: "not_found" }, 404);
  if (source.board_id !== target.board_id) return json({ error: "different_board" }, 400);
  await env.DB.batch([
    env.DB.prepare("insert into votes (post_id, user_id, created_at) select ?, user_id, created_at from votes where post_id = ? on conflict (post_id, user_id) do nothing").bind(into, id),
    env.DB.prepare("delete from votes where post_id = ?").bind(id),
    env.DB.prepare("update comments set post_id = ? where post_id = ?").bind(into, id),
    env.DB.prepare("delete from posts where id = ?").bind(id),
    env.DB.prepare("update posts set votes = (select count(*) from votes where post_id = ?), comments = (select count(*) from comments where post_id = ?) where id = ?").bind(into, into, into),
  ]);
  return json({ ok: true, id: into });
}

async function deleteComment(env: Env, admin: boolean, id: number) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const comment = await env.DB.prepare("select id, post_id from comments where id = ?").bind(id).first<{ id: number; post_id: number }>();
  if (!comment) return json({ error: "not_found" }, 404);
  await env.DB.batch([
    env.DB.prepare("delete from comments where id = ?").bind(id),
    env.DB.prepare("update posts set comments = (select count(*) from comments where post_id = ?) where id = ?").bind(comment.post_id, comment.post_id),
  ]);
  return json({ ok: true });
}

// ---- routing ----------------------------------------------------------------

const BOARD_POSTS = /^\/api\/boards\/([a-z0-9-]{2,40})\/posts$/;
const BOARD_ROTATE = /^\/api\/boards\/([a-z0-9-]{2,40})\/rotate-secret$/;
const BOARD_SSO = /^\/api\/boards\/([a-z0-9-]{2,40})\/sso$/;
const BOARD_ONE = /^\/api\/boards\/([a-z0-9-]{2,40})$/;
const POST_VOTE = /^\/api\/posts\/(\d+)\/vote$/;
const POST_COMMENTS = /^\/api\/posts\/(\d+)\/comments$/;
const POST_MERGE = /^\/api\/posts\/(\d+)\/merge$/;
const POST_ONE = /^\/api\/posts\/(\d+)$/;
const COMMENT_ONE = /^\/api\/comments\/(\d+)$/;

export async function api(req: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  const { method } = req;
  const user = await currentUser(req, env);
  const admin = isAdmin(env, user);
  let m: RegExpMatchArray | null;

  if (path === "/api/boards" && method === "GET") return listBoards(env, admin);
  if (path === "/api/boards" && method === "POST") return createBoard(req, env, admin);
  if ((m = path.match(BOARD_ROTATE)) && method === "POST") return rotateSecret(env, admin, m[1]);
  if ((m = path.match(BOARD_SSO)) && method === "GET") return boardSso(env, admin, m[1], url);
  if ((m = path.match(BOARD_POSTS)) && method === "GET") return listPosts(env, url, m[1], user, admin);
  if ((m = path.match(BOARD_POSTS)) && method === "POST") return createPost(req, env, m[1], user, admin);
  if ((m = path.match(BOARD_ONE)) && method === "GET") return getBoardInfo(env, m[1], user, admin);
  if ((m = path.match(BOARD_ONE)) && method === "PATCH") return updateBoard(req, env, admin, m[1]);
  if ((m = path.match(POST_VOTE)) && method === "POST") return votePost(req, env, Number(m[1]), user, admin);
  if ((m = path.match(POST_COMMENTS)) && method === "POST") return addComment(req, env, Number(m[1]), user, admin);
  if ((m = path.match(POST_MERGE)) && method === "POST") return mergePost(req, env, admin, Number(m[1]));
  if ((m = path.match(POST_ONE)) && method === "GET") return getPost(env, Number(m[1]), user, admin);
  if ((m = path.match(POST_ONE)) && method === "PATCH") return updatePostStatus(req, env, admin, Number(m[1]));
  if ((m = path.match(POST_ONE)) && method === "DELETE") return deletePost(env, admin, Number(m[1]));
  if ((m = path.match(COMMENT_ONE)) && method === "DELETE") return deleteComment(env, admin, Number(m[1]));
  return json({ error: "not_found" }, 404);
}
