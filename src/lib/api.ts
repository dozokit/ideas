export class ApiError extends Error {
  constructor(readonly code: string, readonly status: number, readonly data: Record<string, unknown> | null) {
    super(code);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    // A FormData body (a bug with its screenshot) sets its own content type.
    headers: typeof init?.body === "string" ? { "content-type": "application/json", ...init.headers } : init?.headers,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(typeof body?.error === "string" ? body.error : "server_error", res.status, body);
  return body as T;
}
