import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { errorText, format, useT } from "../i18n";
import type { BoardStatus, BoardSummary, Visibility } from "../lib/types";
import { TurnOnUpdates } from "./TurnOnUpdates";
import { ChangePassword } from "./Password";

// The colour picker's starting point when a board has none: the app's own accent (--color-accent-2).
const DEFAULT_COLOR = "#bb3d31";

function mintSnippet(boardId: string, audience: string, secret: string): string {
  return [
    `const crypto = require("crypto");`,
    `const b64url = (buf) => buf.toString("base64url");`,
    `const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256" })));`,
    `const payload = b64url(Buffer.from(JSON.stringify({`,
    `  name: "<their name>", email: "<their email>", sub: "<their id in your product>",`,
    `  iss: "${boardId}", aud: "${audience}", exp: Math.floor(Date.now() / 1000) + 120, jti: crypto.randomUUID(),`,
    `})));`,
    `const sig = crypto.createHmac("sha256", "${secret}").update(header + "." + payload).digest("base64url");`,
    `const url = \`${audience}/sso?token=\${header}.\${payload}.\${sig}&return_to=/b/${boardId}\`;`,
  ].join("\n");
}

// Read as a data URL, saved with the board and only ever shown as <img src>.
function LogoField({ logo, onChange }: { logo: string | null; onChange: (logo: string | null) => void }) {
  const { t } = useT();
  const [tooBig, setTooBig] = useState(false);
  return (
    <div className="logo-field">
      <label className="field">
        <span>{t.admin.fieldLogo}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setTooBig(file.size > 200 * 1024);
            if (file.size > 200 * 1024) return;
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {logo && (
        <span className="logo-preview">
          <img className="board-logo" src={logo} alt="" />
          <button type="button" className="link-btn" onClick={() => onChange(null)}>
            {t.admin.logoRemove}
          </button>
        </span>
      )}
      <p className={tooBig ? "help help--error" : "help"}>{tooBig ? t.err.invalid_logo : t.admin.logoHelp}</p>
    </div>
  );
}

function AdminBoardPanel({ board, onSaved }: { board: BoardSummary; onSaved: (b: BoardSummary) => void }) {
  const { t } = useT();
  const link = `${location.origin}/b/${board.id}`;
  const [visibility, setVisibility] = useState<Visibility>(board.visibility);
  const [logo, setLogo] = useState(board.logo);
  const [color, setColor] = useState(board.color);
  const [statuses, setStatuses] = useState<BoardStatus[]>(board.statuses);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
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
      const b = await api<BoardSummary>(`/api/boards/${board.id}`, { method: "PATCH", body: JSON.stringify({ visibility, logo, color, statuses }) });
      onSaved(b);
      setStatuses(b.statuses);
      setSaveMsg(t.admin.saved);
    } catch (err) {
      setSaveMsg(errorText(t, err));
    } finally {
      setSaveBusy(false);
    }
  }

  const move = (i: number, j: number) =>
    setStatuses((ss) => {
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

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
        <span className={board.visibility === "team" ? "badge badge--team" : "badge"}>{board.visibility === "team" ? t.admin.visibilityTeam : t.admin.visibilityPublic}</span>
      </div>
      <div className="sso-row board-link">
        <code className="sso-secret">{link}</code>
        <button
          type="button"
          className="btn btn--quiet btn--small"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 1500);
          }}
        >
          {linkCopied ? t.admin.ssoCopied : t.admin.copyLink}
        </button>
        <a className="btn btn--quiet btn--small" href={link} target="_blank" rel="noopener">
          {t.admin.openLink}
        </a>
      </div>
      <form onSubmit={save}>
        <div className="field-stack">
          <label className="field">
            <span>{t.admin.fieldVisibility}</span>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
              <option value="public">{t.admin.visibilityPublic}</option>
              <option value="team">{t.admin.visibilityTeam}</option>
            </select>
          </label>
          <p className="help">{t.admin.visibilityHelp}</p>
          <LogoField logo={logo} onChange={setLogo} />
          <label className="field">
            <span>{t.admin.fieldColor}</span>
            <input type="color" value={color ?? DEFAULT_COLOR} onChange={(e) => setColor(e.target.value)} />
          </label>
          <fieldset className="statuses">
            <legend>{t.admin.statusesTitle}</legend>
            {statuses.map((s, i) => (
              <div className="status-row" key={s.id}>
                <input
                  type="text"
                  maxLength={40}
                  aria-label={t.admin.statusName}
                  placeholder={(t.status as Record<string, string>)[s.id] ?? ""}
                  value={s.label}
                  onChange={(e) => setStatuses((ss) => ss.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
                  data-testid="status-label"
                />
                <button type="button" className="btn btn--quiet btn--small" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  {t.admin.statusUp}
                </button>
                <button type="button" className="btn btn--quiet btn--small" disabled={i === statuses.length - 1} onClick={() => move(i, i + 1)}>
                  {t.admin.statusDown}
                </button>
                <button type="button" className="btn btn--quiet btn--small" disabled={statuses.length === 1} onClick={() => setStatuses((ss) => ss.filter((x) => x.id !== s.id))}>
                  {t.admin.statusRemove}
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="btn btn--quiet btn--small" onClick={() => setStatuses((ss) => [...ss, { id: crypto.randomUUID().slice(0, 8), label: "" }])}>
                {t.admin.statusAdd}
              </button>
            </div>
            <p className="help">{t.admin.statusesHelp}</p>
          </fieldset>
        </div>
        <div className="field-actions">
          <button type="submit" className="btn btn--ink" disabled={saveBusy}>
            {t.admin.save}
          </button>
        </div>
        <p className={saveMsg && saveMsg !== t.admin.saved ? "help help--error" : "help"} role="status">
          {saveMsg ?? ""}
        </p>
      </form>

      <details className="developer">
        <summary>{t.admin.developerTitle}</summary>
        <p className="help">{t.admin.developerLead}</p>
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
      </details>
    </div>
  );
}

// On by default: once a day the admin page asks dozokit.com whether a newer version is out.
function ShareCount({ initial }: { initial: boolean | undefined }) {
  const { t } = useT();
  const [share, setShare] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const on = share ?? initial ?? true;
  return (
    <div className="share-count">
      <label>
        <input
          type="checkbox"
          checked={on}
          disabled={initial === undefined}
          onChange={async (e) => {
            const next = e.target.checked;
            setShare(next);
            setError(null);
            try {
              await api("/api/version", { method: "PUT", body: JSON.stringify({ share: next }) });
            } catch (err) {
              setShare(!next);
              setError(errorText(t, err));
            }
          }}
          data-testid="share-count"
        />{" "}
        {t.admin.shareLabel}
      </label>
      <p className={error ? "help help--error" : "help"} role="status">
        {error ?? t.admin.shareHelp}
      </p>
    </div>
  );
}

export function Admin() {
  const { t } = useT();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [release, setRelease] = useState<{ version: string; latest: string | null; share: boolean } | null>(null);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [logo, setLogo] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    api<BoardSummary[]>("/api/boards").then(setBoards, (e) => setError(errorText(t, e)));
    api<typeof release>("/api/version").then(setRelease, () => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    setCreateError(null);
    try {
      const b = await api<BoardSummary>("/api/boards", { method: "POST", body: JSON.stringify({ id, name, visibility, logo, color }) });
      setBoards((bs) => [b, ...(bs ?? [])]);
      setId("");
      setName("");
      setVisibility("public");
      setLogo(null);
      setColor(null);
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
            <input type="text" required pattern="[a-z0-9-]{2,40}" value={id} onChange={(e) => setId(e.target.value)} aria-describedby="board-link-preview" data-testid="board-id-input" />
          </label>
          <p id="board-link-preview" className="help">
            <code>
              {location.origin}/b/{id || "…"}
            </code>
          </p>
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
          <p className="help">{t.admin.visibilityHelp}</p>
          <LogoField logo={logo} onChange={setLogo} />
          <label className="field">
            <span>{t.admin.fieldColor}</span>
            <input type="color" value={color ?? DEFAULT_COLOR} onChange={(e) => setColor(e.target.value)} />
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
        <ShareCount initial={release?.share} />
      </section>

      <section className="page-section">
        <h2>{t.admin.versionTitle}</h2>
        {release && <p className="help">{format(t.admin.versionLine, { version: release.version })}</p>}
        {release?.latest && <p className="update">{format(t.admin.latestAvailable, { latest: release.latest })}</p>}
      </section>

      <section className="page-section">
        <ChangePassword />
      </section>
    </div>
  );
}
