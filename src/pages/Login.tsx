import { useState } from "react";
import { api } from "../lib/api";
import { errorText, useT } from "../i18n";

export function Login({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="login">
      <form
        className="login-card stock"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
            onDone();
          } catch (err) {
            setError(errorText(t, err));
            setBusy(false);
          }
        }}
      >
        <h1>{t.login.title}</h1>
        <label className="field">
          <span>{t.login.password}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            aria-invalid={Boolean(error)}
            aria-describedby="login-help"
            onChange={(e) => setPassword(e.target.value)}
            data-testid="admin-password"
          />
        </label>
        <p id="login-help" className={error ? "help help--error" : "help"}>
          {error ?? t.login.help}
        </p>
        <button type="submit" className="btn btn--ink" disabled={busy}>
          {busy ? t.login.busy : t.login.submit}
        </button>
      </form>
    </main>
  );
}
