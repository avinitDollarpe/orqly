"use client";

import { useState } from "react";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Tokenize escaped JSON into colored spans. Templates first so {{…}} wins,
// key-strings (followed by ":") before plain string values.
const TOKENS =
  /(\{\{[^}]*\}\})|("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])/g;

function highlight(src: string): string {
  return esc(src).replace(TOKENS, (m, tpl, key, str, num, kw, punc) => {
    if (tpl) return `<span style="color:var(--accent);font-weight:600">${tpl}</span>`;
    if (key) return `<span style="color:var(--foreground)">${key}</span>`;
    if (str || num || kw) return `<span style="color:var(--success)">${str || num || kw}</span>`;
    if (punc) return `<span style="color:var(--faint)">${punc}</span>`;
    return m;
  });
}

// Identical box on both layers so the transparent textarea sits pixel-perfect
// over the highlighted pre.
const boxCls =
  "m-0 w-full rounded-xl border px-3 py-2.5 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap";

/** Mono JSON editor: syntax-highlighted, validates JSON on blur (templates allowed). */
export function JsonTextarea({
  value,
  onChange,
  rows = 8,
  placeholder,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });

  function validate() {
    if (!value.trim()) return setError(null);
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  return (
    <div>
      <div className="relative">
        <pre
          aria-hidden
          className={`${boxCls} pointer-events-none absolute inset-0 overflow-hidden border-transparent text-foreground`}
          style={{
            transform: `translate(${-scroll.left}px, ${-scroll.top}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: highlight(value) + "\n" }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={validate}
          onScroll={(e) =>
            setScroll({
              top: e.currentTarget.scrollTop,
              left: e.currentTarget.scrollLeft,
            })
          }
          rows={rows}
          spellCheck={false}
          placeholder={placeholder}
          className={`${boxCls} relative resize-y bg-foreground/[0.03] text-transparent caret-foreground outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/20 ${
            error ? "border-danger" : "border-white/12 focus:border-accent/50"
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">Invalid JSON: {error}</p>}
    </div>
  );
}
