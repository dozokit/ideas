import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { errorText, useT } from "../i18n";
import type { BoardSummary } from "../lib/types";
import type { Navigate } from "../App";

export function Boards({ navigate }: { navigate: Navigate }) {
  const { t } = useT();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<BoardSummary[]>("/api/boards").then(
      (bs) => {
        setBoards(bs);
        if (bs.length === 1) navigate(`/b/${bs[0].id}`, true);
      },
      (e) => setError(errorText(t, e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="section-head">
        <h1>{t.boards.title}</h1>
      </div>
      {error && (
        <div className="failed">
          <p>{error}</p>
        </div>
      )}
      {!error && !boards && (
        <div className="skeleton">
          <span />
          <span />
        </div>
      )}
      {!error && boards && boards.length === 0 && (
        <div className="empty">
          <p>{t.boards.empty}</p>
        </div>
      )}
      {!error && boards && boards.length > 0 && (
        <ul className="board-list">
          {boards.map((b) => (
            <li key={b.id}>
              <a
                href={`/b/${b.id}`}
                className="board-card stock"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/b/${b.id}`);
                }}
              >
                <h2>{b.name}</h2>
                {b.visibility === "team" && <span className="badge badge--team">{t.boards.visibilityTeam}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
