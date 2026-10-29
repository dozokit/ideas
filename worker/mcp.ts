import type { Env } from "./index";
import { getBoard, statusesOf, type Board } from "./boards";
import { boardsOrigin, sha256, VERSION, type PostRow } from "./api";

// /mcp: one board's ideas and bug reports, read-only, for any MCP client a developer uses (Claude Code,
// Cursor, ChatGPT…). MCP's Streamable HTTP transport, stateless: each POST is one
// JSON-RPC message, answered with plain JSON. The board is the one the bearer token was made for (board
// Settings → Connect to your product → For your developers); nothing here can change a post.

const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

// The built-in statuses' English names, for statuses the admin left unnamed.
const NAMES: Record<string, string> = { open: "Open", planned: "Planned", in_progress: "In progress", done: "Done", new: "New", confirmed: "Confirmed", fixing: "Fixing", fixed: "Fixed" };
const label = (s: { id: string; label: string }) => s.label || NAMES[s.id] || s.id;

const type = { type: "string", enum: ["idea", "bug"], description: "Only ideas, or only bug reports. Leave out for both." };
const status = { type: "string", description: "Only posts in this status, by its name as the board shows it (e.g. Planned, Confirmed, Fixing)." };
const limit = (n: number) => ({ type: "integer", minimum: 1, maximum: 200, description: `How many, ${n} if left out.` });

const TOOLS = [
  { name: "list_posts", description: "The board's newest ideas and bug reports, with their status, votes and number of comments.", inputSchema: { type: "object", properties: { type, status, limit: limit(50) } } },
  { name: "top_posts", description: "The most voted ideas and bug reports: what the board's people want or are bothered by most.", inputSchema: { type: "object", properties: { type, status, limit: limit(20) } } },
  { name: "search_posts", description: "Ideas and bug reports whose title or text match these words.", inputSchema: { type: "object", properties: { query: { type: "string" }, type, limit: limit(20) }, required: ["query"] } },
  { name: "get_post", description: "One idea or bug report in full: its text, what was expected and where (bugs), votes, status and every comment.", inputSchema: { type: "object", properties: { id: { type: "integer" } }, required: ["id"] } },
].map((t) => ({ ...t, annotations: { readOnlyHint: true } }));

type Args = Record<string, unknown>;

function row(board: Board, origin: string, p: PostRow) {
  const s = statusesOf(board, p.type).find((x) => x.id === p.status);
  return { id: p.id, type: p.type, title: p.title, status: s ? label(s) : p.status, votes: p.votes, comments: p.comments, author: p.author, created: new Date(p.created_at).toISOString().slice(0, 10), url: `${origin}/b/${board.id}/p/${p.id}` };
}

// The status ids whose name (or id) is `name`, among the given type's statuses or both types'.
function statusIds(board: Board, kind: string | undefined, name: string) {
  const all = kind ? statusesOf(board, kind) : [...statusesOf(board, "idea"), ...statusesOf(board, "bug")];
  return all.filter((s) => [label(s), s.id].some((x) => x.toLowerCase() === name.trim().toLowerCase())).map((s) => s.id);
}

const SELECT = "select p.*, u.name as author from posts p join users u on u.id = p.user_id";

async function posts(env: Env, board: Board, args: Args, order: string, fallback: number) {
  const kind = args.type === "idea" || args.type === "bug" ? args.type : undefined;
  const ids = typeof args.status === "string" ? statusIds(board, kind, args.status) : null;
  if (ids && !ids.length) throw new Error(`No status is called "${args.status}". This board's statuses: ideas ${statusesOf(board, "idea").map(label).join(", ")}; bugs ${statusesOf(board, "bug").map(label).join(", ")}.`);
  const n = Math.min(Math.max(Number(args.limit) || fallback, 1), 200);
  const sql = `${SELECT} where p.board_id = ?` + (kind ? " and p.type = ?" : "") + (ids ? ` and p.status in (${ids.map(() => "?").join(", ")})` : "") + ` order by ${order} limit ?`;
  const { results } = await env.DB.prepare(sql).bind(board.id, ...(kind ? [kind] : []), ...(ids ?? []), n).all<PostRow>();
  return results;
}

// Same search as "Already suggested?" on the board: each word a prefix, OR'd, letters and digits only.
async function search(env: Env, board: Board, args: Args) {
  const words = String(args.query ?? "").toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, 12) ?? [];
  if (!words.length) throw new Error("Give a few words to search for.");
  const kind = args.type === "idea" || args.type === "bug" ? args.type : undefined;
  const n = Math.min(Math.max(Number(args.limit) || 20, 1), 200);
  const { results } = await env.DB.prepare(
    `${SELECT} join posts_fts on posts_fts.rowid = p.id where posts_fts match ? and p.board_id = ?` + (kind ? " and p.type = ?" : "") + " order by bm25(posts_fts) limit ?",
  )
    .bind(words.map((w) => `"${w}"*`).join(" OR "), board.id, ...(kind ? [kind] : []), n)
    .all<PostRow>();
  return results;
}

async function onePost(env: Env, board: Board, origin: string, id: unknown) {
  const p = await env.DB.prepare(`${SELECT} where p.id = ? and p.board_id = ?`).bind(Number(id), board.id).first<PostRow>();
  if (!p) throw new Error(`No post ${id} on this board.`);
  const { results } = await env.DB.prepare(
    "select c.body, c.created_at, u.name as author, u.ext_id = ? as official from comments c join users u on u.id = c.user_id where c.post_id = ? order by c.created_at limit 200",
  )
    .bind(`__team:${board.id}`, p.id)
    .all<{ body: string; created_at: number; author: string; official: number }>();
  return {
    ...row(board, origin, p),
    body: p.body,
    ...(p.type === "bug" ? { expected: p.expected, where: p.place, screenshot: p.screenshot ? "yes, open the url to see it" : null } : {}),
    comments: results.map((c) => ({ author: c.author, official: Boolean(c.official), date: new Date(c.created_at).toISOString().slice(0, 10), body: c.body })),
  };
}

async function call(env: Env, board: Board, origin: string, name: unknown, args: Args) {
  const rows = (ps: PostRow[]) => ps.map((p) => row(board, origin, p));
  if (name === "list_posts") return rows(await posts(env, board, args, "p.created_at desc", 50));
  if (name === "top_posts") return rows(await posts(env, board, args, "p.votes desc, p.created_at desc", 20));
  if (name === "search_posts") return rows(await search(env, board, args));
  if (name === "get_post") return onePost(env, board, origin, args.id);
  throw new Error(`Unknown tool ${name}.`);
}

export async function mcp(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
  const rpc = (id: unknown, body: object, status = 200) => Response.json({ jsonrpc: "2.0", id: id ?? null, ...body }, { status, headers: { "cache-control": "no-store" } });

  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const hash = token ? await sha256(token) : null;
  const found = hash ? await env.DB.prepare("select board_id from tokens where hash = ?").bind(hash).first<{ board_id: string }>() : null;
  const board = found ? await getBoard(env, found.board_id) : null;
  if (!board) return rpc(null, { error: { code: -32001, message: "Unknown or revoked token. Make one in the board's Settings → Connect to your product → For your developers." } }, 401);

  const msg = (await req.json().catch(() => null)) as { id?: unknown; method?: unknown; params?: Record<string, unknown> } | null;
  if (!msg || typeof msg.method !== "string") return rpc(null, { error: { code: -32700, message: "Send one JSON-RPC message." } }, 400);
  // A notification (no id), like notifications/initialized: nothing to answer.
  if (msg.id === undefined) return new Response(null, { status: 202 });

  if (msg.method === "initialize") {
    const asked = String(msg.params?.protocolVersion ?? "");
    return rpc(msg.id, {
      result: {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: {} },
        serverInfo: { name: "dozokit-ideas", version: VERSION },
        instructions: `The ideas and bug reports people posted on the "${board.name}" board, with their votes, statuses and comments. Read-only.`,
      },
    });
  }
  if (msg.method === "ping") return rpc(msg.id, { result: {} });
  if (msg.method === "tools/list") return rpc(msg.id, { result: { tools: TOOLS } });
  if (msg.method === "tools/call") {
    await env.DB.prepare("update tokens set last_used_at = ? where hash = ?").bind(Date.now(), hash).run();
    try {
      const out = await call(env, board, await boardsOrigin(env, url), msg.params?.name, (msg.params?.arguments ?? {}) as Args);
      return rpc(msg.id, { result: { content: [{ type: "text", text: JSON.stringify(out, null, 1) }] } });
    } catch (err) {
      return rpc(msg.id, { result: { content: [{ type: "text", text: (err as Error).message }], isError: true } });
    }
  }
  return rpc(msg.id, { error: { code: -32601, message: `Unknown method ${msg.method}.` } });
}
