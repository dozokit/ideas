import type { Env } from "./index";
import { isLocalHost } from "./util";

export const TURNSTILE_SETUP_NEEDED = "This board needs a Turnstile secret before people can post, vote or comment.";

// Writes need a Turnstile secret so they can be checked for bots. Missing on a real deployment
// means every write answers "setup needed" until the owner adds one; local dev can use
// Cloudflare's published test keys instead (see .dev.vars.example).
export function turnstileSetupNeeded(req: Request, env: Env): string | null {
  return !env.TURNSTILE_SECRET && !isLocalHost(req) ? TURNSTILE_SETUP_NEEDED : null;
}

// Verified fresh against Cloudflare every time: the result is never cached, and a token can
// only be redeemed once anyway.
export async function verifyTurnstile(token: unknown, req: Request, env: Env): Promise<boolean> {
  if (typeof token !== "string" || !token) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET!, response: token });
  const ip = req.headers.get("cf-connecting-ip");
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
