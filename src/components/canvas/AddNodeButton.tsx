"use client";

import { useEffect, useRef, useState } from "react";
import { ImportNodeModal } from "@/components/canvas/ImportNodeModal";
import { useStore } from "@/lib/store";
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

function MenuItem({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-foreground/6"
      onClick={onClick}
    >
      <span className="text-[13px] font-semibold text-foreground">{title}</span>
      <span className="text-[11px] leading-snug text-muted">{description}</span>
    </button>
  );
}

export function AddNodeButton({ nodeId, variant = "api" }: Props) {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const addNode = useStore((s) => s.addNode);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const add = (placement: NodePlacement) => {
    addNode({ anchorNodeId: nodeId, placement });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="nodrag nopan relative">
      {open && (
        <div className="glass-heavy absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-line p-1 shadow-panel">
          {variant === "api" ? (
            <>
              <MenuItem
                title="Same row"
                description="Place to the right, run after the same parent"
                onClick={() => add("same")}
              />
              <div className="mx-2 h-px bg-line" />
              <MenuItem
                title="Below"
                description="Run after this step"
                onClick={() => add("below")}
              />
            </>
          ) : (
            <MenuItem
              title="Blank request"
              description="An empty request to fill in yourself"
              onClick={() => add("below")}
            />
          )}
          <div className="mx-2 h-px bg-line" />
          <MenuItem
            title="Import…"
            description="cURL, OpenAPI, Swagger or Postman"
            onClick={() => {
              setOpen(false);
              setImportOpen(true);
            }}
          />
        </div>
      )}
      <button
        type="button"
        aria-label={variant === "start" ? "Add request" : "Add step"}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-6 cursor-pointer items-center justify-center rounded-full border-2 border-accent bg-canvas p-0 text-accent shadow-sm transition-all duration-200 ease-out hover:scale-110 hover:border-accent hover:bg-accent hover:text-on-accent motion-reduce:transition-none motion-reduce:hover:transform-none"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <AddIcon />
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
