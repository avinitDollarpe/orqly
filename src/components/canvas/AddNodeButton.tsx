"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

const ImportNodeModal = dynamic(
  () =>
    import("@/components/canvas/ImportNodeModal").then((m) => ({
      default: m.ImportNodeModal,
    })),
  { ssr: false },
);
import type { NodePlacement } from "@/lib/types";

type Props = {
  nodeId: string;
  /** Start only fans out to the first row — no sibling choice. */
  variant?: "api" | "start";
};

function AddIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 12h12M12 18V6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AddNodeButton({ nodeId, variant = "api" }: Props) {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const addNode = useStore((s) => s.addNode);

  const menuItems =
    variant === "api"
      ? [
          { title: "Same row", description: "Place to the right, run after the same parent", action: () => add("same") },
          { title: "Below", description: "Run after this step", action: () => add("below") },
          { title: "Import…", description: "cURL, OpenAPI, Swagger or Postman", action: () => { setOpen(false); setImportOpen(true); } },
        ]
      : [
          { title: "Blank request", description: "An empty request to fill in yourself", action: () => add("below") },
          { title: "Import…", description: "cURL, OpenAPI, Swagger or Postman", action: () => { setOpen(false); setImportOpen(true); } },
        ];

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
    itemRefs.current[0]?.focus();

    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (!menuRef.current?.contains(e.target as Node)) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (highlight + 1) % menuItems.length;
        setHighlight(next);
        itemRefs.current[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = (highlight - 1 + menuItems.length) % menuItems.length;
        setHighlight(next);
        itemRefs.current[next]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        setHighlight(0);
        itemRefs.current[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        const last = menuItems.length - 1;
        setHighlight(last);
        itemRefs.current[last]?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, highlight, menuItems.length]);

  const add = (placement: NodePlacement) => {
    addNode({ anchorNodeId: nodeId, placement });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="nodrag nopan relative">
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={variant === "start" ? "Add request" : "Add step"}
          className="glass-heavy absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-line p-1 shadow-panel"
        >
          {menuItems.map((item, i) => (
            <div key={item.title}>
              {i > 0 && <div className="mx-2 h-px bg-line" />}
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-foreground/6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                onClick={item.action}
              >
                <span className="text-[13px] font-semibold text-foreground">{item.title}</span>
                <span className="text-[11px] leading-snug text-muted">{item.description}</span>
              </button>
            </div>
          ))}
        </div>
      )}
      {/* 44px touch target; visual button stays 24px */}
      <button
        type="button"
        aria-label={variant === "start" ? "Add request" : "Add step"}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span className="flex size-6 items-center justify-center rounded-full border-2 border-accent bg-canvas text-accent shadow-sm transition-all duration-200 ease-out hover:scale-110 hover:border-accent hover:bg-accent hover:text-on-accent motion-reduce:transition-none motion-reduce:hover:transform-none">
          <AddIcon />
        </span>
      </button>
      {importOpen && (
        <ImportNodeModal
          anchorNodeId={nodeId}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
