import type { Env } from "./index";

// Screenshots and the weekly backups. A new copy keeps them in KV, which every Cloudflare account has;
// R2 asks for a subscription before its first bucket. A copy set up before 1.5.1 keeps its wrangler.jsonc,
// so its R2 bucket carries on.
export interface Files {
  put(key: string, value: ReadableStream | string, type?: string): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream; type?: string } | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export function files(env: Env): Files {
  const { FILES: kv, BACKUPS: r2 } = env;
  if (kv) {
    return {
      put: (key, value, type) => kv.put(key, value, { metadata: { type } }),
      get: async (key) => {
        const { value, metadata } = await kv.getWithMetadata<{ type?: string }>(key, "stream");
        return value && { body: value, type: metadata?.type };
      },
      delete: (key) => kv.delete(key),
      list: async (prefix) => (await kv.list({ prefix })).keys.map((k) => k.name),
    };
  }
  return {
    put: async (key, value, type) => void (await r2!.put(key, value, { httpMetadata: { contentType: type } })),
    get: async (key) => {
      const file = await r2!.get(key);
      return file && { body: file.body, type: file.httpMetadata?.contentType };
    },
    delete: (key) => r2!.delete(key),
    list: async (prefix) => (await r2!.list({ prefix })).objects.map((o) => o.key),
  };
}
