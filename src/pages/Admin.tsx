import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { errorText, format, useT } from "../i18n";
import type { BoardSummary, Me, Visibility } from "../lib/types";
import { SignIn } from "./SignIn";
import { TurnOnUpdates } from "./TurnOnUpdates";

function mintSnippet(boardId: string, audience: string, secret: string): string {
  return [
    `const crypto = require("crypto");`,
    `const b64url = (buf) => buf.toString("base64url");`,
    `const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256" })));`,
    `const payload = b64url(Buffer.from(JSON.stringify({`,
    `  iss: "${boardId}", aud: "${audience}", sub: "<user id>", email: "<email>", name: "<name>",`,
    `  exp: Math.floor(Date.now() / 1000) + 120, jti: crypto.randomUUID(),`,
    `})));`,
    `const sig = crypto.createHmac("sha256", "${secret}").update(header + "." + payload).digest("base64url");`,
    `const url = \`${audience}/sso?token=\${header}.\${payload}.\${sig}&return_to=/b/${boardId}\`;`,
  ].join("\n");
}

function AdminBoardPanel({ board, onSaved }: { board: BoardSummary; onSaved: (b: BoardSummary) => void }) {
  const { t } = useT();
  const [visibility, setVisibility] = useState<Visibility>(board.visibility);
  const [domains, setDomains] = useState(board.allowedDomains);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [sso, setSso] = useState<{ secret: string; audience: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [ssoBusy, setSsoBusy] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      const b = await api<BoardSummary>(`/api/boards/${board.id}`, { method: "PATCH", body: JSON.stringify({ visibility, allowedDomains: domains }) });
      onSaved(b);
      setSaveMsg(t.admin.saved);
    } catch (err) {
      setSaveMsg(errorText(t, err));
    } finally {
      setSaveBusy(false);
    }
  }

  async function reveal() {
    setSsoError(null);
    if (!sso) {
      setSsoBusy(true);
      try {
        setSso(await api(`/api/boards/${board.id}/sso`));
      } catch (err) {
        setSsoError(errorText(t, err));
        setSsoBusy(false);
        return;
      }
      setSsoBusy(false);
    }
    setRevealed(true);
  }

  async function rotate() {
    setSsoBusy(true);
    setSsoError(null);
    try {
      const r = await api<{ secret: string }>(`/api/boards/${board.id}/rotate-secret`, { method: "POST" });
      setSso((s) => ({ secret: r.secret, audience: s?.audience ?? location.origin }));
      setRevealed(true);
    } catch (err) {
      setSsoError(errorText(t, err));
    } finally {
      setSsoBusy(false);
      setConfirmRotate(false);
    }
  }

  async function copySnippet() {
    if (!sso) return;
    await navigator.clipboard.writeText(mintSnippet(board.id, sso.audience, sso.secret));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="admin-board">
      <div className="admin-board-head">
        <h3>{board.name}</h3>
        <span className="path">{board.id}</span>
        {board.visibility === "team" && <span className="badge badge--team">{t.boards.visibilityTeam}</span>}
      </div>
      <div className="admin-board-grid">
        <form onSubmit={save}>
          <div className="field-stack">
            <label className="field">
              <span>{t.admin.fieldVisibility}</span>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                <option value="public">{t.admin.visibilityPublic}</option>
                <option value="team">{t.admin.visibilityTeam}</option>
              </select>
            </label>
            <label className="field">
              <span>{t.admin.fieldDomains}</span>
              <input type="text" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="example.com, example.org" />
            </label>
          </div>
          <div className="field-actions">
            <button type="submit" className="btn btn--ink" disabled={saveBusy}>
              {t.admin.save}
            </button>
          </div>
          <p className={saveMsg && saveMsg !== t.admin.saved ? "help help--error" : "help"} role="status">
            {saveMsg ?? t.admin.domainsHelp}
          </p>
        </form>

        <div>
          <h4>{t.admin.ssoTitle}</h4>
          <div className="sso-row">
            {revealed && sso ? (
              <>
                <code className="sso-secret">{sso.secret}</code>
                <button type="button" className="btn btn--quiet btn--small" onClick={() => setRevealed(false)}>
                  {t.admin.ssoHide}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--quiet btn--small" disabled={ssoBusy} onClick={reveal}>
                {t.admin.ssoReveal}
              </button>
            )}
            {confirmRotate ? (
              <>
                <span className="help">{t.admin.ssoRotateConfirm}</span>
                <button type="button" className="btn btn--danger btn--small" disabled={ssoBusy} onClick={rotate}>
                  {t.admin.ssoRotate}
                </button>
                <button type="button" className="btn btn--quiet btn--small" onClick={() => setConfirmRotate(false)}>
                  {t.post.deleteCancel}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--quiet btn--small" onClick={() => setConfirmRotate(true)}>
                {t.admin.ssoRotate}
              </button>
            )}
          </div>
          {ssoError && <p className="help help--error">{ssoError}</p>}
          {sso && (
            <>
              <p className="help">
                {t.admin.ssoAudience}: <code>{sso.audience}</code>
              </p>
              <h4>{t.admin.ssoSnippetTitle}</h4>
              <div className="code">
                <pre>
                  <code>{mintSnippet(board.id, sso.audience, revealed ? sso.secret : "<secret>")}</code>
                </pre>
                <button type="button" className="btn btn--quiet btn--small code-copy" disabled={!revealed} onClick={copySnippet}>
                  {copied ? t.admin.ssoCopied : t.admin.ssoCopy}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function Admin({ me }: { me: Me }) {
  const { t } = useT();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [domains, setDomains] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    if (!me.user?.admin) return;
    api<BoardSummary[]>("/api/boards").then(setBoards, (e) => setError(errorText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.user?.admin]);

  if (!me.user) {
    return (
      <div>
        <p className="help">{t.admin.notAdmin}</p>
        <SignIn config={me.config} returnTo="/admin" compact />
      </div>
    );
  }
  if (!me.user.admin) {
    return <p className="help">{t.admin.notAdmin}</p>;
  }

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    setCreateError(null);
    try {
      const b = await api<BoardSummary>("/api/boards", { method: "POST", body: JSON.stringify({ id, name, visibility, allowedDomains: domains }) });
      setBoards((bs) => [b, ...(bs ?? [])]);
      setId("");
      setName("");
      setVisibility("public");
      setDomains("");
    } catch (err) {
      setCreateError(errorText(t, err));
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="settings">
      <h1>{t.admin.title}</h1>

      <form className="page-section" onSubmit={createBoard}>
        <h2>{t.admin.newBoardTitle}</h2>
        <div className="field-stack">
          <label className="field">
            <span>{t.admin.fieldId}</span>
            <input type="text" required pattern="[a-z0-9-]{2,40}" value={id} onChange={(e) => setId(e.target.value)} data-testid="board-id-input" />
          </label>
          <label className="field">
            <span>{t.admin.fieldName}</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} data-testid="board-name-input" />
          </label>
          <label className="field">
            <span>{t.admin.fieldVisibility}</span>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
              <option value="public">{t.admin.visibilityPublic}</option>
              <option value="team">{t.admin.visibilityTeam}</option>
            </select>
          </label>
          <label className="field">
            <span>{t.admin.fieldDomains}</span>
            <input type="text" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="example.com, example.org" />
          </label>
        </div>
        <div className="field-actions">
          <button type="submit" className="btn btn--ink" disabled={createBusy} data-testid="board-create-submit">
            {t.admin.createSubmit}
          </button>
        </div>
        <p className={createError ? "help help--error" : "help"} role="status">
          {createError ?? t.admin.fieldIdHelp}
        </p>
      </form>

      <section className="page-section">
        <h2>{t.boards.title}</h2>
        {error && <p className="help help--error">{error}</p>}
        {!error && !boards && (
          <div className="skeleton">
            <span />
            <span />
          </div>
        )}
        {!error && boards && boards.length === 0 && <p className="help">{t.boards.empty}</p>}
        {!error && boards && boards.length > 0 && (
          <div className="admin-board-list">
            {boards.map((b) => (
              <AdminBoardPanel key={b.id} board={b} onSaved={(nb) => setBoards((bs) => (bs ?? []).map((x) => (x.id === nb.id ? nb : x)))} />
            ))}
          </div>
        )}
      </section>

      <section className="page-section">
        <h2>{t.admin.updatesTitle}</h2>
        <TurnOnUpdates />
      </section>

      <section className="page-section">
        <h2>{t.admin.versionTitle}</h2>
        <p className="help">{format(t.admin.versionLine, { version: me.version })}</p>
        {me.latest && <p className="update">{format(t.admin.latestAvailable, { latest: me.latest })}</p>}
      </section>
    </div>
  );
}
