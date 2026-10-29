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
}

export interface BoardSummary {
  id: string;
  name: string;
  visibility: Visibility;
  statuses: BoardStatus[];
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

export interface PostSummary {
  id: number;
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
  title: string;
  body: string | null;
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
