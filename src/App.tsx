import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { api } from "./lib/api";
import type { Me } from "./lib/types";
import { I18nContext, LANGS, type Lang, applyLang, detectLang, errorText, getMessages, useT } from "./i18n";
import { Login } from "./pages/Login";
import { Boards } from "./pages/Boards";
import { Board } from "./pages/Board";
import { Post } from "./pages/Post";
import { Admin, BoardSettings, Settings } from "./pages/Admin";

export type Navigate = (to: string, replace?: boolean) => void;

function useRoute(): [string, Navigate] {
  const [path, setPath] = useState(() => location.pathname);
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback<Navigate>((to, replace = false) => {
    if (to === location.pathname) return;
    if (replace) history.replaceState(null, "", to);
    else history.pushState(null, "", to);
    setPath(to);
  }, []);
  return [path, navigate];
}

const BOARD_PATH = /^\/b\/([a-z0-9-]{2,40})$/;
const POST_PATH = /^\/b\/([a-z0-9-]{2,40})\/p\/(\d+)$/;
const ADMIN_BOARD_PATH = /^\/admin\/b\/([a-z0-9-]{2,40})$/;

function Setup({ message }: { message: string }) {
  const { t } = useT();
  return (
    <main className="login">
      <div className="login-card stock">
        <h1>{t.setup.title}</h1>
        <p className="help">{message}</p>
        <p className="help">{t.setup.instructions}</p>
        <button type="button" className="btn btn--ink" onClick={() => location.reload()}>
          {t.setup.reload}
        </button>
      </div>
    </main>
  );
}

function Shell() {
  const { t, lang, setLang } = useT();
  const [path, navigate] = useRoute();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMe(await api<Me>("/api/me"));
      setError(null);
    } catch (e) {
      setError(errorText(t, e));
    }
  }, [t]);

  useEffect(() => {
    load();
    const onSignedOut = () => load();
    window.addEventListener("dozokit:signed-out", onSignedOut);
    return () => window.removeEventListener("dozokit:signed-out", onSignedOut);
  }, [load]);

  if (error && !me) {
    return (
      <main className="container main">
        <p className="help help--error">{error}</p>
      </main>
    );
  }
  if (!me) {
    return <main className="container main" aria-busy="true" />;
  }
  if (me.config.setupNeeded) return <Setup message={me.config.setupNeeded} />;
  if ((path === "/admin" || path.startsWith("/admin/")) && !me.admin) return <Login onDone={load} />;

  const signOut = async () => {
    await api("/api/logout", { method: "POST" });
    location.href = "/";
  };

  const go = (to: string) => (e: MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  const postMatch = path.match(POST_PATH);
  const boardMatch = path.match(BOARD_PATH);
  const adminBoardMatch = path.match(ADMIN_BOARD_PATH);
  let page: ReactNode;
  if (path === "/admin") page = <Admin navigate={navigate} />;
  else if (adminBoardMatch) page = <BoardSettings key={adminBoardMatch[1]} id={adminBoardMatch[1]} navigate={navigate} />;
  else if (path === "/admin/settings") page = <Settings />;
  else if (postMatch) page = <Post boardId={postMatch[1]} postId={Number(postMatch[2])} me={me} navigate={navigate} />;
  else if (boardMatch) page = <Board id={boardMatch[1]} navigate={navigate} />;
  else page = <Boards navigate={navigate} />;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner container">
          <a href="/" className="wordmark" onClick={go("/")}>
            <img src="/icon.svg" alt="" width="20" height="20" />
            {t.app.wordmark}
          </a>
          <nav className="nav" aria-label="Sections">
            <a href="/" className="nav-link" aria-current={path === "/" || Boolean(boardMatch) || Boolean(postMatch) ? "page" : undefined} onClick={go("/")}>
              {t.nav.boards}
            </a>
            {me.admin && (
              <a href="/admin" className="nav-link" aria-current={path === "/admin" || adminBoardMatch ? "page" : undefined} onClick={go("/admin")}>
                {t.nav.admin}
              </a>
            )}
            {me.admin && (
              <a href="/admin/settings" className="nav-link" aria-current={path === "/admin/settings" ? "page" : undefined} onClick={go("/admin/settings")}>
                {t.nav.settings}
              </a>
            )}
          </nav>
          <div className="topbar-end">
            <select data-testid="lang-select" aria-label={t.lang.label} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            {(me.user || me.admin) && (
              <button type="button" className="btn btn--quiet btn--small" data-testid="sign-out" onClick={signOut}>
                {t.auth.signOut}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container main">{page}</main>
    </div>
  );
}

export function App() {
  const [lang, setLangState] = useState<Lang>(() => detectLang());
  useEffect(() => applyLang(lang), [lang]);
  const setLang = (l: Lang) => setLangState(l);
  return (
    <I18nContext.Provider value={{ lang, t: getMessages(lang), setLang }}>
      <Shell />
    </I18nContext.Provider>
  );
}
