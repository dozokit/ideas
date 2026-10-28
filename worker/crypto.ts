// Tiny WebCrypto helpers shared by sessions (auth.ts) and signed links (sso.ts).
// No auth libraries: HMAC-SHA256 is cheap enough for the 10ms-per-request free plan limit.

export function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function unb64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const randomToken = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));

function importHmacKey(secret: string, usages: ("sign" | "verify")[]) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

export async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

// Constant-time: crypto.subtle.verify compares the MAC itself, not the strings, so neither
// a wrong value nor its length leaks through timing.
export async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await importHmacKey(secret, ["verify"]);
  try {
    return await crypto.subtle.verify("HMAC", key, unb64url(signature), new TextEncoder().encode(data));
  } catch {
    return false;
  }
}
