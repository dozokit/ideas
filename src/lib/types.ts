import type { Lang } from "../i18n";

export type Visibility = "public" | "team";
export interface BoardStatus {
  id: string;
  label: string;
}

export interface Me {
  user: { id: number; name: string; email?: string } | null;
  admin: boolean;
  config: { setupNeeded: string | null };
  // The admin's own address for every board (Settings → Your own address), or null.
  domain: string | null;
}

export interface BoardSummary {
  id: string;
  name: string;
  visibility: Visibility;
  statuses: BoardStatus[];
  // Bug reports have statuses of their own.
  bugStatuses: BoardStatus[];
  logo: string | null;
  color: string | null;
  productName: string | null;
  productUrl: string | null;
  lang: Lang | null;
  createdAt: number;
}

export interface BoardInfo extends BoardSummary {
  member: boolean;
}

export type PostType = "idea" | "bug";

export interface PostSummary {
  id: number;
  type: PostType;
  title: string;
  status: string;
  votes: number;
  comments: number;
  createdAt: number;
  author: string;
  voted: boolean;
}

export interface PostDetail {
  id: number;
  type: PostType;
  title: string;
  body: string | null;
  // A bug's: what the person expected, where it happened, and whether a screenshot came with it.
  expected: string | null;
  place: string | null;
  screenshot: boolean;
  status: string;
  votes: number;
  comments: number;
  createdAt: number;
  author: string;
  voted: boolean;
}

export interface Comment {
  id: number;
  body: string;
  author: string;
  official: boolean;
  createdAt: number;
}

export interface PostPage {
  post: PostDetail;
  board: BoardSummary;
  member: boolean;
  comments: Comment[];
}

// A developer token, shown in full only in the answer that made it.
export interface DevToken {
  id: number;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
  token?: string;
}
