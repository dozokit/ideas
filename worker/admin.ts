import type { Env } from "./index";
import { b64url, hmacSign } from "./crypto";
import { clearSessionCookie, cookie, loginLimited, readCookie } from "./auth";

// One admin password, as in Dozokit Links: the PASSWORD secret set when deploying, or the one
// changed later on the admin page (kept hashed in D1). PASSWORD also signs the visitors' sessions
// (auth.ts), so without one nothing opens, not even on a developer's machine.

const COOKIE = "dozokit_ideas_admin";
const MONTH = 30 * 24 * 3600 * 1000;

export const SETUP_NEEDED = "This board needs an admin password of 12 characters or more before it opens.";

async function pbkdf2(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return b64url(new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100_000 }, key, 256)));
}

// Compares the two values' MACs, so neither their content nor their length leaks through timing.
async function same(a: string, b: string, secret: string) {
  const [x, y] = await Promise.all([hmacSign(a, secret), hmacSign(b, secret)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

// The password in force: the one set on the admin page while the PASSWORD secret is still the one it
// replaced, else the secret. Editing the secret in Cloudflare is how a forgotten password is reset.
// `key` signs the admin cookie, so changing the password signs every other device out.
async function current(env: Env & { PASSWORD: string }) {
  const row = await env.DB.prepare("select hash, salt, secret_mac from password where id = 1").first<{ hash: string; salt: string; secret_mac: string }>();
  if (row && row.secret_mac === (await hmacSign("replaced", env.PASSWORD))) {
    return { key: row.hash, check: async (pw: string) => same(await pbkdf2(pw, row.salt), row.hash, row.hash) };
  }
  return { key: env.PASSWORD, check: (pw: string) => same(pw, env.PASSWORD, env.PASSWORD) };
}

// Deployed without a password, or with one too short to resist guessing: nothing answers.
export const setupNeeded = (env: Env) => (env.PASSWORD && env.PASSWORD.length >= 12 ? null : SETUP_NEEDED);

export async function isAdmin(req: Request, env: Env) {
  if (setupNeeded(env)) return false;
  const [exp, mac] = (readCookie(req, COOKIE) ?? "").split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const { key } = await current(env as Env & { PASSWORD: string });
  return same(mac, await hmacSign(exp, key), key);
}

async function session(req: Request, key: string) {
  const exp = String(Date.now() + MONTH);
  return cookie(req, COOKIE, `${exp}.${await hmacSign(exp, key)}`, MONTH / 1000);
}

export async function login(req: Request, env: Env) {
  if (setupNeeded(env)) return Response.json({ error: "setup_needed" }, { status: 503 });
  if (await loginLimited(req, env)) return Response.json({ error: "too_many" }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const { key, check } = await current(env as Env & { PASSWORD: string });
  if (typeof body.password !== "string" || !(await check(body.password))) return Response.json({ error: "wrong_password" }, { status: 401 });
  return Response.json({ ok: true }, { headers: { "set-cookie": await session(req, key) } });
}

// Called signed in. A wrong current password answers 403, not 401, so the page doesn't sign out.
export async function changePassword(req: Request, env: Env) {
  if (await loginLimited(req, env)) return Response.json({ error: "too_many" }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (typeof body.next !== "string" || body.next.length < 12) return Response.json({ error: "password_too_short" }, { status: 400 });
  const { check } = await current(env as Env & { PASSWORD: string });
  if (typeof body.current !== "string" || !(await check(body.current))) return Response.json({ error: "wrong_current_password" }, { status: 403 });
  const salt = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(body.next, salt);
  await env.DB.prepare("insert or replace into password (id, hash, salt, secret_mac, changed_at) values (1, ?, ?, ?, ?)")
    .bind(hash, salt, await hmacSign("replaced", env.PASSWORD!), Date.now())
    .run();
  return Response.json({ ok: true }, { headers: { "set-cookie": await session(req, hash) } });
}

// Signs this browser out of both: the admin, and the visitor a signed link brought in.
export function logout(req: Request) {
  const headers = new Headers();
  headers.append("set-cookie", cookie(req, COOKIE, "", 0));
  headers.append("set-cookie", clearSessionCookie(req));
  return Response.json({ ok: true }, { headers });
}
