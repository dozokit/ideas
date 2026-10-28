import type { Env } from "./index";

// Backs up every board to R2, a bit at a time, in case D1 is ever lost. Backups hold the boards'
// signing secrets, so the bucket must stay private (see README). sso_jti is skipped: it holds
// nothing worth keeping, and it would only make the backup bigger.
const TABLES = ["boards", "board_members", "users", "posts", "votes", "comments"] as const;
const KEEP_DAYS = 14;
const CHUNK = 250;
const PROGRESS_KEY = "backups/_progress.json";

interface Progress {
  day: string;
  tableIndex: number;
  after: number;
  part: number;
  done: boolean;
}

function freshProgress(day: string): Progress {
  return { day, tableIndex: 0, after: 0, part: 1, done: false };
}

async function readProgress(env: Env): Promise<Progress | null> {
  try {
    const object = await env.BACKUPS.get(PROGRESS_KEY);
    if (!object) return null;
    const progress = await object.json<Progress>();
    if (typeof progress.day !== "string" || typeof progress.tableIndex !== "number") return null;
    return progress;
  } catch {
    return null;
  }
}

// One page of a table, by rowid, so a run only ever touches CHUNK rows.
async function dumpChunk(env: Env, table: string, after: number, limit: number) {
  const { results } = await env.DB.prepare(`select rowid as _rowid, * from ${table} where rowid > ? order by rowid limit ?`)
    .bind(after, limit)
    .all<Record<string, unknown>>();
  const rows: Record<string, unknown>[] = [];
  let lastRowid = after;
  for (const { _rowid, ...row } of results) {
    rows.push(row);
    lastRowid = Number(_rowid);
  }
  return { rows, after: lastRowid };
}

async function deletePrefix(env: Env, prefix: string) {
  let cursor: string | undefined;
  do {
    const page = await env.BACKUPS.list({ prefix, cursor });
    if (page.objects.length) await env.BACKUPS.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

async function pruneOldBackups(env: Env) {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000;
  const { delimitedPrefixes } = await env.BACKUPS.list({ prefix: "backups/", delimiter: "/" });
  for (const prefix of delimitedPrefixes ?? []) {
    const day = Date.parse(`${prefix.slice("backups/".length, -1)}T00:00:00Z`);
    if (!Number.isNaN(day) && day < cutoff) await deletePrefix(env, prefix);
  }
}

export async function backup(env: Env) {
  const today = new Date().toISOString().slice(0, 10);
  let progress = await readProgress(env);
  if (!progress) {
    progress = freshProgress(today);
  } else if (progress.done) {
    if (progress.day >= today) return;
    progress = freshProgress(today);
  }

  const table = TABLES[progress.tableIndex];
  const { rows, after } = await dumpChunk(env, table, progress.after, CHUNK);
  if (rows.length) {
    const part = String(progress.part).padStart(4, "0");
    await env.BACKUPS.put(`backups/${progress.day}/${table}/${part}.json`, JSON.stringify(rows));
  }
  progress =
    rows.length < CHUNK
      ? { ...progress, tableIndex: progress.tableIndex + 1, after: 0, part: 1 }
      : { ...progress, after, part: progress.part + 1 };

  if (progress.tableIndex >= TABLES.length) {
    progress = { ...progress, done: true };
    await pruneOldBackups(env);
  }
  await env.BACKUPS.put(PROGRESS_KEY, JSON.stringify(progress));
}
