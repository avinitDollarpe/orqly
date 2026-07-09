"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string | null; name: string };

/** Nav-bar pill dropdown: pick one item, applies globally. Used for env + header set. */
export function PillPicker({
  ariaLabel,
  label,
  items,
  activeId,
  onSelect,
}: {
  ariaLabel: string;
  label: string;
  items: Item[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="nav-pill cursor-pointer gap-2 pr-3 pl-3.5 text-foreground transition outline-none hover:bg-foreground/[0.09] focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {label}
        <svg
          className={`h-3 w-3 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 10 10"
          aria-hidden
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2 3.5 3 3 3-3"
          />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="glass-heavy absolute top-full right-0 z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-line p-1 shadow-panel"
        >
          {items.map((item) => {
            const selected = (activeId ?? null) === item.id;
            return (
              <li key={item.id ?? "none"} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition hover:bg-foreground/8 ${
                    selected ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {selected && (
                    <svg
                      className="h-3 w-3 flex-none text-accent"
                      viewBox="0 0 12 12"
                      aria-hidden
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.5 6.2 5 8.7 9.5 3.8"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
