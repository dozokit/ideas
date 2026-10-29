import { useState } from "react";
import { api } from "../lib/api";
import { errorText, useT } from "../i18n";

export function ChangePassword() {
  const { t } = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (next !== again) return setError(t.password.mismatch);
        setState("saving");
        setError(null);
        try {
          await api("/api/password", { method: "POST", body: JSON.stringify({ current, next }) });
          setCurrent("");
          setNext("");
          setAgain("");
          setState("saved");
        } catch (err) {
          setError(errorText(t, err));
          setState("idle");
        }
      }}
    >
      <h2>{t.password.title}</h2>
      <div className="field-row">
        <label className="field">
          <span>{t.password.current}</span>
          <input name="current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="field">
          <span>{t.password.next}</span>
          <input name="next" type="password" autoComplete="new-password" required minLength={12} value={next} onChange={(e) => { setNext(e.target.value); setState("idle"); }} />
        </label>
        <label className="field">
          <span>{t.password.again}</span>
          <input name="again" type="password" autoComplete="new-password" required minLength={12} value={again} onChange={(e) => { setAgain(e.target.value); setState("idle"); }} />
        </label>
        <button type="submit" className="btn btn--ink" disabled={state === "saving"}>
          {state === "saving" ? t.password.saving : t.password.submit}
        </button>
      </div>
      <p className={error ? "help help--error" : "help"} role={error || state === "saved" ? "status" : undefined}>
        {error ?? (state === "saved" ? t.password.saved : t.password.help)}
      </p>
    </form>
  );
}
