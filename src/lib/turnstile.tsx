import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

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
  getToken: () => string | null;
  reset: () => void;
}

// One widget, explicitly rendered, shared by every write on the page it sits on (a post, a vote,
// a comment). `reset` gets it a fresh token after each use, since a token can only be redeemed once.
export const Turnstile = forwardRef<TurnstileHandle, { siteKey: string }>(function Turnstile({ siteKey }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string>("");

  useEffect(() => {
    let live = true;
    loadScript().then(() => {
      if (!live || !hostRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey,
        callback: (t: string) => {
          token.current = t;
        },
        "expired-callback": () => {
          token.current = "";
        },
      });
    });
    return () => {
      live = false;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [siteKey]);

  useImperativeHandle(ref, () => ({
    getToken: () => token.current || null,
    reset: () => {
      token.current = "";
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  return <div ref={hostRef} data-testid="turnstile" />;
});
