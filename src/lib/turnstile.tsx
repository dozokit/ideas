import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("turnstile_script_failed"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export interface TurnstileHandle {
  getToken: () => Promise<string | null>;
  reset: () => void;
}

const TOKEN_WAIT_MS = 10_000;
const TOKEN_POLL_MS = 100;

// One widget, explicitly rendered, shared by every write on the page it sits on (a post, a vote,
// a comment). `reset` gets it a fresh token after each use, since a token can only be redeemed once.
// `appearance: interaction-only` keeps the widget invisible unless Cloudflare needs the visitor to
// act; the before/after-interactive callbacks are the official hook to show the host only then, so
// it takes no layout space while idle.
export const Turnstile = forwardRef<TurnstileHandle, { siteKey: string }>(function Turnstile({ siteKey }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string>("");
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    let live = true;
    loadScript().then(() => {
      if (!live || !hostRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey,
        appearance: "interaction-only",
        callback: (t: string) => {
          token.current = t;
        },
        "expired-callback": () => {
          token.current = "";
        },
        "before-interactive-callback": () => setInteractive(true),
        "after-interactive-callback": () => setInteractive(false),
      });
    });
    return () => {
      live = false;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [siteKey]);

  useImperativeHandle(ref, () => ({
    getToken: () =>
      new Promise<string | null>((resolve) => {
        if (token.current) return resolve(token.current);
        const deadline = Date.now() + TOKEN_WAIT_MS;
        const poll = () => {
          if (token.current) return resolve(token.current);
          if (Date.now() >= deadline) return resolve(null);
          setTimeout(poll, TOKEN_POLL_MS);
        };
        poll();
      }),
    reset: () => {
      token.current = "";
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  return <div ref={hostRef} data-testid="turnstile" style={interactive ? undefined : { display: "none" }} />;
});
