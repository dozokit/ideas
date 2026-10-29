import { api, CHECK, me } from "./api";
import { login, logout, setupNeeded } from "./admin";
import { sso } from "./sso";
import { backup } from "./backup";
import { mcp } from "./mcp";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  // Weekly backups under backups/, bug screenshots under screenshots/.
  BACKUPS: R2Bucket;
  PASSWORD?: string;
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
      if (path === "/api/login" && req.method === "POST") return login(req, env);
      if (path === "/api/logout" && req.method === "POST") return logout(req);
      if (path === "/api/me") return me(req, env);
      const setup = setupNeeded(env);
      if (setup) return Response.json({ error: "setup_needed" }, { status: 503 });
      try {
        return await api(req, env, url);
      } catch (err) {
        console.error(err);
        return Response.json({ error: "server_error" }, { status: 500 });
      }
    }

    if (path === "/sso") return sso(req, env, url);

    // Developers' coding assistants, with a board's token instead of a cookie.
    if (path === "/mcp") {
      try {
        return await mcp(req, env, url);
      } catch (err) {
        console.error(err);
        return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "server_error" } }, { status: 500 });
      }
    }

    if (path === CHECK) return new Response("Dozokit Ideas", { headers: { "x-dozokit-ideas": url.searchParams.get("n") ?? "", "cache-control": "no-store" } });

    if (path === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });

    return page(404, "Not found", "Check the address.");
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await backup(env);
  },
} satisfies ExportedHandler<Env>;
