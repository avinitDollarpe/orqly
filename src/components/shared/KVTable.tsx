"use client";

import { inputCls } from "@/components/shared/ui";
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

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => update(i, { enabled: e.target.checked })}
            className="accent-(--accent-strong)"
            title="Enabled"
          />
          <input
            className={`${inputCls} flex-1 font-mono text-xs`}
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
          />
          <input
            className={`${inputCls} flex-[1.6] font-mono text-xs`}
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="rounded-md px-1.5 py-1 text-faint transition hover:bg-danger-soft hover:text-danger"
            title="Remove row"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...rows, { key: "", value: "", enabled: true }])}
        className="rounded-md px-1.5 py-0.5 text-xs font-medium text-accent transition hover:bg-accent-soft"
      >
        + Add row
      </button>
    </div>
  );
}
