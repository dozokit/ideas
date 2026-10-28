export type Visibility = "public" | "team";
export type Status = "open" | "planned" | "in_progress" | "done";

export interface Me {
  user: { id: number; name: string; email?: string; admin: boolean } | null;
  config: { googleReady: boolean; devLogin: boolean; turnstileSiteKey: string; setupNeeded: string | null };
  version: string;
  latest: string | null;
}

export interface BoardSummary {
  id: string;
  name: string;
  visibility: Visibility;
  allowedDomains: string;
  createdAt: number;
}

export interface BoardInfo {
  id: string;
  name: string;
  visibility: Visibility;
  canSee: true;
}

export interface PostSummary {
  id: number;
  title: string;
  status: Status;
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
  status: Status;
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
  createdAt: number;
}

export interface PostPage {
  post: PostDetail;
  board: { id: string; name: string; visibility: Visibility };
  comments: Comment[];
}
