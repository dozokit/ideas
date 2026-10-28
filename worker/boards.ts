import type { Env } from "./index";
import type { User } from "./users";

export interface Board {
  id: string;
  name: string;
  visibility: "public" | "team";
  sso_secret: string;
  allowed_domains: string;
  created_at: number;
}

export const BOARD_ID = /^[a-z0-9-]{2,40}$/;

export const getBoard = (env: Env, id: string) => env.DB.prepare("select * from boards where id = ?").bind(id).first<Board>();

const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

// Public boards: anyone. Team boards: the admin, anyone who has ever signed in through this
// board's signed link (a row in board_members), or a Google user whose email domain is listed.
export async function canSee(env: Env, board: Board, user: User | null, admin: boolean): Promise<boolean> {
  if (board.visibility === "public") return true;
  if (!user) return false;
  if (admin) return true;
  const domains = board.allowed_domains
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (user.provider === "google" && domains.includes(domainOf(user.email))) return true;
  const member = await env.DB.prepare("select 1 from board_members where board_id = ? and user_id = ?").bind(board.id, user.id).first();
  return Boolean(member);
}
