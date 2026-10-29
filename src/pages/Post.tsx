import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { api, ApiError } from "../lib/api";
import { errorText, format, formatDate, statusLabel, useT } from "../i18n";
import type { Comment, Me, PostPage, PostSummary } from "../lib/types";
import type { Navigate } from "../App";
import { NoAccess } from "./Board";

export function Post({ boardId, postId, me, navigate }: { boardId: string; postId: number; me: Me; navigate: Navigate }) {
  const { t, lang, setLang } = useT();
  const [page, setPage] = useState<PostPage | null>(null);
  const [pageError, setPageError] = useState<ApiError | null>(null);

  const [status, setStatus] = useState("");
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);

  const [voteMsg, setVoteMsg] = useState<string | null>(null);
  const [voteBusy, setVoteBusy] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentBusy, setCommentBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [others, setOthers] = useState<PostSummary[] | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setPage(null);
    setPageError(null);
    api<PostPage>(`/api/posts/${postId}`).then(setPage, (e) => setPageError(e instanceof ApiError ? e : new ApiError("server_error", 500, null)));
  }, [postId]);

  useEffect(() => {
    if (!page) return;
    if (!me.admin && page.board.lang) setLang(page.board.lang);
    setStatus(page.post.status);
    setVoted(page.post.voted);
    setVotes(page.post.votes);
    setComments(page.comments);
  }, [page, me.admin, setLang]);

  useEffect(() => {
    if (!page || !me.admin) return;
    api<PostSummary[]>(`/api/boards/${boardId}/posts?sort=new`).then(
      (ps) => setOthers(ps.filter((p) => p.id !== postId)),
      () => setOthers([]),
    );
  }, [page, me.admin, boardId, postId]);

  const back = (e: MouseEvent) => {
    e.preventDefault();
    navigate(`/b/${boardId}`);
  };

  if (pageError) {
    if (pageError.code === "team_only") return <NoAccess />;
    return (
      <div className="failed">
        <p>{pageError.code === "not_found" ? t.post.gone : errorText(t, pageError)}</p>
        <a className="crumb" href={`/b/${boardId}`} onClick={back}>
          ← {t.post.back}
        </a>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="skeleton">
        <span />
        <span />
        <span />
      </div>
    );
  }

  const statuses = page.board.statuses;

  // A second press takes the vote back.
  async function vote() {
    if (!page!.member) {
      setVoteMsg(t.post.membersOnly);
      return;
    }
    setVoteBusy(true);
    setVoteMsg(null);
    try {
      await api(`/api/posts/${postId}/vote`, { method: voted ? "DELETE" : "POST" });
      setVotes((v) => (voted ? v - 1 : v + 1));
      setVoted(!voted);
    } catch (err) {
      setVoteMsg(errorText(t, err));
      if (err instanceof ApiError && err.code === "already_voted") setVoted(true);
    } finally {
      setVoteBusy(false);
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    setCommentBusy(true);
    setCommentError(null);
    try {
      const c = await api<Comment>(`/api/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body: commentBody }) });
      setComments((cs) => [...cs, c]);
      setCommentBody("");
    } catch (err) {
      setCommentError(errorText(t, err));
    } finally {
      setCommentBusy(false);
    }
  }

  async function deleteComment(id: number) {
    await api(`/api/comments/${id}`, { method: "DELETE" }).catch(() => {});
    setComments((cs) => cs.filter((c) => c.id !== id));
  }

  async function changeStatus(next: string) {
    const prev = status;
    setStatus(next);
    setStatusBusy(true);
    setStatusError(null);
    try {
      await api(`/api/posts/${postId}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    } catch (err) {
      setStatus(prev);
      setStatusError(errorText(t, err));
    } finally {
      setStatusBusy(false);
    }
  }

  async function submitMerge(e: FormEvent) {
    e.preventDefault();
    if (!mergeTarget) return;
    setMergeBusy(true);
    setMergeError(null);
    try {
      const r = await api<{ ok: true; id: number }>(`/api/posts/${postId}/merge`, { method: "POST", body: JSON.stringify({ into: Number(mergeTarget) }) });
      navigate(`/b/${boardId}/p/${r.id}`, true);
    } catch (err) {
      setMergeError(errorText(t, err));
      setMergeBusy(false);
    }
  }

  async function confirmedDelete() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api(`/api/posts/${postId}`, { method: "DELETE" });
      navigate(`/b/${boardId}`, true);
    } catch (err) {
      setDeleteError(errorText(t, err));
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <a className="crumb" href={`/b/${boardId}`} onClick={back}>
        ← {t.post.back}
      </a>

      <div className="post-head">
        <div className="post-head-top">
          <button type="button" className="vote-btn" data-testid="vote-button" disabled={voteBusy} aria-pressed={voted} onClick={vote}>
            <span className="fig">{votes}</span>
            <span className="vote-btn-label">{voted ? t.board.voted : t.board.vote}</span>
          </button>
          <h1>{page.post.title}</h1>
          {status !== statuses[0].id && <span className={`badge badge--${status}`}>{statusLabel(t, statuses.find((s) => s.id === status) ?? { id: status, label: "" })}</span>}
        </div>
        {voteMsg && <p className="help help--error">{voteMsg}</p>}
        <p className="help">{format(t.board.by, { name: page.post.author, date: formatDate(page.post.createdAt, lang) })}</p>
        {page.post.body && <p className="post-body">{page.post.body}</p>}
      </div>

      {me.admin && (
        <div className="page-section">
          <h2>{t.admin.title}</h2>
          <div className="field-row">
            <label className="field">
              <span>{t.post.adminStatus}</span>
              <select data-testid="status-select" value={status} disabled={statusBusy} onChange={(e) => changeStatus(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {statusLabel(t, s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {statusError && <p className="help help--error">{statusError}</p>}

          <form className="field-row" onSubmit={submitMerge}>
            <label className="field">
              <span>{t.post.adminMerge}</span>
              <select data-testid="merge-select" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
                <option value="">{t.post.mergePlaceholder}</option>
                {(others ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn--quiet" disabled={!mergeTarget || mergeBusy} data-testid="merge-submit">
              {t.post.mergeSubmit}
            </button>
          </form>
          {mergeError && <p className="help help--error">{mergeError}</p>}

          <div className="danger">
            {confirmDelete ? (
              <>
                <span>{t.post.deleteConfirm}</span>
                <button type="button" className="btn btn--danger btn--small" disabled={deleteBusy} onClick={confirmedDelete} data-testid="delete-post">
                  {t.post.deleteConfirmSubmit}
                </button>
                <button type="button" className="btn btn--quiet btn--small" onClick={() => setConfirmDelete(false)}>
                  {t.post.deleteCancel}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--quiet btn--small" onClick={() => setConfirmDelete(true)}>
                {t.post.delete}
              </button>
            )}
          </div>
          {deleteError && <p className="help help--error">{deleteError}</p>}
        </div>
      )}

      <div className="page-section">
        <h2>{t.post.commentsTitle}</h2>
        {comments.length === 0 && <p className="help">{t.post.noComments}</p>}
        {comments.length > 0 && (
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className={c.official ? "comment comment--official" : "comment"}>
                <div className="comment-meta">
                  <span className="comment-author">{c.author}</span>
                  {c.official && <span className="badge badge--team">{t.post.official}</span>}
                  <span>{formatDate(c.createdAt, lang)}</span>
                  {me.admin && (
                    <button type="button" className="link-btn" data-testid="delete-comment" onClick={() => deleteComment(c.id)}>
                      {t.post.deleteComment}
                    </button>
                  )}
                </div>
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        {page.member ? (
          <form onSubmit={submitComment}>
            <label className="field">
              <span>{t.post.commentPlaceholder}</span>
              <textarea maxLength={1000} required value={commentBody} onChange={(e) => setCommentBody(e.target.value)} data-testid="comment-input" />
            </label>
            <div className="field-actions">
              <button type="submit" className="btn btn--ink" disabled={commentBusy} data-testid="comment-submit">
                {t.post.commentSubmit}
              </button>
            </div>
            <p className={commentError ? "help help--error" : "help"}>{commentError ?? ""}</p>
          </form>
        ) : (
          <p className="members-only stock">{t.post.membersOnly}</p>
        )}
      </div>
    </div>
  );
}
