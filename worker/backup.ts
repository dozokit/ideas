import type { Env } from "./index";

// Sundays at 03:00 UTC (the cron in wrangler.jsonc), as in Dozokit Apps: one JSON copy of every table
// in R2, the last 4 kept. Backups hold the boards' signing secrets, so the bucket must stay private
// (see README). Left out: sso_jti and password (short-lived or secret), and the search index, which
// is rebuilt from posts.

const BIG = 200_000; // rows: a bigger database isn't copied (each copy reads every row)

export async function backup(env: Env) {
  const { results: tables } = await env.DB.prepare(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%' and name not like 'posts_fts%' and name not in ('sso_jti', 'password') limit 500",
  ).all<{ name: string }>();
  const counts = await Promise.all(tables.map(async (t) => (await env.DB.prepare(`select count(*) as n from "${t.name}"`).first<{ n: number }>())!.n));
  const rows = counts.reduce((a, b) => a + b, 0);
  if (rows > BIG) return console.log(`This week's backup was skipped: ${rows} rows is too many to copy on the free plan (each copy reads every row).`);
  const copy = Object.fromEntries(await Promise.all(tables.map(async (t) => [t.name, (await env.DB.prepare(`select * from "${t.name}" limit ${BIG}`).all()).results])));
  await env.BACKUPS.put(`backups/${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(copy));
  const { objects } = await env.BACKUPS.list({ prefix: "backups/" });
  // Keeps the 4 newest weekly copies; anything else under backups/ (1.0's daily pieces) goes.
  const keep = objects.map((o) => o.key).filter((k) => /^backups\/\d{4}-\d\d-\d\d\.json$/.test(k)).sort().reverse().slice(0, 4);
  const old = objects.map((o) => o.key).filter((k) => !keep.includes(k));
  if (old.length) await env.BACKUPS.delete(old);
}
