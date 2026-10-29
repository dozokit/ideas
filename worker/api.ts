import type { Env } from "./index";
import { currentUser } from "./auth";
import { changePassword, isAdmin, setupNeeded } from "./admin";
import { getBoard, access, BOARD_ID, type Board } from "./boards";
import { b64url, hmacSign, randomToken } from "./crypto";
import type { User } from "./users";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

const BUILT_IN_STATUSES = ["open", "planned", "in_progress", "done"];

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

// Nothing given means none; given but not a data URL of a PNG, JPEG, SVG or WebP up to 200 KB is undefined.
function cleanLogo(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  const m = typeof raw === "string" ? raw.match(/^data:image\/(?:png|jpeg|svg\+xml|webp);base64,([A-Za-z0-9+/]+={0,2})$/) : null;
  return m && m[1].length * 0.75 <= 200 * 1024 ? (raw as string) : undefined;
}

function cleanColor(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  return typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : undefined;
}

// 1 to 20 statuses [{id, label}] with distinct ids. Only the four built-in ids may have an empty
// label (they then show their translated name).
function cleanStatuses(raw: unknown): { id: string; label: string }[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) return null;
  const out = raw.map((s) => ({ id: s?.id, label: typeof s?.label === "string" ? s.label.trim() : null }));
  const ok = out.every(({ id, label }) => typeof id === "string" && /^[\w-]{1,40}$/.test(id) && label !== null && label.length <= 40 && (label || BUILT_IN_STATUSES.includes(id)));
  return ok && new Set(out.map((s) => s.id)).size === out.length ? (out as { id: string; label: string }[]) : null;
}

const cleanVisibility = (raw: unknown) => (raw === "public" || raw === "team" ? raw : null);

const boardView = (b: Board) => ({ id: b.id, name: b.name, visibility: b.visibility, statuses: JSON.parse(b.statuses), logo: b.logo, color: b.color, productName: b.product_name, productUrl: b.product_url, createdAt: b.created_at });
const teamOnly = () => json({ error: "team_only" }, 403);
const membersOnly = () => json({ error: "members_only" }, 403);

// This copy's release. Raise it with each tag on github.com/dozokit/ideas (v1.2.1) and its CHANGELOG.md entry.
const VERSION = "1.2.1";

// This copy's random id and whether it checks for new versions, made on first use.
async function install(env: Env) {
  await env.DB.prepare("insert or ignore into install (id, uid) values (1, ?)").bind(crypto.randomUUID()).run();
  return (await env.DB.prepare("select uid, share from install where id = 1").first<{ uid: string; share: number }>())!;
}

// The newest release, when it is newer than this copy. dozokit.com is asked at most once a day per
// Cloudflare location (an hour after a failure) and counts this copy: its version and random id,
// nothing else. Offline means no answer; with the check turned off, nothing is asked.
async function version(env: Env) {
  const { uid, share } = await install(env);
  let latest: string | null = null;
  if (!share) return json({ version: VERSION, latest, share: false });
  try {
    const res = await fetch(`https://dozokit.com/api/latest?app=ideas&v=${VERSION}&id=${uid}`, {
      headers: { "user-agent": "dozokit-ideas" },
      signal: AbortSignal.timeout(3000),
      cf: { cacheTtlByStatus: { "200-299": 24 * 3600, "300-599": 3600 }, cacheEverything: true },
    });
    const tag = res.ok ? String(((await res.json()) as { latest?: string }).latest ?? "") : "";
    const [a, b] = [tag, VERSION].map((v) => v.split(".").map(Number));
    const i = a.findIndex((n, k) => n !== b[k]);
    if (/^\d+\.\d+\.\d+$/.test(tag) && i !== -1 && a[i] > b[i]) latest = tag;
  } catch {}
  return json({ version: VERSION, latest, share: true });
}

async function setShare(req: Request, env: Env) {
  const { share } = (await req.json().catch(() => ({}))) as { share?: unknown };
  if (typeof share !== "boolean") return json({ error: "invalid" }, 400);
  await install(env);
  await env.DB.prepare("update install set share = ? where id = 1").bind(share ? 1 : 0).run();
  return json({ share });
}

export async function me(req: Request, env: Env) {
  const user = await currentUser(req, env);
  return json({
    user: user ? { id: user.id, name: user.name, email: user.email } : null,
    admin: await isAdmin(req, env),
    config: { setupNeeded: setupNeeded(env) },
  });
}

// ---- boards -------------------------------------------------------------

// The admin also gets each board's number of ideas.
async function listBoards(env: Env, admin: boolean) {
  if (admin) {
    const { results } = await env.DB.prepare("select b.*, (select count(*) from posts p where p.board_id = b.id) as ideas from boards b order by created_at desc").all<Board & { ideas: number }>();
    return json(results.map((b) => ({ ...boardView(b), ideas: b.ideas })));
  }
  const { results } = await env.DB.prepare("select * from boards where visibility = 'public' order by created_at desc").all<Board>();
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
  const logo = cleanLogo(body.logo);
  if (logo === undefined) return json({ error: "invalid_logo" }, 400);
  const color = cleanColor(body.color);
  if (color === undefined) return json({ error: "invalid_color" }, 400);
  const board = await env.DB.prepare("insert into boards (id, name, visibility, sso_secret, logo, color, created_at) values (?, ?, ?, ?, ?, ?, ?) on conflict do nothing returning *")
    .bind(id, name, visibility, randomToken(32), logo, color, Date.now())
    .first<Board>();
  if (!board) return json({ error: "board_exists" }, 409);
  return json(boardView(board), 201);
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
  const logo = body.logo === undefined ? board.logo : cleanLogo(body.logo);
  if (logo === undefined) return json({ error: "invalid_logo" }, 400);
  const color = body.color === undefined ? board.color : cleanColor(body.color);
  if (color === undefined) return json({ error: "invalid_color" }, 400);
  const statuses = body.statuses === undefined ? JSON.parse(board.statuses) : cleanStatuses(body.statuses);
  if (!statuses) return json({ error: "invalid_statuses" }, 400);
  const productName = body.productName === undefined ? board.product_name : optionalText(body.productName, 100);
  if (productName === undefined) return json({ error: "invalid_product_name" }, 400);
  // Shown as a link to visitors, so https only.
  const productUrl = body.productUrl === undefined ? board.product_url : optionalText(body.productUrl, 500);
  if (productUrl === undefined || (productUrl && !/^https:\/\/[^\s/]+\S*$/i.test(productUrl))) return json({ error: "invalid_product_url" }, 400);
  const list = JSON.stringify(statuses);
  await env.DB.batch([
    env.DB.prepare("update boards set name = ?, visibility = ?, logo = ?, color = ?, statuses = ?, product_name = ?, product_url = ? where id = ?").bind(name, visibility, logo, color, list, productName, productUrl, id),
    // The ideas of a removed status move to the first one.
    env.DB.prepare("update posts set status = ? where board_id = ? and status not in (select json_extract(value, '$.id') from json_each(?))").bind(statuses[0].id, id, list),
    // The team user's name follows the board's.
    env.DB.prepare("update users set name = ? where provider = 'sso' and ext_id = ?").bind(`${name} team`, `__team:${id}`),
  ]);
  return json(boardView({ ...board, name, visibility, logo, color, statuses: list, product_name: productName, product_url: productUrl }));
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

// "Open as a test person": a signed link minted here for a made-up member, so the admin sees the
// board exactly as the people their product sends in.
async function testLink(env: Env, admin: boolean, id: string, url: URL) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  const part = (o: object) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const claims = { iss: board.id, aud: url.origin, sub: "dozokit-test", name: "Test person", email: "test@example.com", exp: Math.floor(Date.now() / 1000) + 60, jti: crypto.randomUUID() };
  const signed = `${part({ alg: "HS256" })}.${part(claims)}`;
  const location = `/sso?token=${signed}.${await hmacSign(signed, board.sso_secret)}&return_to=/b/${board.id}`;
  return new Response(null, { status: 302, headers: { location, "referrer-policy": "no-referrer", "cache-control": "no-store" } });
}

async function getBoardInfo(env: Env, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  const { see, member } = await access(env, board, user, admin);
  if (!see) return teamOnly();
  return json({ ...boardView(board), member });
}

// Up to 3 ideas of this board that match what someone is typing as a new idea's title. Each word
// of q becomes a prefix term, OR'd; only letters and digits are kept, so nothing in it is FTS syntax.
async function similarPosts(env: Env, url: URL, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  if (!(await access(env, board, user, admin)).see) return teamOnly();
  const words = (url.searchParams.get("q") ?? "").toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, 12) ?? [];
  if (!words.length) return json([]);
  const { results } = await env.DB.prepare(
    "select p.id, p.title, p.votes from posts_fts join posts p on p.id = posts_fts.rowid where posts_fts match ? and p.board_id = ? order by bm25(posts_fts) limit 3",
  )
    .bind(words.map((w) => `"${w}"*`).join(" OR "), board.id)
    .all();
  return json(results);
}

// ---- posts ----------------------------------------------------------------

async function listPosts(env: Env, url: URL, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  const { see, user: actor } = await access(env, board, user, admin);
  if (!see) return teamOnly();
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort") === "new" ? "p.created_at desc" : "p.votes desc, p.created_at desc";
  const sql =
    `select p.id, p.title, p.status, p.votes, p.comments, p.created_at, u.name as author,` +
    ` exists(select 1 from votes v where v.post_id = p.id and v.user_id = ?) as voted` +
    ` from posts p join users u on u.id = p.user_id where p.board_id = ?` +
    (status ? " and p.status = ?" : "") +
    ` order by ${sort} limit 200`;
  const params = status ? [actor?.id ?? -1, board.id, status] : [actor?.id ?? -1, board.id];
  const { results } = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();
  return json(results.map((r) => ({ id: r.id, title: r.title, status: r.status, votes: r.votes, comments: r.comments, createdAt: r.created_at, author: r.author, voted: Boolean(r.voted) })));
}

async function createPost(req: Request, env: Env, id: string, user: User | null, admin: boolean) {
  const board = await getBoard(env, id);
  if (!board) return json({ error: "not_found" }, 404);
  const { see, member, user: actor } = await access(env, board, user, admin);
  if (!see) return teamOnly();
  if (!actor || !member) return membersOnly();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = requiredText(body.title, 120);
  if (!title) return json({ error: "invalid_title" }, 400);
  const text = optionalText(body.body, 2000);
  if (text === undefined) return json({ error: "invalid_body" }, 400);
  const status = JSON.parse(board.statuses)[0].id;
  const now = Date.now();
  // Its author votes for it, in the same batch.
  const [row] = await env.DB.batch([
    env.DB.prepare("insert into posts (board_id, user_id, title, body, status, votes, comments, created_at) values (?, ?, ?, ?, ?, 1, 0, ?) returning id").bind(board.id, actor.id, title, text, status, now),
    env.DB.prepare("insert into votes (post_id, user_id, created_at) values (last_insert_rowid(), ?, ?)").bind(actor.id, now),
  ]);
  return json({ id: (row.results[0] as { id: number }).id, title, body: text, status, votes: 1, comments: 0, createdAt: now, author: actor.name, voted: true }, 201);
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
  const { see, member, user: actor } = await access(env, board, user, admin);
  if (!see) return teamOnly();
  const voted = actor ? Boolean(await env.DB.prepare("select 1 from votes where post_id = ? and user_id = ?").bind(id, actor.id).first()) : false;
  // The team user's comments are the board's official answers.
  const { results: comments } = await env.DB.prepare(
    "select c.id, c.body, c.created_at, u.name as author, u.ext_id = ? as official from comments c join users u on u.id = c.user_id where c.post_id = ? order by c.created_at limit 200",
  )
    .bind(`__team:${board.id}`, id)
    .all<{ id: number; body: string; created_at: number; author: string; official: number }>();
  return json({
    post: { id: post.id, title: post.title, body: post.body, status: post.status, votes: post.votes, comments: post.comments, createdAt: post.created_at, author: post.author, voted },
    board: boardView(board),
    member,
    comments: comments.map((c) => ({ id: c.id, body: c.body, author: c.author, official: Boolean(c.official), createdAt: c.created_at })),
  });
}

async function withPostBoard(env: Env, id: number) {
  const post = await env.DB.prepare("select id, board_id from posts where id = ?").bind(id).first<{ id: number; board_id: string }>();
  if (!post) return null;
  const board = await getBoard(env, post.board_id);
  return board ? { post, board } : null;
}

async function votePost(env: Env, id: number, user: User | null, admin: boolean) {
  const hit = await withPostBoard(env, id);
  if (!hit) return json({ error: "not_found" }, 404);
  const { see, member, user: actor } = await access(env, hit.board, user, admin);
  if (!see) return teamOnly();
  if (!actor || !member) return membersOnly();
  const [inserted] = await env.DB.batch([
    env.DB.prepare("insert into votes (post_id, user_id, created_at) values (?, ?, ?) on conflict (post_id, user_id) do nothing").bind(id, actor.id, Date.now()),
    env.DB.prepare("update posts set votes = (select count(*) from votes where post_id = ?) where id = ?").bind(id, id),
  ]);
  if (!inserted.meta.changes) return json({ error: "already_voted" }, 409);
  return json({ ok: true });
}

async function unvotePost(env: Env, id: number, user: User | null, admin: boolean) {
  const hit = await withPostBoard(env, id);
  if (!hit) return json({ error: "not_found" }, 404);
  const { see, member, user: actor } = await access(env, hit.board, user, admin);
  if (!see) return teamOnly();
  if (!actor || !member) return membersOnly();
  await env.DB.batch([
    env.DB.prepare("delete from votes where post_id = ? and user_id = ?").bind(id, actor.id),
    env.DB.prepare("update posts set votes = (select count(*) from votes where post_id = ?) where id = ?").bind(id, id),
  ]);
  return json({ ok: true });
}

async function addComment(req: Request, env: Env, id: number, user: User | null, admin: boolean) {
  const hit = await withPostBoard(env, id);
  if (!hit) return json({ error: "not_found" }, 404);
  const { see, member, user: actor } = await access(env, hit.board, user, admin);
  if (!see) return teamOnly();
  if (!actor || !member) return membersOnly();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const text = requiredText(body.body, 1000);
  if (!text) return json({ error: "invalid_body" }, 400);
  const now = Date.now();
  const [row] = await env.DB.batch([
    env.DB.prepare("insert into comments (post_id, user_id, body, created_at) values (?, ?, ?, ?) returning id").bind(id, actor.id, text, now),
    env.DB.prepare("update posts set comments = (select count(*) from comments where post_id = ?) where id = ?").bind(id, id),
  ]);
  const created = row.results[0] as { id: number } | undefined;
  return json({ id: created?.id, body: text, author: actor.name, official: actor.ext_id === `__team:${hit.board.id}`, createdAt: now }, 201);
}

async function updatePostStatus(req: Request, env: Env, admin: boolean, id: number) {
  if (!admin) return json({ error: "admin_only" }, 403);
  const hit = await withPostBoard(env, id);
  if (!hit) return json({ error: "not_found" }, 404);
  const { status } = (await req.json().catch(() => ({}))) as { status?: unknown };
  if (!(JSON.parse(hit.board.statuses) as { id: string }[]).some((s) => s.id === status)) return json({ error: "invalid_status" }, 400);
  await env.DB.prepare("update posts set status = ? where id = ?").bind(status, id).run();
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
const BOARD_TEST = /^\/api\/boards\/([a-z0-9-]{2,40})\/test$/;
const BOARD_SIMILAR = /^\/api\/boards\/([a-z0-9-]{2,40})\/similar$/;
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
  const admin = await isAdmin(req, env);
  let m: RegExpMatchArray | null;

  if (path === "/api/password" && method === "POST") return admin ? changePassword(req, env) : json({ error: "admin_only" }, 403);
  if (path === "/api/version" && method === "GET") return admin ? version(env) : json({ error: "admin_only" }, 403);
  if (path === "/api/version" && method === "PUT") return admin ? setShare(req, env) : json({ error: "admin_only" }, 403);
  if (path === "/api/boards" && method === "GET") return listBoards(env, admin);
  if (path === "/api/boards" && method === "POST") return createBoard(req, env, admin);
  if ((m = path.match(BOARD_ROTATE)) && method === "POST") return rotateSecret(env, admin, m[1]);
  if ((m = path.match(BOARD_SSO)) && method === "GET") return boardSso(env, admin, m[1], url);
  if ((m = path.match(BOARD_TEST)) && method === "GET") return testLink(env, admin, m[1], url);
  if ((m = path.match(BOARD_SIMILAR)) && method === "GET") return similarPosts(env, url, m[1], user, admin);
  if ((m = path.match(BOARD_POSTS)) && method === "GET") return listPosts(env, url, m[1], user, admin);
  if ((m = path.match(BOARD_POSTS)) && method === "POST") return createPost(req, env, m[1], user, admin);
  if ((m = path.match(BOARD_ONE)) && method === "GET") return getBoardInfo(env, m[1], user, admin);
  if ((m = path.match(BOARD_ONE)) && method === "PATCH") return updateBoard(req, env, admin, m[1]);
  if ((m = path.match(POST_VOTE)) && method === "POST") return votePost(env, Number(m[1]), user, admin);
  if ((m = path.match(POST_VOTE)) && method === "DELETE") return unvotePost(env, Number(m[1]), user, admin);
  if ((m = path.match(POST_COMMENTS)) && method === "POST") return addComment(req, env, Number(m[1]), user, admin);
  if ((m = path.match(POST_MERGE)) && method === "POST") return mergePost(req, env, admin, Number(m[1]));
  if ((m = path.match(POST_ONE)) && method === "GET") return getPost(env, Number(m[1]), user, admin);
  if ((m = path.match(POST_ONE)) && method === "PATCH") return updatePostStatus(req, env, admin, Number(m[1]));
  if ((m = path.match(POST_ONE)) && method === "DELETE") return deletePost(env, admin, Number(m[1]));
  if ((m = path.match(COMMENT_ONE)) && method === "DELETE") return deleteComment(env, admin, Number(m[1]));
  return json({ error: "not_found" }, 404);
}
