import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { api, ApiError } from "../lib/api";
import { errorText, format, formatDate, statusLabel, useT } from "../i18n";
import type { BoardInfo, BoardStatus, PostSummary } from "../lib/types";
import type { Navigate } from "../App";

// What someone outside a private board sees: nothing of it, only where to open it from.
export function NoAccess() {
  const { t } = useT();
  return (
    <div className="gate stock">
      <h1>{t.auth.noAccessTitle}</h1>
      <p className="help">{t.auth.noAccess}</p>
    </div>
  );
}

function NewIdea({ boardId, navigate, onAdded }: { boardId: string; navigate: Navigate; onAdded: (p: PostSummary) => void }) {
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [similar, setSimilar] = useState<{ id: number; title: string; votes: number }[]>([]);
  const panel = useRef<HTMLDialogElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);

  // Ideas already on the board that match the title being typed, so people vote instead of repeating them.
  useEffect(() => {
    const q = title.trim();
    if (q.length < 3) return setSimilar([]);
    let live = true;
    const timer = setTimeout(() => {
      api<typeof similar>(`/api/boards/${boardId}/similar?q=${encodeURIComponent(q)}`).then((ps) => live && setSimilar(ps), () => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [boardId, title]);

  // A modal <dialog>: Escape closes it and focus goes back to the button; a click on the backdrop
  // (the dialog itself, outside its form) closes it too.
  return (
    <>
    <button
      type="button"
      className="btn btn--ink suggest-btn"
      onClick={() => {
        panel.current!.showModal();
        titleInput.current!.focus();
      }}
      data-testid="suggest-idea"
    >
      {t.board.suggest}
    </button>
    <dialog ref={panel} className="panel" aria-labelledby="new-idea-title" onClick={(e) => e.target === panel.current && panel.current.close()}>
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const post = await api<PostSummary>(`/api/boards/${boardId}/posts`, { method: "POST", body: JSON.stringify({ title, body: body || undefined }) });
          onAdded(post);
          setTitle("");
          setBody("");
          panel.current!.close();
        } catch (err) {
          setError(errorText(t, err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="panel-head">
        <h2 id="new-idea-title">{t.board.shareIdea}</h2>
        <button type="button" className="btn btn--quiet btn--small" onClick={() => panel.current!.close()}>
          {t.board.close}
        </button>
      </div>
      <div className="field-stack">
        <label className="field">
          <span>{t.board.titlePlaceholder}</span>
          <input ref={titleInput} type="text" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(error)} aria-describedby="new-idea-help" data-testid="post-title-input" />
        </label>
        {similar.length > 0 && (
          <div className="similar" data-testid="similar">
            <p className="help">{t.board.similarLead}</p>
            <ul>
              {similar.map((p) => (
                <li key={p.id}>
                  <a
                    href={`/b/${boardId}/p/${p.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/b/${boardId}/p/${p.id}`);
                    }}
                  >
                    {p.title}
                  </a>{" "}
                  <span className="help">{format(t.board.votes, { n: p.votes })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
    </dialog>
    </>
  );
}

function PostRow({ post, boardId, statuses, member, navigate }: { post: PostSummary; boardId: string; statuses: BoardStatus[]; member: boolean; navigate: Navigate }) {
  const { t, lang } = useT();
  const [voted, setVoted] = useState(post.voted);
  const [votes, setVotes] = useState(post.votes);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // A second press takes the vote back.
  async function vote() {
    if (!member) {
      setMsg(t.board.membersOnly);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/posts/${post.id}/vote`, { method: voted ? "DELETE" : "POST" });
      setVotes((v) => (voted ? v - 1 : v + 1));
      setVoted(!voted);
    } catch (err) {
      setMsg(errorText(t, err));
      if (err instanceof ApiError && err.code === "already_voted") setVoted(true);
    } finally {
      setBusy(false);
    }
  }

  const go = (e: MouseEvent) => {
    e.preventDefault();
    navigate(`/b/${boardId}/p/${post.id}`);
  };

  return (
    <li className="post-row stock">
      <button type="button" className="vote-btn" data-testid="vote-button" disabled={busy} aria-pressed={voted} onClick={vote}>
        <span className="fig">{votes}</span>
        <span className="vote-btn-label">{voted ? t.board.voted : t.board.vote}</span>
      </button>
      <div className="post-main">
        <a href={`/b/${boardId}/p/${post.id}`} className="post-title" onClick={go}>
          {post.title}
        </a>
        <div className="post-meta">
          <span className={`badge badge--${post.status}`}>{statusLabel(t, statuses.find((s) => s.id === post.status) ?? { id: post.status, label: "" })}</span>
          <span>{format(t.board.by, { name: post.author, date: formatDate(post.createdAt, lang) })}</span>
          <a href={`/b/${boardId}/p/${post.id}`} className="post-comments" onClick={go}>
            {format(t.board.comments, { n: post.comments })}
          </a>
        </div>
        {msg && <p className="help help--error">{msg}</p>}
      </div>
    </li>
  );
}

export function Board({ id, admin, navigate }: { id: string; admin: boolean; navigate: Navigate }) {
  const { t, setLang } = useT();
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [boardError, setBoardError] = useState<ApiError | null>(null);
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [postsError, setPostsError] = useState<ApiError | null>(null);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<"top" | "new">("top");

  useEffect(() => {
    setBoard(null);
    setBoardError(null);
    api<BoardInfo>(`/api/boards/${id}`).then(setBoard, (e) => setBoardError(e instanceof ApiError ? e : new ApiError("server_error", 500, null)));
  }, [id]);

  // Visitors see a board set to one language in that language; the admin keeps their own.
  useEffect(() => {
    if (!admin && board?.lang) setLang(board.lang);
  }, [admin, board, setLang]);

  useEffect(() => {
    if (!board) return;
    setPosts(null);
    setPostsError(null);
    const qs = new URLSearchParams({ sort });
    if (filter) qs.set("status", filter);
    api<PostSummary[]>(`/api/boards/${id}/posts?${qs}`).then(setPosts, (e) => setPostsError(e instanceof ApiError ? e : new ApiError("server_error", 500, null)));
  }, [id, board, filter, sort]);

  if (boardError) {
    if (boardError.code === "team_only") return <NoAccess />;
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

  const [beforeProduct, afterProduct] = t.board.membersOnlyProduct.split("{product}");

  return (
    <div className="board-page" style={board.color ? ({ "--color-accent": board.color, "--color-accent-2": board.color } as CSSProperties) : undefined}>
      <div className="section-head board-head">
        {board.logo && <img className="board-logo" src={board.logo} alt="" />}
        <h1>
          {board.name} {board.visibility === "team" && <span className="badge badge--team">{t.boards.visibilityTeam}</span>}
        </h1>
        {board.member && <NewIdea boardId={id} navigate={navigate} onAdded={(p) => setPosts((ps) => (ps ? [p, ...ps] : [p]))} />}
      </div>

      {!board.member && (
        <p className="members-only stock">
          {board.productName ? (
            <>
              {beforeProduct}
              {board.productUrl ? <a href={board.productUrl} rel="noopener">{board.productName}</a> : board.productName}
              {afterProduct}
            </>
          ) : (
            t.board.membersOnly
          )}
        </p>
      )}

      <div className="toolbar">
        <ul className="filters">
          <li>
            <button type="button" className="chip" aria-pressed={filter === ""} onClick={() => setFilter("")}>
              {t.board.filterAll}
            </button>
          </li>
          {board.statuses.map((s) => (
            <li key={s.id}>
              <button type="button" className="chip" aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>
                {statusLabel(t, s)}
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
            <PostRow key={p.id} post={p} boardId={id} statuses={board.statuses} member={board.member} navigate={navigate} />
          ))}
        </ul>
      )}
    </div>
  );
}
