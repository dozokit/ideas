import type { Env } from "./index";
import { files } from "./files";

// Sundays at 03:00 UTC (the cron in wrangler.jsonc), as in Dozokit Apps: one JSON copy of every table
// in files.ts, the last 4 kept. Backups hold the boards' signing secrets, so they must stay private
// (see README). Left out: sso_jti and password (short-lived or secret), and the search index, which
// is rebuilt from posts.

const BIG = 200_000; // rows: a bigger database isn't copied (each copy reads every row)

export async function backup(env: Env) {
  const { results: tables } = await env.DB.prepare(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%' and name not like 'posts_fts%' and name not in ('sso_jti', 'password') limit 500",
  ).all<{ name: string }>();
  // One query for the counts and one batch for the copy: each separate D1 call costs CPU, and 21 of
  // them went over the free plan's 10 ms.
  const rows = (await env.DB.prepare(`select ${tables.map((t) => `(select count(*) from "${t.name}")`).join(" + ")} as n`).first<{ n: number }>())!.n;
  if (rows > BIG) return console.log(`This week's backup was skipped: ${rows} rows is too many to copy on the free plan (each copy reads every row).`);
  const all = await env.DB.batch(tables.map((t) => env.DB.prepare(`select * from "${t.name}" limit ${BIG}`)));
  const copy = Object.fromEntries(tables.map((t, i) => [t.name, all[i].results]));
  const store = files(env);
  await store.put(`backups/${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(copy));
  const keys = await store.list("backups/");
  // Keeps the 4 newest weekly copies; anything else under backups/ (1.0's daily pieces) goes.
  const keep = keys.filter((k) => /^backups\/\d{4}-\d\d-\d\d\.json$/.test(k)).sort().reverse().slice(0, 4);
  await Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => store.delete(k)));
}
