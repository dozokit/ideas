import { api, me } from "./api";
import { googleLogin, googleCallback, devLogin, logout, setupNeeded } from "./auth";
import { sso } from "./sso";
import { backup } from "./backup";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  BACKUPS: R2Bucket;
  ADMIN_EMAIL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  DEV_LOGIN?: string;
  LOGIN_LIMIT?: RateLimit;
}

// Every HTML response carries this, so the sign-in screen (and everything else) can't be framed
// by another site.
const FRAME_HEADERS = { "content-security-policy": "frame-ancestors 'none'", "x-frame-options": "DENY" };

const page = (status: number, title: string, text: string) =>
  new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>` +
      `<body style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#2a2421;background:#f6f1ec"><h1 style="font-size:1.4rem">${title}</h1><p>${text}</p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...FRAME_HEADERS } },
  );

// The SPA: / (boards list), /b/:id (a board), /b/:id/p/:postId (a post), /admin (owner only).
// The Worker always serves the same index.html; the app's own tiny router takes it from there.
const isSpaPath = (path: string) => path === "/" || path.startsWith("/b/") || path === "/admin" || path.startsWith("/admin/");

async function spaShell(env: Env, url: URL) {
  const index = await env.ASSETS.fetch(new URL("/", url));
  return new Response(index.body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...FRAME_HEADERS } });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      // Writes only from the app itself, on top of the SameSite cookie.
      const origin = req.headers.get("origin");
      if (req.method !== "GET" && origin && origin !== url.origin) {
        return Response.json({ error: "cross_origin" }, { status: 403 });
      }
      if (path === "/api/logout" && req.method === "POST") return logout(req);
      if (path === "/api/me") return me(req, env);
      const setup = setupNeeded(req, env);
      if (setup) return Response.json({ error: "setup_needed" }, { status: 503 });
      try {
        return await api(req, env, url);
      } catch (err) {
        console.error(err);
        return Response.json({ error: "server_error" }, { status: 500 });
      }
    }

    if (path === "/auth/google") return googleLogin(req, env, url);
    if (path === "/auth/google/callback") return googleCallback(req, env, url);
    if (path === "/auth/dev") return devLogin(req, env, url);
    if (path === "/sso") return sso(req, env, url);

    if (path === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });

    // Vite's own files in development, and the built assets (and icon.svg) in production: none
    // of the SPA's own paths contain a dot or an "@".
    if (/[.@]/.test(path.slice(1))) return env.ASSETS.fetch(req);

    if (isSpaPath(path)) return spaShell(env, url);

    return page(404, "Not found", "Check the address.");
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await backup(env);
  },
} satisfies ExportedHandler<Env>;
