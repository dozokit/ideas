import type { Env } from "./index";
import type { User } from "./users";

export interface Board {
  id: string;
  name: string;
  visibility: "public" | "team";
  sso_secret: string;
  statuses: string;
  logo: string | null;
  color: string | null;
  created_at: number;
}

export const BOARD_ID = /^[a-z0-9-]{2,40}$/;

export const getBoard = (env: Env, id: string) => env.DB.prepare("select * from boards where id = ?").bind(id).first<Board>();

// Members, the people this board's signed link let in (a row in board_members), vote, post and
// comment. Anyone can read a public board; a private one ("team") only its members and the admin.
export async function access(env: Env, board: Board, user: User | null, admin: boolean) {
  const member = Boolean(user && (await env.DB.prepare("select 1 from board_members where board_id = ? and user_id = ?").bind(board.id, user.id).first()));
  return { see: member || admin || board.visibility === "public", member };
}
