// Small helpers with no state and no dependency on Env, shared by several worker files.

export const isLocalHost = (req: Request) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(req.url).hostname);

// A redirect target is safe when it stays on this origin: either a path starting with a single
// "/" (not "//" or "/\", both of which browsers can treat as protocol-relative), or an absolute
// URL whose origin is exactly this one. Anything else (another site, javascript:, garbage) is ignored.
export function sameOriginPath(url: URL, raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) return raw;
  try {
    const u = new URL(raw);
    if (u.origin === url.origin) return u.pathname + u.search + u.hash;
  } catch {}
  return null;
}
