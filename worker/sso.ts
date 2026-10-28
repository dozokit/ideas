import type { Env } from "./index";
import { hmacVerify, unb64url } from "./crypto";
import { readCookie, sessionCookie, loginLimited } from "./auth";
import { sameOriginPath } from "./util";
import { getBoard } from "./boards";
import { upsertUser } from "./users";

// The signed-link login: a company tool mints an HS256 JWT with a board's own sso_secret and
// sends the browser here as a top-level navigation. See SPEC.md for the full contract; this
// file follows it claim by claim, in the order it's checked.

const FRAMED = new Set(["iframe", "frame", "embed", "object"]);
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FIVE_MINUTES = 300;
const SKEW = 60;

type Lang = "en" | "fr" | "es" | "pt-BR";

const MESSAGES: Record<string, Record<Lang, string>> = {
  invalid: {
    en: "This sign-in link isn't valid. Go back to the tool you came from and open it again.",
    fr: "Ce lien de connexion n'est pas valable. Retournez à l'outil d'où il vient et ouvrez-le à nouveau.",
    es: "Este enlace de acceso no es válido. Vuelve a la herramienta de origen y ábrelo de nuevo.",
    "pt-BR": "Este link de acesso não é válido. Volte para a ferramenta de onde ele veio e abra-o novamente.",
  },
  expired: {
    en: "This sign-in link has expired. Go back to the tool you came from and open it again.",
    fr: "Ce lien de connexion a expiré. Retournez à l'outil d'où il vient et ouvrez-le à nouveau.",
    es: "Este enlace de acceso ha caducado. Vuelve a la herramienta de origen y ábrelo de nuevo.",
    "pt-BR": "Este link de acesso expirou. Volte para a ferramenta de onde ele veio e abra-o novamente.",
  },
  too_long: {
    en: "This sign-in link stays open too long to be safe. Go back to the tool you came from and open it again.",
    fr: "Ce lien de connexion reste valable trop longtemps pour être sûr. Retournez à l'outil d'où il vient et ouvrez-le à nouveau.",
    es: "Este enlace de acceso dura demasiado para ser seguro. Vuelve a la herramienta de origen y ábrelo de nuevo.",
    "pt-BR": "Este link de acesso dura tempo demais para ser seguro. Volte para a ferramenta de onde ele veio e abra-o novamente.",
  },
  token_used: {
    en: "This sign-in link has already been used. Go back to the tool you came from and open a new one.",
    fr: "Ce lien de connexion a déjà été utilisé. Retournez à l'outil d'où il vient et ouvrez-en un nouveau.",
    es: "Este enlace de acceso ya se ha usado. Vuelve a la herramienta de origen y abre uno nuevo.",
    "pt-BR": "Este link de acesso já foi usado. Volte para a ferramenta de onde ele veio e abra um novo.",
  },
  wrong_audience: {
    en: "This sign-in link is for another address. Open it from the tool you came from.",
    fr: "Ce lien de connexion est destiné à une autre adresse. Ouvrez-le depuis l'outil d'où il vient.",
    es: "Este enlace de acceso es para otra dirección. Ábrelo desde la herramienta de origen.",
    "pt-BR": "Este link de acesso é para outro endereço. Abra-o a partir da ferramenta de onde ele veio.",
  },
  unknown_board: {
    en: "This sign-in link points to a board that doesn't exist here. Check the address, or ask whoever gave it to you for a new one.",
    fr: "Ce lien de connexion pointe vers un tableau qui n'existe pas ici. Vérifiez l'adresse, ou demandez-en un nouveau à la personne qui vous l'a donné.",
    es: "Este enlace de acceso señala a un tablero que no existe aquí. Comprueba la dirección o pide uno nuevo a quien te lo dio.",
    "pt-BR": "Este link de acesso aponta para um quadro que não existe aqui. Verifique o endereço ou peça um novo a quem o enviou.",
  },
  framed: {
    en: "This page can't open inside another page. Open it directly instead.",
    fr: "Cette page ne peut pas s'ouvrir dans une autre page. Ouvrez-la directement.",
    es: "Esta página no se puede abrir dentro de otra página. Ábrela directamente.",
    "pt-BR": "Esta página não pode abrir dentro de outra página. Abra-a diretamente.",
  },
};

function pickLang(req: Request): Lang {
  const supported: Lang[] = ["en", "fr", "es", "pt-BR"];
  const cookie = readCookie(req, "lang");
  if (cookie && (supported as string[]).includes(cookie)) return cookie as Lang;
  const accept = req.headers.get("accept-language") ?? "";
  if (/^fr/i.test(accept)) return "fr";
  if (/^es/i.test(accept)) return "es";
  if (/^pt/i.test(accept)) return "pt-BR";
  return "en";
}

function errorPage(lang: Lang, code: string) {
  const text = MESSAGES[code]?.[lang] ?? MESSAGES.invalid[lang];
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Dozokit Ideas</title><body style="font:16px/1.5 system-ui,sans-serif;max-width:28rem;margin:15vh auto;padding:0 1rem;color:#2a2421;background:#f6f1ec"><p>${text}</p></body></html>`;
}

function fail(req: Request, status: number, code: string): Response {
  const common = { "referrer-policy": "no-referrer", "cache-control": "no-store" };
  if ((req.headers.get("accept") ?? "").includes("application/json")) return Response.json({ error: code }, { status, headers: common });
  return new Response(errorPage(pickLang(req), code), {
    status,
    headers: { ...common, "content-type": "text/html; charset=utf-8", "content-security-policy": "frame-ancestors 'none'", "x-frame-options": "DENY" },
  });
}

interface Claims {
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  jti?: string;
  iat?: number;
  nbf?: number;
}

function decodeJson(segment: string): Record<string, unknown> | null {
  try {
    return JSON.parse(new TextDecoder().decode(unb64url(segment)));
  } catch {
    return null;
  }
}

export async function sso(req: Request, env: Env, url: URL): Promise<Response> {
  if (FRAMED.has((req.headers.get("sec-fetch-dest") ?? "").toLowerCase())) return fail(req, 400, "framed");
  if (await loginLimited(req, env)) return Response.json({ error: "too_many" }, { status: 429 });

  const token = url.searchParams.get("token") ?? "";
  const parts = token.split(".");
  if (parts.length !== 3) return fail(req, 401, "invalid");
  const header = decodeJson(parts[0]);
  if (!header || header.alg !== "HS256") return fail(req, 401, "invalid");
  const payload = decodeJson(parts[1]) as Claims | null;
  if (!payload || typeof payload.iss !== "string") return fail(req, 401, "invalid");

  const board = await getBoard(env, payload.iss);
  if (!board) return fail(req, 401, "unknown_board");

  if (!(await hmacVerify(`${parts[0]}.${parts[1]}`, parts[2], board.sso_secret))) return fail(req, 401, "invalid");

  if (payload.aud !== url.origin) return fail(req, 401, "wrong_audience");
  if (typeof payload.sub !== "string" || payload.sub.length < 1 || payload.sub.length > 200) return fail(req, 401, "invalid");
  if (typeof payload.email !== "string" || !EMAIL.test(payload.email)) return fail(req, 401, "invalid");
  const name = typeof payload.name === "string" && payload.name.length > 0 && payload.name.length <= 100 ? payload.name : payload.email.split("@")[0];
  const now = Date.now() / 1000;
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= now) return fail(req, 401, "expired");
  if (payload.exp > now + FIVE_MINUTES) return fail(req, 401, "too_long");
  if (typeof payload.jti !== "string" || payload.jti.length < 8 || payload.jti.length > 100) return fail(req, 401, "invalid");
  if (payload.iat !== undefined && (typeof payload.iat !== "number" || payload.iat > now + SKEW)) return fail(req, 401, "invalid");
  if (payload.nbf !== undefined && (typeof payload.nbf !== "number" || payload.nbf > now + SKEW)) return fail(req, 401, "invalid");

  await env.DB.prepare("delete from sso_jti where exp < ?").bind(Math.floor(now)).run();
  const inserted = await env.DB.prepare("insert into sso_jti (board_id, jti, exp) values (?, ?, ?) on conflict (board_id, jti) do nothing")
    .bind(board.id, payload.jti, Math.floor(payload.exp))
    .run();
  if (!inserted.meta.changes) return fail(req, 401, "token_used");

  const user = await upsertUser(env, "sso", `${board.id}:${payload.sub}`, payload.email, name);
  await env.DB.prepare("insert or ignore into board_members (board_id, user_id, created_at) values (?, ?, ?)").bind(board.id, user.id, Date.now()).run();

  const returnTo = sameOriginPath(url, url.searchParams.get("return_to")) ?? `/b/${board.id}`;
  return new Response(null, {
    status: 302,
    headers: { location: returnTo, "set-cookie": await sessionCookie(req, env, user.id), "referrer-policy": "no-referrer", "cache-control": "no-store" },
  });
}
