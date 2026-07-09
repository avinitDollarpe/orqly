"use client";

import type { KV } from "@/lib/types";

export function KVTable({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: {
  rows: KV[];
  onChange: (rows: KV[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const update = (i: number, patch: Partial<KV>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const cellCls =
    "min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-faint";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-foreground/[0.02]">
      {/* column header */}
      <div className="flex items-center border-b border-line bg-foreground/[0.02] font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
        <span className="w-9 flex-none" />
        <span className="flex-1 px-3 py-1.5">{keyPlaceholder}</span>
        <span className="w-px self-stretch bg-line" />
        <span className="flex-1 px-3 py-1.5">{valuePlaceholder}</span>
        <span className="w-9 flex-none" />
      </div>

      {rows.map((row, i) => (
        <div
          key={i}
          className={`group flex items-stretch border-b border-line/70 transition-colors last:border-b-0 focus-within:bg-accent/[0.04] hover:bg-foreground/[0.03] ${
            row.enabled ? "" : "opacity-45"
          }`}
        >
          <label className="flex w-9 flex-none cursor-pointer items-center justify-center">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(i, { enabled: e.target.checked })}
              className="h-3.5 w-3.5 rounded accent-(--accent-strong)"
              title="Enabled"
            />
          </label>
          <input
            className={cellCls}
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
          />
          <span className="w-px self-stretch bg-line/70" />
          <input
            className={cellCls}
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="flex w-9 flex-none items-center justify-center text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
            title="Remove row"
            aria-label="Remove row"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="m2 2 8 8M10 2l-8 8"
              />
            </svg>
          </button>
        </div>
      ))}

      <button
        onClick={() => onChange([...rows, { key: "", value: "", enabled: true }])}
        className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/8"
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M6 2v8M2 6h8"
          />
        </svg>
        Add row
      </button>
    </div>
  );
}
