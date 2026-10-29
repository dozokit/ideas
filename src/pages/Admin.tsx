import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { LANGS, errorText, format, useT, type Lang } from "../i18n";
import type { BoardStatus, BoardSummary, DevToken, Visibility } from "../lib/types";
import { TurnOnUpdates } from "./TurnOnUpdates";
import { ChangePassword } from "./Password";
import type { Navigate } from "../App";

// The colour picker's starting point when a board has none: the app's own accent (--color-accent-2).
const DEFAULT_COLOR = "#bb3d31";

const WORKERS = "https://dash.cloudflare.com/?to=/:account/workers-and-pages";
const ONBOARD = "https://dash.cloudflare.com/?to=/:account/domains/overview";

// Cloudflare's own button and tab names, written **like this** in the steps, show in bold.
const bold = (text: string) => text.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));

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

// A board's full link, with Copy and Open.
function BoardLink({ id, address }: { id: string; address: string }) {
  const { t } = useT();
  const link = `${address}/b/${id}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="sso-row">
      <code className="sso-secret">{link}</code>
      <button
        type="button"
        className="btn btn--quiet btn--small"
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? t.admin.ssoCopied : t.admin.copyLink}
      </button>
      <a className="btn btn--quiet btn--small" href={link} target="_blank" rel="noopener">
        {t.admin.openLink}
      </a>
    </div>
  );
}

// One list of statuses (ideas' or bugs'): rename, reorder, remove, add.
function StatusList({ statuses, onChange }: { statuses: BoardStatus[]; onChange: (s: BoardStatus[]) => void }) {
  const { t } = useT();
  const move = (i: number, j: number) => {
    const next = [...statuses];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <fieldset className="statuses">
      {statuses.map((s, i) => (
        <div className="status-row" key={s.id}>
          <input
            type="text"
            maxLength={40}
            aria-label={t.admin.statusName}
            placeholder={(t.status as Record<string, string>)[s.id] ?? ""}
            value={s.label}
            onChange={(e) => onChange(statuses.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
            data-testid="status-label"
          />
          <button type="button" className="btn btn--quiet btn--small" disabled={i === 0} onClick={() => move(i, i - 1)}>
            {t.admin.statusUp}
          </button>
          <button type="button" className="btn btn--quiet btn--small" disabled={i === statuses.length - 1} onClick={() => move(i, i + 1)}>
            {t.admin.statusDown}
          </button>
          <button type="button" className="btn btn--quiet btn--small" disabled={statuses.length === 1} onClick={() => onChange(statuses.filter((x) => x.id !== s.id))}>
            {t.admin.statusRemove}
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="btn btn--quiet btn--small" onClick={() => onChange([...statuses, { id: crypto.randomUUID().slice(0, 8), label: "" }])}>
          {t.admin.statusAdd}
        </button>
      </div>
    </fieldset>
  );
}

// Connect → For your developers: tokens that let a coding assistant read this board through /mcp.
function DevTokens({ id, address }: { id: string; address: string }) {
  const { t, lang } = useT();
  const [tokens, setTokens] = useState<DevToken[] | null>(null);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<DevToken | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<DevToken[]>(`/api/boards/${id}/tokens`).then(setTokens, (e) => setError(errorText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const tok = await api<DevToken>(`/api/boards/${id}/tokens`, { method: "POST", body: JSON.stringify({ name }) });
      setFresh(tok);
      setTokens((ts) => [tok, ...(ts ?? [])]);
      setName("");
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(tokenId: number) {
    setError(null);
    try {
      await api(`/api/tokens/${tokenId}`, { method: "DELETE" });
      setTokens((ts) => (ts ?? []).filter((x) => x.id !== tokenId));
      if (fresh?.id === tokenId) setFresh(null);
    } catch (err) {
      setError(errorText(t, err));
    }
  }

  // What any MCP client needs (the address and the header), then Claude Code's one-line command as an example.
  const connection =
    fresh &&
    [`${t.admin.devAddress}: ${address}/mcp`, `${t.admin.devHeader}: Authorization: Bearer ${fresh.token}`, "", `Claude Code: claude mcp add --transport http ${id}-ideas ${address}/mcp --header "Authorization: Bearer ${fresh.token}"`].join("\n");

  return (
    <div className="dev-tokens">
      <h2 className="steps-title">{t.admin.devTitle}</h2>
      <p className="help">{t.admin.devLead}</p>
      <form className="field-row" onSubmit={create}>
        <label className="field">
          <span>{t.admin.devTokenName}</span>
          <input type="text" required maxLength={60} placeholder={t.admin.devTokenNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} data-testid="token-name" />
        </label>
        <button type="submit" className="btn btn--ink" disabled={busy} data-testid="token-create">
          {t.admin.devTokenCreate}
        </button>
      </form>
      {connection && (
        <div className="dev-token-fresh stock" data-testid="token-fresh">
          <p className="help">{t.admin.devTokenOnce}</p>
          <pre className="sso-secret dev-token-connection">{connection}</pre>
          <div className="sso-row">
            <button
              type="button"
              className="btn btn--quiet btn--small"
              onClick={async () => {
                await navigator.clipboard.writeText(connection);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? t.admin.ssoCopied : t.admin.devCopy}
            </button>
          </div>
        </div>
      )}
      {tokens && tokens.length > 0 && (
        <ul className="dev-token-list">
          {tokens.map((x) => (
            <li key={x.id}>
              <strong>{x.name}</strong>{" "}
              <span className="help">{x.lastUsedAt ? format(t.admin.devTokenUsed, { date: new Date(x.lastUsedAt).toLocaleDateString(lang) }) : t.admin.devTokenNeverUsed}</span>
              <button type="button" className="btn btn--quiet btn--small" onClick={() => revoke(x.id)} data-testid="token-revoke">
                {t.admin.devTokenRevoke}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="help help--error">{error}</p>}
    </div>
  );
}

// /admin/b/:id: a board's settings, in three tabs.
export function BoardSettings({ id, address, navigate }: { id: string; address: string; navigate: Navigate }) {
  const { t } = useT();
  const [board, setBoard] = useState<BoardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"look" | "statuses" | "connect">("look");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [logo, setLogo] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [boardLang, setBoardLang] = useState<Lang | null>(null);
  const [statuses, setStatuses] = useState<BoardStatus[]>([]);
  const [bugStatuses, setBugStatuses] = useState<BoardStatus[]>([]);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [sso, setSso] = useState<{ secret: string; audience: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [ssoBusy, setSsoBusy] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const show = (b: BoardSummary) => {
    setBoard(b);
    setName(b.name);
    setVisibility(b.visibility);
    setLogo(b.logo);
    setColor(b.color);
    setProductName(b.productName ?? "");
    setProductUrl(b.productUrl ?? "");
    setBoardLang(b.lang);
    setStatuses(b.statuses);
    setBugStatuses(b.bugStatuses);
  };

  useEffect(() => {
    api<BoardSummary>(`/api/boards/${id}`).then(show, (e) => setError(errorText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save(e: FormEvent, changes: Partial<BoardSummary>) {
    e.preventDefault();
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      show(await api<BoardSummary>(`/api/boards/${id}`, { method: "PATCH", body: JSON.stringify(changes) }));
      setSaveMsg(t.admin.saved);
    } catch (err) {
      setSaveMsg(errorText(t, err));
    } finally {
      setSaveBusy(false);
    }
  }

  async function loadSso() {
    setSsoError(null);
    if (sso) return sso;
    setSsoBusy(true);
    try {
      const s = await api<{ secret: string; audience: string }>(`/api/boards/${id}/sso`);
      setSso(s);
      return s;
    } catch (err) {
      setSsoError(errorText(t, err));
      return null;
    } finally {
      setSsoBusy(false);
    }
  }

  async function rotate() {
    setSsoBusy(true);
    setSsoError(null);
    try {
      const r = await api<{ secret: string }>(`/api/boards/${id}/rotate-secret`, { method: "POST" });
      setSso((s) => ({ secret: r.secret, audience: s?.audience ?? address }));
      setRevealed(true);
    } catch (err) {
      setSsoError(errorText(t, err));
    } finally {
      setSsoBusy(false);
      setConfirmRotate(false);
    }
  }

  // A plain-text brief, ready to paste to a developer or a coding assistant, secret included.
  async function copyInstructions() {
    const s = await loadSso();
    if (!s) return;
    const snippet = [
      `const crypto = require("crypto");`,
      `const b64url = (buf) => buf.toString("base64url");`,
      `const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256" })));`,
      `const payload = b64url(Buffer.from(JSON.stringify({`,
      `  name: "<their name>", email: "<their email>", sub: "<their id in your product>",`,
      `  iss: "${id}", aud: "${s.audience}", exp: Math.floor(Date.now() / 1000) + 120, jti: crypto.randomUUID(),`,
      `})));`,
      `const sig = crypto.createHmac("sha256", "${s.secret}").update(header + "." + payload).digest("base64url");`,
      `const url = \`${s.audience}/sso?token=\${header}.\${payload}.\${sig}&return_to=/b/${id}\`;`,
    ].join("\n");
    await navigator.clipboard.writeText(format(t.admin.devBrief, { name: board!.name, origin: s.audience, id, secret: s.secret, snippet }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (error) return <p className="help help--error">{error}</p>;
  if (!board) {
    return (
      <div className="skeleton">
        <span />
        <span />
      </div>
    );
  }

  const saveRow = (
    <>
      <div className="field-actions">
        <button type="submit" className="btn btn--ink" disabled={saveBusy}>
          {t.admin.save}
        </button>
      </div>
      <p className={saveMsg && saveMsg !== t.admin.saved ? "help help--error" : "help"} role="status">
        {saveMsg ?? ""}
      </p>
    </>
  );

  const signedSteps = (
    <ol className="steps">
      <li>
        <h3>{t.admin.connectStep1}</h3>
        <p className="help">{t.admin.connectStep1Help}</p>
      </li>
      <li>
        <h3>{t.admin.connectStep2}</h3>
        <p className="help">{t.admin.connectStep2Help}</p>
        <div className="sso-row">
          <button type="button" className="btn btn--ink btn--small" disabled={ssoBusy} onClick={copyInstructions} data-testid="copy-instructions">
            {copied ? t.admin.instructionsCopied : t.admin.copyInstructions}
          </button>
        </div>
        <div className="sso-row">
          <span className="help">{t.admin.ssoSecretLabel}:</span>
          {revealed && sso ? (
            <>
              <code className="sso-secret">{sso.secret}</code>
              <button type="button" className="btn btn--quiet btn--small" onClick={() => setRevealed(false)}>
                {t.admin.ssoHide}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--quiet btn--small" disabled={ssoBusy} onClick={async () => setRevealed(Boolean(await loadSso()))}>
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
      </li>
      <li>
        <h3>{t.admin.connectStep3}</h3>
        <p className="help">{t.admin.connectStep3Help}</p>
        <a className="btn btn--quiet btn--small" href={`/api/boards/${id}/test`} target="_blank" rel="noopener" data-testid="open-as-test">
          {t.admin.openAsTest}
        </a>
      </li>
    </ol>
  );

  return (
    <div className="settings">
      <a
        className="crumb"
        href="/admin"
        onClick={(e) => {
          e.preventDefault();
          navigate("/admin");
        }}
      >
        ← {t.admin.back}
      </a>
      <div className="section-head board-head">
        {board.logo && <img className="board-logo" src={board.logo} alt="" />}
        <h1>
          {board.name} <span className={board.visibility === "team" ? "badge badge--team" : "badge"}>{board.visibility === "team" ? t.admin.visibilityTeam : t.admin.visibilityPublic}</span>
        </h1>
      </div>
      <div className="tabs settings-tabs" role="tablist">
        {(["look", "statuses", "connect"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="tab"
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setSaveMsg(null);
            }}
          >
            {{ look: t.admin.tabLook, statuses: t.admin.statusesTitle, connect: t.admin.tabConnect }[k]}
          </button>
        ))}
      </div>

      {tab === "look" && (
        <form onSubmit={(e) => save(e, { name, visibility, logo, color, productName, productUrl, lang: boardLang })}>
          <div className="field-stack">
            <label className="field">
              <span>{t.admin.fieldName}</span>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>{t.admin.fieldVisibility}</span>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                <option value="public">{t.admin.visibilityPublic}</option>
                <option value="team">{t.admin.visibilityTeam}</option>
              </select>
            </label>
            <p className="help">{t.admin.visibilityHelp}</p>
            <label className="field">
              <span>{t.admin.fieldLang}</span>
              <select value={boardLang ?? ""} onChange={(e) => setBoardLang((e.target.value || null) as Lang | null)} data-testid="board-lang">
                <option value="">{t.admin.langBrowser}</option>
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <LogoField logo={logo} onChange={setLogo} />
            <label className="field">
              <span>{t.admin.fieldColor}</span>
              <input type="color" value={color ?? DEFAULT_COLOR} onChange={(e) => setColor(e.target.value)} />
            </label>
            <h2>{t.admin.productTitle}</h2>
            <label className="field">
              <span>{t.admin.fieldProductName}</span>
              <input type="text" maxLength={100} value={productName} onChange={(e) => setProductName(e.target.value)} data-testid="product-name" />
            </label>
            <label className="field">
              <span>{t.admin.fieldProductUrl}</span>
              <input type="text" inputMode="url" maxLength={500} placeholder="https://" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} data-testid="product-url" />
            </label>
            <p className="help">{t.admin.productHelp}</p>
          </div>
          {saveRow}
        </form>
      )}

      {tab === "statuses" && (
        <form onSubmit={(e) => save(e, { statuses, bugStatuses })}>
          <h2>{t.admin.statusesIdeas}</h2>
          <StatusList statuses={statuses} onChange={setStatuses} />
          <h2>{t.admin.statusesBugs}</h2>
          <StatusList statuses={bugStatuses} onChange={setBugStatuses} />
          <p className="help">{t.admin.statusesHelp}</p>
          {saveRow}
        </form>
      )}

      {tab === "connect" &&
        (board.visibility === "public" ? (
          <>
            <ol className="steps">
              <li>
                <h3>{t.admin.connectPublicStep}</h3>
                <BoardLink id={id} address={address} />
                <p className="help">{t.admin.connectPublicHelp}</p>
              </li>
            </ol>
            <h2 className="steps-title">{t.admin.connectSignedTitle}</h2>
            {signedSteps}
          </>
        ) : (
          signedSteps
        ))}
      {tab === "connect" && <DevTokens id={id} address={address} />}
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

// /admin: one card per board, and the new-board form behind "New board".
export function Admin({ address, navigate }: { address: string; navigate: Navigate }) {
  const { t } = useT();
  const [boards, setBoards] = useState<(BoardSummary & { ideas: number })[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [logo, setLogo] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    api<typeof boards>("/api/boards").then(setBoards, (e) => setError(errorText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    setCreateError(null);
    try {
      const b = await api<BoardSummary>("/api/boards", { method: "POST", body: JSON.stringify({ id, name, visibility, logo, color }) });
      setBoards((bs) => [{ ...b, ideas: 0 }, ...(bs ?? [])]);
      setId("");
      setName("");
      setVisibility("public");
      setLogo(null);
      setColor(null);
      setCreating(false);
    } catch (err) {
      setCreateError(errorText(t, err));
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="settings">
      <div className="section-head section-head--start">
        <h1>{t.boards.title}</h1>
        {!creating && (
          <button type="button" className="btn btn--ink" onClick={() => setCreating(true)} data-testid="new-board">
            + {t.admin.newBoardTitle}
          </button>
        )}
      </div>

      {creating && (
        <form className="page-section" onSubmit={createBoard}>
          <h2>{t.admin.newBoardTitle}</h2>
          <div className="field-stack">
            <label className="field">
              <span>{t.admin.fieldId}</span>
              <input type="text" required pattern="[a-z0-9-]{2,40}" value={id} onChange={(e) => setId(e.target.value)} aria-describedby="board-link-preview" data-testid="board-id-input" />
            </label>
            <p id="board-link-preview" className="help">
              <code>
                {address}/b/{id || "…"}
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
            <button type="button" className="btn btn--quiet" onClick={() => setCreating(false)}>
              {t.admin.cancel}
            </button>
          </div>
          <p className={createError ? "help help--error" : "help"} role="status">
            {createError ?? t.admin.fieldIdHelp}
          </p>
        </form>
      )}

      {error && <p className="help help--error">{error}</p>}
      {!error && !boards && (
        <div className="skeleton">
          <span />
          <span />
        </div>
      )}
      {!error && boards && boards.length === 0 && !creating && (
        <div className="empty">
          <p>{t.admin.boardsEmpty}</p>
        </div>
      )}
      {!error && boards && boards.length > 0 && (
        <ul className="board-list">
          {boards.map((b) => (
            <li key={b.id} className="board-card stock admin-card">
              {b.logo && <img className="board-logo" src={b.logo} alt="" />}
              <h2>
                {b.name} <span className={b.visibility === "team" ? "badge badge--team" : "badge"}>{b.visibility === "team" ? t.admin.visibilityTeam : t.admin.visibilityPublic}</span>
              </h2>
              <p className="help">{format(t.admin.ideasCount, { n: b.ideas })}</p>
              <BoardLink id={b.id} address={address} />
              <div>
                <a
                  className="btn btn--quiet btn--small"
                  href={`/admin/b/${b.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/admin/b/${b.id}`);
                  }}
                >
                  {t.nav.settings}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// /admin/settings: your own address, updates, version and password.
export function Settings({ domain, address, onChange }: { domain: string | null; address: string; onChange: () => Promise<void> }) {
  const { t } = useT();
  const [release, setRelease] = useState<{ version: string; latest: string | null; share: boolean } | null>(null);
  const [have, setHave] = useState<"none" | "elsewhere" | "cloudflare" | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<typeof release>("/api/version").then(setRelease, () => {});
  }, []);

  // Empty removes the domain.
  async function connect(value: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ domain: string | null }>("/api/address", { method: "PUT", body: JSON.stringify({ domain: value }) });
      await onChange();
      setTyped("");
      setHave(null);
      setMsg({ ok: true, text: r.domain ? format(t.admin.addressConnected, { address: `https://${r.domain}` }) : t.admin.addressRemoved });
    } catch (err) {
      setMsg({ ok: false, text: format(errorText(t, err), { domain: value.trim() }) });
    } finally {
      setBusy(false);
    }
  }

  const workers = (
    <a href={WORKERS} target="_blank" rel="noopener">
      {t.admin.addressOpenWorkers} ↗
    </a>
  );
  const addToWorker = (
    <li>
      {workers}
      {bold(t.admin.addressAddToWorker)}
    </li>
  );
  const typeBelow = <li>{t.admin.addressTypeBelow}</li>;

  return (
    <div className="settings">
      <h1>{t.nav.settings}</h1>

      <section className="page-section">
        <h2>{t.admin.addressTitle}</h2>
        <p>{t.admin.addressNow}</p>
        <p>
          <code className="sso-secret">{address}</code>
        </p>
        {domain ? (
          <div className="field-actions">
            <button type="button" className="btn btn--quiet" disabled={busy} onClick={() => connect("")} data-testid="address-remove">
              {t.admin.addressRemove}
            </button>
          </div>
        ) : (
          <div className="address-steps">
            <p className="lead">{t.admin.addressLead}</p>
            <div className="seg" role="group" aria-label={t.admin.addressHave}>
              {([
                ["none", t.admin.addressNone],
                ["elsewhere", t.admin.addressElsewhere],
                ["cloudflare", t.admin.addressCloudflare],
              ] as const).map(([k, label]) => (
                <button key={k} type="button" aria-pressed={have === k} onClick={() => setHave(k)}>
                  {label}
                </button>
              ))}
            </div>
            {have === "none" && (
              <ol className="first-steps">
                <li>
                  {workers}
                  {bold(t.admin.addressNoneStep1)}
                </li>
                <li>{bold(t.admin.addressNoneStep2)}</li>
                {typeBelow}
              </ol>
            )}
            {have === "elsewhere" && (
              <ol className="first-steps">
                <li>
                  <a href={ONBOARD} target="_blank" rel="noopener">
                    {t.admin.addressAddToCloudflare} ↗
                  </a>
                  {bold(t.admin.addressOnboard)}
                </li>
                <li>{t.admin.addressNameservers}</li>
                {addToWorker}
                {typeBelow}
              </ol>
            )}
            {have === "cloudflare" && (
              <ol className="first-steps">
                {addToWorker}
                {typeBelow}
              </ol>
            )}
            {have && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  connect(typed);
                }}
              >
                <div className="field-stack">
                  <label className="field">
                    <span>{t.admin.addressField}</span>
                    <input type="text" inputMode="url" spellCheck={false} placeholder="ideas.your-product.com" value={typed} onChange={(e) => setTyped(e.target.value)} required data-testid="address-input" />
                  </label>
                </div>
                <div className="field-actions">
                  <button type="submit" className="btn btn--ink" disabled={busy || !typed.trim()} data-testid="address-connect">
                    {busy ? t.admin.addressChecking : t.admin.addressConnect}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        <p className={msg && !msg.ok ? "help help--error" : "help"} role="status">
          {msg?.text ?? ""}
        </p>
        <p className="help">{t.admin.addressHelp}</p>
      </section>

      <section className="page-section">
        <h2>{t.admin.updatesTitle}</h2>
        {release && <p>{format(t.admin.versionLine, { version: release.version })}</p>}
        {release?.latest && <p className="update">{format(t.admin.latestAvailable, { latest: release.latest })}</p>}
        <TurnOnUpdates />
        <ShareCount initial={release?.share} />
      </section>

      <section className="page-section">
        <ChangePassword />
      </section>
    </div>
  );
}
