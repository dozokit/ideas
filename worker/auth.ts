import type { Env } from "./index";
import { hmacSign, hmacVerify } from "./crypto";
import { setupNeeded } from "./admin";
import { getUserById, type User } from "./users";

// Visitor session cookie, set by a board's signed link (sso.ts): "<userId>.<expMs>.<hmac>", signed
// with PASSWORD. HttpOnly, SameSite=Lax, Secure on https, 30 days. Nothing in the cookie is trusted
// until the HMAC checks out. The admin has a cookie of its own (admin.ts).

const SESSION_COOKIE = "dozokit_ideas_session";
const MONTH = 30 * 24 * 3600 * 1000;

export function cookie(req: Request, name: string, value: string, maxAgeSeconds: number) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  return header.split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1) ?? null;
}

export async function sessionCookie(req: Request, env: Env, userId: number): Promise<string> {
  const exp = String(Date.now() + MONTH);
  const mac = await hmacSign(`${userId}.${exp}`, env.PASSWORD!);
  return cookie(req, SESSION_COOKIE, `${userId}.${exp}.${mac}`, MONTH / 1000);
}

export const clearSessionCookie = (req: Request) => cookie(req, SESSION_COOKIE, "", 0);

// The session user, or null. Checked fresh from D1 each time (not cached): a renamed or
// re-emailed account should take effect immediately, and there are few requests per visitor.
export async function currentUser(req: Request, env: Env): Promise<User | null> {
  if (setupNeeded(env)) return null;
  const raw = readCookie(req, SESSION_COOKIE);
  if (!raw) return null;
  const [userId, exp, mac] = raw.split(".");
  if (!userId || !exp || !mac || Number(exp) < Date.now()) return null;
  if (!(await hmacVerify(`${userId}.${exp}`, mac, env.PASSWORD!))) return null;
  return (await getUserById(env, Number(userId))) ?? null;
}

// 20 sign-in attempts a minute per address, only when the LOGIN_LIMIT binding exists (it's
// optional in wrangler.jsonc, same as Dozokit Links).
export async function loginLimited(req: Request, env: Env): Promise<boolean> {
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  return Boolean(env.LOGIN_LIMIT && !(await env.LOGIN_LIMIT.limit({ key: ip })).success);
}
