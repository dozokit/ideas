import type { Env } from "./index";

// Nightly export of every board to R2, in case D1 is ever lost. Backups hold the boards' signing
// secrets, so the bucket must stay private (see README). sso_jti is skipped: it holds nothing
// worth keeping, and it would only make the backup bigger.
const TABLES = ["boards", "board_members", "users", "posts", "votes", "comments"] as const;
const KEEP_DAYS = 14;

// Pages through a table by rowid so a big one is never loaded into memory at once.
async function dumpTable(env: Env, table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let after = 0;
  while (true) {
    const { results } = await env.DB.prepare(`select rowid as _rowid, * from ${table} where rowid > ? order by rowid limit 1000`)
      .bind(after)
      .all<Record<string, unknown>>();
    if (!results.length) break;
    for (const { _rowid, ...row } of results) {
      rows.push(row);
      after = Number(_rowid);
    }
    if (results.length < 1000) break;
  }
  return rows;
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
  const day = new Date().toISOString().slice(0, 10);
  for (const table of TABLES) {
    const rows = await dumpTable(env, table);
    await env.BACKUPS.put(`backups/${day}/${table}.json`, JSON.stringify(rows));
  }
  await pruneOldBackups(env);
}
