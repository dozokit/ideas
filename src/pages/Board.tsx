import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { api, ApiError } from "../lib/api";
import { errorText, format, formatDate, statusLabel, useT } from "../i18n";
import type { BoardInfo, BoardSummary, PostSummary, PostType } from "../lib/types";
import type { Navigate } from "../App";

// While one of a board's pages is open, the browser tab shows the board's name and logo.
export function showBoardInTab(board: { name: string; logo: string | null }) {
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')!;
  const before = { title: document.title, href: icon.href, type: icon.type };
  document.title = board.name;
  if (board.logo) {
    icon.href = board.logo;
    icon.type = board.logo.slice("data:".length, board.logo.indexOf(";"));
  }
  return () => {
    document.title = before.title;
    icon.href = before.href;
    icon.type = before.type;
  };
}

// Ideas use the board's statuses, bug reports its bug statuses; both when no type is picked.
export const statusesFor = (board: BoardSummary, type: PostType | "") => (type === "bug" ? board.bugStatuses : type === "idea" ? board.statuses : [...board.statuses, ...board.bugStatuses]);

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

// "Suggest an idea" or "Report a bug": the same side panel, a bug asking a few more things.
function NewPost({ type, boardId, navigate, onAdded }: { type: PostType; boardId: string; navigate: Navigate; onAdded: (p: PostSummary) => void }) {
  const { t } = useT();
  const bug = type === "bug";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expected, setExpected] = useState("");
  const [place, setPlace] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
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
      className={bug ? "btn btn--quiet suggest-btn" : "btn btn--ink suggest-btn"}
      onClick={() => {
        panel.current!.showModal();
        titleInput.current!.focus();
      }}
      data-testid={bug ? "report-bug" : "suggest-idea"}
    >
      {bug ? t.board.reportBug : t.board.suggest}
    </button>
    <dialog ref={panel} className="panel" aria-labelledby={`new-${type}-title`} onClick={(e) => e.target === panel.current && panel.current.close()}>
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          let sent: string | FormData = JSON.stringify({ type, title, body: body || undefined });
          if (bug) {
            sent = new FormData();
            Object.entries({ type, title, body, expected, place }).forEach(([k, v]) => (sent as FormData).set(k, v));
            if (screenshot) sent.set("screenshot", screenshot);
          }
          const post = await api<PostSummary>(`/api/boards/${boardId}/posts`, { method: "POST", body: sent });
          onAdded(post);
          setTitle("");
          setBody("");
          setExpected("");
          setPlace("");
          setScreenshot(null);
          panel.current!.close();
        } catch (err) {
          setError(errorText(t, err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="panel-head">
        <h2 id={`new-${type}-title`}>{bug ? t.board.reportBug : t.board.shareIdea}</h2>
        <button type="button" className="btn btn--quiet btn--small" onClick={() => panel.current!.close()}>
          {t.board.close}
        </button>
      </div>
      {bug && <p className="help">{t.board.bugLead}</p>}
      <div className="field-stack">
        <label className="field">
          <span>{bug ? t.board.bugTitle : t.board.titlePlaceholder}</span>
          <input ref={titleInput} type="text" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={`new-${type}-help`} data-testid="post-title-input" />
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
          <span>{bug ? t.board.bugBody : t.board.bodyPlaceholder}</span>
          <textarea maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} data-testid="post-body-input" />
        </label>
        {bug && (
          <>
            <label className="field">
              <span>{t.board.bugExpected}</span>
              <textarea maxLength={2000} value={expected} onChange={(e) => setExpected(e.target.value)} data-testid="bug-expected" />
            </label>
            <label className="field">
              <span>{t.board.bugPlace}</span>
              <input type="text" maxLength={500} value={place} onChange={(e) => setPlace(e.target.value)} data-testid="bug-place" />
            </label>
            <label className="field">
              <span>{t.board.bugScreenshot}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} data-testid="bug-screenshot" />
            </label>
          </>
        )}
      </div>
      <div className="field-actions">
        <button type="submit" className="btn btn--ink" disabled={busy} data-testid="post-submit">
          {bug ? t.board.bugSubmit : t.board.submit}
        </button>
      </div>
      <p id={`new-${type}-help`} className={error ? "help help--error" : "help"} role="status">
        {error ?? ""}
      </p>
    </form>
    </dialog>
    </>
  );
}

function PostRow({ post, board, member, navigate }: { post: PostSummary; board: BoardSummary; member: boolean; navigate: Navigate }) {
  const boardId = board.id;
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
      <button type="button" className="vote-btn" data-testid="vote-button" disabled={busy} aria-pressed={voted} aria-label={post.type === "bug" ? t.board.meToo : t.board.vote} onClick={vote}>
        <span className="vote-btn-label" aria-hidden="true">▲</span>
        <span className="fig">{votes}</span>
      </button>
      <div className="post-main">
        <a href={`/b/${boardId}/p/${post.id}`} className="post-title" onClick={go}>
          {post.title}
        </a>
        <div className="post-meta">
          {post.type === "bug" && <span className="badge badge--bug">{t.board.bugBadge}</span>}
          <span className={`badge badge--${post.status}`}>{statusLabel(t, statusesFor(board, post.type).find((s) => s.id === post.status) ?? { id: post.status, label: "" })}</span>
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
  const [type, setType] = useState<PostType | "">("");
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

  useEffect(() => (board ? showBoardInTab(board) : undefined), [board]);

  useEffect(() => {
    if (!board) return;
    setPosts(null);
    setPostsError(null);
    const qs = new URLSearchParams({ sort });
    if (filter) qs.set("status", filter);
    if (type) qs.set("type", type);
    api<PostSummary[]>(`/api/boards/${id}/posts?${qs}`).then(setPosts, (e) => setPostsError(e instanceof ApiError ? e : new ApiError("server_error", 500, null)));
  }, [id, board, type, filter, sort]);

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
        {board.member && (
          <div className="new-post-btns">
            {(["bug", "idea"] as const).map((k) => (
              <NewPost key={k} type={k} boardId={id} navigate={navigate} onAdded={(p) => setPosts((ps) => (ps ? [p, ...ps] : [p]))} />
            ))}
          </div>
        )}
      </div>
      <p className="help board-lead">{t.board.lead}</p>

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

      <div className="tabs type-tabs" role="tablist">
        {(["", "idea", "bug"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="tab"
            role="tab"
            aria-selected={type === k}
            onClick={() => {
              setType(k);
              setFilter("");
            }}
            data-testid={`type-${k || "all"}`}
          >
            {{ "": t.board.typeAll, idea: t.board.typeIdeas, bug: t.board.typeBugs }[k]}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <ul className="filters">
          <li>
            <button type="button" className="chip" aria-pressed={filter === ""} onClick={() => setFilter("")}>
              {t.board.filterAll}
            </button>
          </li>
          {statusesFor(board, type).map((s) => (
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
          <p>{type === "bug" ? t.board.emptyBugs : type === "idea" ? t.board.emptyIdeas : t.board.empty}</p>
        </div>
      )}
      {!postsError && posts && posts.length > 0 && (
        <ul className="post-list">
          {posts.map((p) => (
            <PostRow key={p.id} post={p} board={board} member={board.member} navigate={navigate} />
          ))}
        </ul>
      )}
    </div>
  );
}
