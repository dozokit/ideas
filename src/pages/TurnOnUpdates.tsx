import { useState } from "react";
import workflow from "../../.github/workflows/update.yml?raw";
import { useT } from "../i18n";

// Cloudflare's Deploy button copies the repository without its .github folder, so a new copy
// has no update workflow. This opens GitHub's "new file" page with the workflow filled in.
export function TurnOnUpdates() {
  const { t } = useT();
  const [repo, setRepo] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const m = repo.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
        if (!m) return setError(t.admin.updatesInvalidRepo);
        setError(null);
        const q = new URLSearchParams({ filename: ".github/workflows/update.yml", value: workflow });
        window.open(`https://github.com/${m[1]}/${m[2]}/new/main?${q}`, "_blank", "noopener");
      }}
    >
      <p className="lead">{t.admin.updatesLead}</p>
      <div className="field-stack">
        <label className="field">
          <span>{t.admin.updatesFieldLabel}</span>
          <input type="text" inputMode="url" spellCheck={false} placeholder="github.com/your-name/dozokit-ideas" value={repo} onChange={(e) => setRepo(e.target.value)} aria-invalid={Boolean(error)} aria-describedby="updates-help" />
        </label>
      </div>
      <div className="field-actions">
        <button type="submit" className="btn btn--ink">
          {t.admin.updatesSubmit}
        </button>
      </div>
      <p id="updates-help" className={error ? "help help--error" : "help"} role="status">
        {error ?? (
          <>
            {t.admin.updatesHelp} <a href="https://dozokit.com/ideas/guide#updating" target="_blank" rel="noopener">https://dozokit.com/ideas/guide#updating</a>.
          </>
        )}
      </p>
    </form>
  );
}
