import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { api } from "./lib/api";
import type { Me } from "./lib/types";
import { I18nContext, LANGS, type Lang, applyLang, detectLang, errorText, getMessages, useT } from "./i18n";
import { SignIn } from "./pages/SignIn";
import { Boards } from "./pages/Boards";
import { Board } from "./pages/Board";
import { Post } from "./pages/Post";
import { Admin } from "./pages/Admin";

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
  const [showSignIn, setShowSignIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  useEffect(() => {
    const url = new URL(location.href);
    const err = url.searchParams.get("error");
    if (err) {
      setAuthError((t.err as Record<string, string>)[err] ?? t.err.invalid);
      url.searchParams.delete("error");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, [path, t]);

  useEffect(() => {
    if (me?.user) setShowSignIn(false);
  }, [me?.user]);

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
  let page: ReactNode;
  if (path === "/admin") page = <Admin me={me} />;
  else if (postMatch) page = <Post boardId={postMatch[1]} postId={Number(postMatch[2])} me={me} navigate={navigate} />;
  else if (boardMatch) page = <Board id={boardMatch[1]} me={me} navigate={navigate} />;
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
            {me.user?.admin && (
              <a href="/admin" className="nav-link" aria-current={path === "/admin" ? "page" : undefined} onClick={go("/admin")}>
                {t.nav.admin}
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
            {me.user ? (
              <button type="button" className="btn btn--quiet btn--small" data-testid="sign-out" onClick={signOut}>
                {t.auth.signOut}
              </button>
            ) : (
              <button type="button" className="btn btn--quiet btn--small" data-testid="sign-in" onClick={() => setShowSignIn((v) => !v)}>
                {t.auth.signIn}
              </button>
            )}
          </div>
        </div>
      </header>

      {authError && (
        <p className="container auth-banner help help--error">{authError}</p>
      )}

      {showSignIn && !me.user && (
        <div className="container signin-panel">
          <SignIn config={me.config} returnTo={path} compact />
        </div>
      )}

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
