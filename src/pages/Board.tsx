import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { api, ApiError } from "../lib/api";
import { errorText, format, formatDate, useT } from "../i18n";
import type { BoardInfo, Me, PostSummary, Status } from "../lib/types";
import type { Navigate } from "../App";
import { SignIn } from "./SignIn";
import { Turnstile, type TurnstileHandle } from "../lib/turnstile";

const STATUSES: Status[] = ["open", "planned", "in_progress", "done"];

function NewIdea({ boardId, turnstileRef, onAdded }: { boardId: string; turnstileRef: RefObject<TurnstileHandle | null>; onAdded: (p: PostSummary) => void }) {
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="post-form page-section"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const token = (await turnstileRef.current?.getToken()) ?? null;
          const post = await api<PostSummary>(`/api/boards/${boardId}/posts`, { method: "POST", body: JSON.stringify({ title, body: body || undefined, turnstile: token }) });
          onAdded(post);
          setTitle("");
          setBody("");
        } catch (err) {
          setError(errorText(t, err));
        } finally {
          setBusy(false);
          turnstileRef.current?.reset();
        }
      }}
    >
      <h2>{t.board.shareIdea}</h2>
      <div className="field-stack">
        <label className="field">
          <span>{t.board.titlePlaceholder}</span>
          <input type="text" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(error)} aria-describedby="new-idea-help" data-testid="post-title-input" />
        </label>
        <label className="field">
          <span>{t.board.bodyPlaceholder}</span>
          <textarea maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
      </div>
      <div className="field-actions">
        <button type="submit" className="btn btn--ink" disabled={busy} data-testid="post-submit">
          {t.board.submit}
        </button>
      </div>
      <p id="new-idea-help" className={error ? "help help--error" : "help"} role="status">
        {error ?? ""}
      </p>
    </form>
  );
}

function PostRow({ post, boardId, user, turnstileRef, navigate }: { post: PostSummary; boardId: string; user: Me["user"]; turnstileRef: RefObject<TurnstileHandle | null>; navigate: Navigate }) {
  const { t, lang } = useT();
  const [voted, setVoted] = useState(post.voted);
  const [votes, setVotes] = useState(post.votes);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function vote() {
    if (!user) {
      setMsg(t.auth.signInToVote);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const token = (await turnstileRef.current?.getToken()) ?? null;
      await api(`/api/posts/${post.id}/vote`, { method: "POST", body: JSON.stringify({ turnstile: token }) });
      setVoted(true);
      setVotes((v) => v + 1);
    } catch (err) {
      setMsg(errorText(t, err));
      if (err instanceof ApiError && err.code === "already_voted") setVoted(true);
    } finally {
      setBusy(false);
      turnstileRef.current?.reset();
    }
  }

  const go = (e: MouseEvent) => {
    e.preventDefault();
    navigate(`/b/${boardId}/p/${post.id}`);
  };

  return (
    <li className="post-row stock">
      <button type="button" className="vote-btn" data-testid="vote-button" disabled={voted || busy} aria-pressed={voted} onClick={vote}>
        <span className="fig">{votes}</span>
        <span className="vote-btn-label">{voted ? t.board.voted : t.board.vote}</span>
      </button>
      <div className="post-main">
        <a href={`/b/${boardId}/p/${post.id}`} className="post-title" onClick={go}>
          {post.title}
        </a>
        <div className="post-meta">
          {post.status !== "open" && <span className={`badge badge--${post.status}`}>{t.status[post.status]}</span>}
          <span>{format(t.board.by, { name: post.author, date: formatDate(post.createdAt, lang) })}</span>
          <span>{format(t.board.comments, { n: post.comments })}</span>
        </div>
        {msg && <p className="help help--error">{msg}</p>}
      </div>
    </li>
  );
}

export function Board({ id, me, navigate }: { id: string; me: Me; navigate: Navigate }) {
  const { t } = useT();
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [boardError, setBoardError] = useState<ApiError | null>(null);
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [postsError, setPostsError] = useState<ApiError | null>(null);
  const [filter, setFilter] = useState<Status | "">("");
  const [sort, setSort] = useState<"top" | "new">("top");
  const turnstileRef = useRef<TurnstileHandle>(null);

  useEffect(() => {
    setBoard(null);
    setBoardError(null);
    api<BoardInfo>(`/api/boards/${id}`).then(setBoard, (e) => setBoardError(e instanceof ApiError ? e : new ApiError("server_error", 500, null)));
  }, [id]);

  useEffect(() => {
    if (!board) return;
    setPosts(null);
    setPostsError(null);
    const qs = new URLSearchParams({ sort });
    if (filter) qs.set("status", filter);
    api<PostSummary[]>(`/api/boards/${id}/posts?${qs}`).then(setPosts, (e) => setPostsError(e instanceof ApiError ? e : new ApiError("server_error", 500, null)));
  }, [id, board, filter, sort]);

  if (boardError) {
    if (boardError.code === "team_only") {
      return <SignIn config={me.config} returnTo={`/b/${id}`} heading={String(boardError.data?.name ?? "")} message={t.auth.teamOnly} />;
    }
    return (
      <div className="failed">
        <p>{errorText(t, boardError)}</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="skeleton">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div>
      <div className="section-head">
        <h1>
          {board.name} {board.visibility === "team" && <span className="badge badge--team">{t.boards.visibilityTeam}</span>}
        </h1>
      </div>

      {me.config.turnstileSiteKey && <Turnstile ref={turnstileRef} siteKey={me.config.turnstileSiteKey} />}

      {me.user ? (
        <NewIdea boardId={id} turnstileRef={turnstileRef} onAdded={(p) => setPosts((ps) => (ps ? [p, ...ps] : [p]))} />
      ) : (
        <SignIn config={me.config} returnTo={`/b/${id}`} message={t.auth.signInToPost} compact />
      )}

      <div className="toolbar">
        <ul className="filters">
          <li>
            <button type="button" className="chip" aria-pressed={filter === ""} onClick={() => setFilter("")}>
              {t.board.filterAll}
            </button>
          </li>
          {STATUSES.map((s) => (
            <li key={s}>
              <button type="button" className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {t.status[s]}
              </button>
            </li>
          ))}
        </ul>
        <div className="tabs" role="tablist">
          <button type="button" className="tab" role="tab" aria-selected={sort === "top"} onClick={() => setSort("top")}>
            {t.board.sortTop}
          </button>
          <button type="button" className="tab" role="tab" aria-selected={sort === "new"} onClick={() => setSort("new")}>
            {t.board.sortNew}
          </button>
        </div>
      </div>

      {postsError && (
        <div className="failed">
          <p>{errorText(t, postsError)}</p>
        </div>
      )}
      {!postsError && !posts && (
        <div className="skeleton">
          <span />
          <span />
          <span />
        </div>
      )}
      {!postsError && posts && posts.length === 0 && (
        <div className="empty">
          <p>{t.board.empty}</p>
        </div>
      )}
      {!postsError && posts && posts.length > 0 && (
        <ul className="post-list">
          {posts.map((p) => (
            <PostRow key={p.id} post={p} boardId={id} user={me.user} turnstileRef={turnstileRef} navigate={navigate} />
          ))}
        </ul>
      )}
    </div>
  );
}
