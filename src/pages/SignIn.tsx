import { useT } from "../i18n";
import type { Me } from "../lib/types";

// The one sign-in surface, used two ways: a small card in place of a form ("sign in to vote"),
// and a full-page gate for a team board nobody outside it may see.
export function SignIn({ config, returnTo, heading, message, compact }: { config: Me["config"]; returnTo: string; heading?: string; message?: string; compact?: boolean }) {
  const { t } = useT();
  return (
    <div className={compact ? "signin-inline stock" : "gate stock"}>
      {heading && <h1>{heading}</h1>}
      {message && <p className="help">{message}</p>}
      {config.googleReady && (
        <a className="btn btn--ink" href={`/auth/google?return_to=${encodeURIComponent(returnTo)}`} data-testid="google-sign-in">
          {t.auth.continueGoogle}
        </a>
      )}
      {config.devLogin && !config.googleReady && (
        <form className="dev-login" action="/auth/dev" method="GET">
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="field">
            <span>{t.auth.devEmail}</span>
            <input type="email" name="email" required data-testid="dev-login-email" />
          </label>
          <label className="field">
            <span>{t.auth.devName}</span>
            <input type="text" name="name" data-testid="dev-login-name" />
          </label>
          <button type="submit" className="btn btn--ink" data-testid="dev-login-submit">
            {t.auth.devSubmit}
          </button>
        </form>
      )}
      {!config.googleReady && !config.devLogin && <p className="help help--error">{t.err.google_not_configured}</p>}
    </div>
  );
}
