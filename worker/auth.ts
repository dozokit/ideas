import type { Env } from "./index";
import { hmacSign, hmacVerify, randomToken, unb64url } from "./crypto";
import { isLocalHost, sameOriginPath } from "./util";
import { upsertUser, getUserById, type User } from "./users";

// Session cookie: "<userId>.<expMs>.<hmac>", signed with SESSION_SECRET. HttpOnly, SameSite=Lax,
// Secure on https, 30 days. Nothing in the cookie is trusted until the HMAC checks out.

const SESSION_COOKIE = "dozokit_ideas_session";
const STATE_COOKIE = "dozokit_ideas_state";
const MONTH = 30 * 24 * 3600 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export const SETUP_NEEDED = "This board needs a session secret of 32 characters or more before it opens.";

const DEV_PLACEHOLDER_SECRET = "dev-only-secret-change-me-32-chars-minimum";

// Without a long SESSION_SECRET nobody can safely stay signed in, so on anything but a developer's
// own machine every page (and every API call) shows "setup needed" until the owner sets it. The
// placeholder from .dev.vars.example counts as not set once we're off a developer's machine.
export function setupNeeded(req: Request, env: Env): string | null {
  const secret = env.SESSION_SECRET;
  const local = isLocalHost(req);
  if (secret === DEV_PLACEHOLDER_SECRET) return local ? null : SETUP_NEEDED;
  return (secret ? secret.length < 32 : !local) ? SETUP_NEEDED : null;
}

function cookie(req: Request, name: string, value: string, maxAgeSeconds: number) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  return header.split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1) ?? null;
}

export async function sessionCookie(req: Request, env: Env, userId: number): Promise<string> {
  const exp = String(Date.now() + MONTH);
  const mac = await hmacSign(`${userId}.${exp}`, env.SESSION_SECRET!);
  return cookie(req, SESSION_COOKIE, `${userId}.${exp}.${mac}`, MONTH / 1000);
}

export const clearSessionCookie = (req: Request) => cookie(req, SESSION_COOKIE, "", 0);

// The session user, or null. Checked fresh from D1 each time (not cached): a renamed or
// re-emailed account should take effect immediately, and there are few requests per visitor.
export async function currentUser(req: Request, env: Env): Promise<User | null> {
  if (setupNeeded(req, env)) return null;
  const raw = readCookie(req, SESSION_COOKIE);
  if (!raw) return null;
  const [userId, exp, mac] = raw.split(".");
  if (!userId || !exp || !mac || Number(exp) < Date.now()) return null;
  if (!(await hmacVerify(`${userId}.${exp}`, mac, env.SESSION_SECRET!))) return null;
  return (await getUserById(env, Number(userId))) ?? null;
}

// Admin means a Google user whose verified email matches ADMIN_EMAIL, never an SSO user,
// whatever a signed link's claims say. Computed fresh each request, never stored.
export const isAdmin = (env: Env, user: User | null) =>
  Boolean(user && user.provider === "google" && env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());

export const googleReady = (env: Env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const devLoginReady = (req: Request, env: Env) => env.DEV_LOGIN === "1" && isLocalHost(req);

// 20 sign-in attempts a minute per address, only when the LOGIN_LIMIT binding exists (it's
// optional in wrangler.jsonc, same as Dozokit Links).
export async function loginLimited(req: Request, env: Env): Promise<boolean> {
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  return Boolean(env.LOGIN_LIMIT && !(await env.LOGIN_LIMIT.limit({ key: ip })).success);
}

const redirectTo = (path: string, headers: Record<string, string> = {}) => new Response(null, { status: 302, headers: { location: path, ...headers } });

// GET /auth/google?return_to=/b/x — authorization code flow. The nonce travels two ways: in an
// HttpOnly cookie, and inside the "state" sent to Google, so the callback can tell its own
// request apart from a forged one without a server-side session store.
export async function googleLogin(req: Request, env: Env, url: URL): Promise<Response> {
  if (!googleReady(env)) return redirectTo("/?error=google_not_configured");
  if (await loginLimited(req, env)) return Response.json({ error: "too_many" }, { status: 429 });
  const nonce = randomToken(16);
  const returnTo = sameOriginPath(url, url.searchParams.get("return_to")) ?? "/";
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
  auth.searchParams.set("redirect_uri", `${url.origin}/auth/google/callback`);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", `${nonce}.${encodeURIComponent(returnTo)}`);
  return redirectTo(auth.href, { "set-cookie": cookie(req, STATE_COOKIE, nonce, TEN_MINUTES / 1000) });
}

export async function googleCallback(req: Request, env: Env, url: URL): Promise<Response> {
  const clearState = cookie(req, STATE_COOKIE, "", 0);
  if (!googleReady(env)) return redirectTo("/?error=google_not_configured", { "set-cookie": clearState });
  const [nonce, returnToRaw] = (url.searchParams.get("state") ?? "").split(".");
  if (!nonce || nonce !== readCookie(req, STATE_COOKIE)) return redirectTo("/?error=invalid", { "set-cookie": clearState });
  const returnTo = sameOriginPath(url, returnToRaw ? decodeURIComponent(returnToRaw) : null) ?? "/";
  const code = url.searchParams.get("code");
  if (!code) return redirectTo("/?error=invalid", { "set-cookie": clearState });

  let idToken: string;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${url.origin}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(5000),
    });
    const body = (await res.json()) as { id_token?: string };
    if (!res.ok || !body.id_token) throw new Error("token exchange failed");
    idToken = body.id_token;
  } catch (err) {
    console.error(err);
    return redirectTo("/?error=google_failed", { "set-cookie": clearState });
  }

  // The id_token came straight from Google's token endpoint over TLS, not from the browser, so
  // its payload is trusted without re-checking the signature.
  let claims: { aud?: string; sub?: string; email?: string; email_verified?: boolean; name?: string };
  try {
    claims = JSON.parse(new TextDecoder().decode(unb64url(idToken.split(".")[1] ?? "")));
  } catch {
    return redirectTo("/?error=invalid", { "set-cookie": clearState });
  }
  if (claims.aud !== env.GOOGLE_CLIENT_ID || !claims.email_verified || !claims.sub || !claims.email) {
    return redirectTo("/?error=invalid", { "set-cookie": clearState });
  }
  const user = await upsertUser(env, "google", claims.sub, claims.email, claims.name || claims.email.split("@")[0]);
  return redirectTo(returnTo, { "set-cookie": await sessionCookie(req, env, user.id) });
}

// Dev-only, never documented as a feature: signs in without Google so the admin (and anyone
// testing) can use the app locally. 404s unless DEV_LOGIN=1 and the host is localhost.
export async function devLogin(req: Request, env: Env, url: URL): Promise<Response> {
  if (!devLoginReady(req, env)) return new Response("Not found.", { status: 404 });
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "invalid_email" }, { status: 400 });
  const name = (url.searchParams.get("name") ?? "").trim() || email.split("@")[0];
  const returnTo = sameOriginPath(url, url.searchParams.get("return_to")) ?? "/";
  const user = await upsertUser(env, "google", `dev:${email}`, email, name);
  return redirectTo(returnTo, { "set-cookie": await sessionCookie(req, env, user.id) });
}

export function logout(req: Request) {
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(req) } });
}
