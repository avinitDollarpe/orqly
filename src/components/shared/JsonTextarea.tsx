"use client";

import { useState } from "react";

/** Mono textarea that validates JSON on blur (templates allowed). */
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
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={validate}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        className={`w-full resize-y rounded-lg border bg-surface px-2.5 py-2 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/15 ${
          error ? "border-danger" : "border-line focus:border-accent"
        }`}
      />
      {error && <p className="mt-1 text-xs text-danger">Invalid JSON: {error}</p>}
    </div>
  );
}
