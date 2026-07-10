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
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => (activeId ?? null) === item.id),
  );

  useEffect(() => {
    if (!open) return;
    optionRefs.current[highlight]?.focus();

    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (!ref.current?.contains(e.target as Node)) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (highlight + 1) % items.length;
        setHighlight(next);
        optionRefs.current[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = (highlight - 1 + items.length) % items.length;
        setHighlight(next);
        optionRefs.current[next]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        setHighlight(0);
        optionRefs.current[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        const last = items.length - 1;
        setHighlight(last);
        optionRefs.current[last]?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, highlight, items.length, selectedIndex]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            setHighlight(selectedIndex);
            setOpen(true);
          }
        }}
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
          {items.map((item, i) => {
            const selected = (activeId ?? null) === item.id;
            return (
              <li key={item.id ?? "none"} role="presentation">
                <button
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition hover:bg-foreground/8 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                    selected || highlight === i
                      ? "text-foreground"
                      : "text-muted hover:text-foreground"
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
