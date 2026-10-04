"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { JevTrace } from "@/lib/common/jev-trace";

type Side = "request" | "response";

const API_URL = "https://api.typesafe.ai/v1/systemone";

const shellQuote = (s: string) => `'${s.replaceAll("'", "'\\''")}'`;

export const curlFor = (t: JevTrace) =>
  [
    `curl -s ${API_URL}`,
    `  -H "Authorization: Bearer $TYPESAFE_API_KEY"`,
    `  -H "Content-Type: application/json"`,
    `  -d ${shellQuote(JSON.stringify(t.request))}`,
  ].join(" \\\n");

const questionCount = (t: JevTrace) =>
  t.request.questions && typeof t.request.questions === "object"
    ? Object.keys(t.request.questions).length
    : 0;

const inputTokens = (t: JevTrace): number | null => {
  const u = t.response?.usage as { input_tokens?: unknown } | null | undefined;
  return typeof u?.input_tokens === "number" ? u.input_tokens : null;
};

function summary(t: JevTrace): string {
  const parts = [`質問 ${questionCount(t)}問`];
  const tokens = inputTokens(t);
  if (tokens !== null) parts.push(`入力 ${tokens.toLocaleString()} tokens`);
  parts.push(`${t.ms.toLocaleString()}ms`);
  if (!t.response) parts.push(t.error ? `失敗: ${t.error}` : "応答なし");
  return parts.join(" ・ ");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => setTimeout(reject, 1500)),
    ]);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function JevDrawer({ traces }: { traces: JevTrace[] }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<Side>("request");
  const [copied, setCopied] = useState("");
  const [prev, setPrev] = useState(traces);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  if (prev !== traces) {
    setPrev(traces);
    setIndex(0);
    setCopied("");
    if (traces.length === 0) setOpen(false);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const tab = tabRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      tab?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(""), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  if (!mounted || traces.length === 0) return null;

  const i = Math.min(index, traces.length - 1);
  const t = traces[i];
  const body = side === "request" ? t.request : t.response;
  const json = JSON.stringify(body, null, 2) ?? "null";

  function trapFocus(e: ReactKeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = panelRef.current.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [tabindex='0']",
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function copy(what: "json" | "curl") {
    const ok = await copyText(what === "json" ? json : curlFor(t));
    setCopied(
      ok
        ? what === "json"
          ? "JSON をコピーしました"
          : "curl をコピーしました"
        : "コピーできませんでした",
    );
  }

  return createPortal(
    <>
      <style>{CSS}</style>
      <div className="jevtrace-root">
        <button
          ref={tabRef}
          type="button"
          className="jevtrace-tab"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Jev のやりとりを開く（${traces.length}件）`}
        >
          <span className="jevtrace-tab-text">Jev のやりとり</span>
          <span className="jevtrace-badge">{traces.length}</span>
        </button>
        {open && (
          <>
            <div
              className="jevtrace-backdrop"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              className="jevtrace-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="jevtrace-title"
              onKeyDown={trapFocus}
            >
              <div className="jevtrace-head">
                <h2 id="jevtrace-title" className="jevtrace-title">
                  Jev のやりとり
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  className="jevtrace-close"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              <p className="jevtrace-note">
                この画面で直前に Jev
                に送ったリクエストと、受け取ったレスポンスです。
              </p>

              {traces.length > 1 ? (
                <div
                  className="jevtrace-traces"
                  role="tablist"
                  aria-label="リクエスト"
                >
                  {traces.map((x, k) => (
                    <button
                      key={`${k}-${x.label}`}
                      type="button"
                      role="tab"
                      aria-selected={k === i}
                      className="jevtrace-trace"
                      onClick={() => setIndex(k)}
                    >
                      <span className="jevtrace-label">{x.label}</span>
                      <span className="jevtrace-sum">{summary(x)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="jevtrace-single">
                  <span className="jevtrace-label">{t.label}</span>
                  <span className="jevtrace-sum">{summary(t)}</span>
                </p>
              )}

              <div className="jevtrace-sides" role="tablist" aria-label="向き">
                <button
                  type="button"
                  role="tab"
                  aria-selected={side === "request"}
                  className="jevtrace-side"
                  onClick={() => setSide("request")}
                >
                  送ったもの（リクエスト）
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={side === "response"}
                  className="jevtrace-side"
                  onClick={() => setSide("response")}
                >
                  受け取ったもの（レスポンス）
                </button>
              </div>

              <div className="jevtrace-actions">
                <button
                  type="button"
                  className="jevtrace-btn"
                  onClick={() => copy("json")}
                >
                  JSON をコピー
                </button>
                <button
                  type="button"
                  className="jevtrace-btn"
                  onClick={() => copy("curl")}
                >
                  curl をコピー
                </button>
                <span className="jevtrace-copied" aria-live="polite">
                  {copied}
                </span>
              </div>

              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: lets keyboard users scroll long JSON */}
              <pre className="jevtrace-pre" tabIndex={0}>
                {json}
              </pre>
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

const CSS = `
.jevtrace-root {
  --jt-bg: #ffffff; --jt-fg: #1d1d1f; --jt-muted: #6b6b70; --jt-line: rgba(128,128,128,.3);
  --jt-soft: #f3f3f1; --jt-code: #f7f7f5; --jt-accent: #2f6fd6; --jt-accent-fg: #ffffff;
}

.jevtrace-root, .jevtrace-root * { all: revert; box-sizing: border-box; }
.jevtrace-root {
  font: 13px/1.5 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
  color: var(--jt-fg); letter-spacing: normal; text-transform: none; text-align: left;
}
.jevtrace-root :where(button) { font: inherit; color: inherit; cursor: pointer; margin: 0; }

.jevtrace-tab {
  position: fixed; right: 0; top: 50%; transform: translateY(-50%); z-index: 1100;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 6px; border: 1px solid var(--jt-line); border-right: 0;
  border-radius: 8px 0 0 8px; background: var(--jt-bg); color: var(--jt-fg);
  box-shadow: -2px 2px 10px rgba(0,0,0,.18); font-size: 12px; font-weight: 600;
}
.jevtrace-tab:hover { background: var(--jt-soft); }
.jevtrace-tab:focus-visible { outline: 2px solid var(--jt-accent); outline-offset: 2px; }
.jevtrace-tab-text { writing-mode: vertical-rl; letter-spacing: .08em; }
.jevtrace-badge {
  display: inline-block; min-width: 18px; padding: 1px 5px; border-radius: 9px;
  background: var(--jt-accent); color: var(--jt-accent-fg); font-size: 11px; line-height: 16px; text-align: center;
}

.jevtrace-backdrop {
  position: fixed; inset: 0; z-index: 10000; display: block;
  background: rgba(0,0,0,.35); animation: jevtrace-fade .18s ease-out;
}
.jevtrace-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 10001;
  width: min(620px, 100vw); max-width: 100vw; height: 100vh; height: 100dvh;
  display: flex; flex-direction: column; gap: 10px; padding: 14px 16px 16px;
  background: var(--jt-bg); color: var(--jt-fg); border-left: 1px solid var(--jt-line);
  box-shadow: -8px 0 28px rgba(0,0,0,.25); overflow: hidden;
  animation: jevtrace-in .22s ease-out;
}
@keyframes jevtrace-in { from { transform: translateX(100%); } to { transform: none; } }
@keyframes jevtrace-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .jevtrace-panel, .jevtrace-backdrop { animation: none; } }

.jevtrace-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.jevtrace-title { margin: 0; font-size: 16px; font-weight: 700; }
.jevtrace-close {
  width: 34px; height: 34px; padding: 0; border: 1px solid var(--jt-line); border-radius: 8px;
  background: transparent; font-size: 20px; line-height: 1;
}
.jevtrace-close:hover { background: var(--jt-soft); }
.jevtrace-note { margin: 0; color: var(--jt-muted); font-size: 12px; }

.jevtrace-traces { display: flex; flex-wrap: wrap; gap: 6px; }
.jevtrace-trace, .jevtrace-single {
  display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 7px 10px;
  border: 1px solid var(--jt-line); border-radius: 8px; background: transparent; min-width: 0;
}
.jevtrace-trace { flex: 1 1 200px; text-align: left; }
.jevtrace-trace[aria-selected="true"] { border-color: var(--jt-accent); background: var(--jt-soft); box-shadow: inset 0 0 0 1px var(--jt-accent); }
.jevtrace-label { font-weight: 700; }
.jevtrace-sum { color: var(--jt-muted); font-size: 12px; overflow-wrap: anywhere; }

.jevtrace-sides { display: flex; border-bottom: 1px solid var(--jt-line); }
.jevtrace-side {
  flex: 1 1 0; padding: 8px 6px; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px;
  background: transparent; color: var(--jt-muted); font-weight: 600; text-align: center;
}
.jevtrace-side[aria-selected="true"] { color: var(--jt-fg); border-bottom-color: var(--jt-accent); }

.jevtrace-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.jevtrace-btn {
  padding: 5px 10px; border: 1px solid var(--jt-line); border-radius: 6px;
  background: var(--jt-soft); font-size: 12px;
}
.jevtrace-btn:hover { border-color: var(--jt-accent); }
.jevtrace-copied { color: var(--jt-muted); font-size: 12px; }

.jevtrace-pre {
  flex: 1 1 auto; min-height: 0; margin: 0; padding: 10px 12px; overflow: auto;
  border: 1px solid var(--jt-line); border-radius: 8px; background: var(--jt-code); color: var(--jt-fg);
  font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  white-space: pre-wrap; overflow-wrap: anywhere; tab-size: 2;
}
.jevtrace-root button:focus-visible, .jevtrace-pre:focus-visible { outline: 2px solid var(--jt-accent); outline-offset: 1px; }
@media (max-width: 480px) {
  .jevtrace-panel { padding: 12px; gap: 8px; }
  .jevtrace-side { font-size: 12px; }
}
`;
