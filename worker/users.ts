import type { Env } from "./index";

export interface User {
  id: number;
  provider: "google" | "sso";
  ext_id: string;
  email: string;
  name: string;
}

// Google ext_id is Google's own "sub". SSO ext_id is "<board_id>:<sub>" so a company tool can
// never collide with or impersonate a Google user, even if it uses the same email address.
export async function upsertUser(env: Env, provider: "google" | "sso", extId: string, email: string, name: string): Promise<User> {
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
