import type { Env } from "./index";

export interface User {
  id: number;
  provider: "sso";
  ext_id: string;
  email: string;
  name: string;
}

// Everyone comes in through a board's signed link (provider "sso"; older rows may say "google").
// ext_id is "<board_id>:<sub>", so one board's tool can never impersonate another board's people;
// a board's team user, who the admin posts as, is "__team:<board_id>" (boards.ts).
export async function upsertUser(env: Env, provider: "sso", extId: string, email: string, name: string): Promise<User> {
  const row = await env.DB.prepare(
    `insert into users (provider, ext_id, email, name, created_at) values (?, ?, ?, ?, ?)
     on conflict (provider, ext_id) do update set email = excluded.email, name = excluded.name
     returning id, provider, ext_id, email, name`,
  )
    .bind(provider, extId, email, name, Date.now())
    .first<User>();
  return row!;
}

export function getUserById(env: Env, id: number) {
  return env.DB.prepare("select id, provider, ext_id, email, name from users where id = ?").bind(id).first<User>();
}
