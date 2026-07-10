"use client";

import { createPortal } from "react-dom";
import { METHOD_COLORS } from "@/lib/method-colors";
import type { Method } from "@/lib/types";

export function MethodChip({
  method,
  className = "",
}: {
  method: Method;
  className?: string;
}) {
  return (
    <span
      style={METHOD_COLORS[method]}
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ${className}`}
    >
      {method}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Portal to body: backdrop-filter on .glass ancestors turns them into
  // containing blocks, which would trap this fixed overlay inside the panel.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-heavy flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-0.5 text-muted transition hover:bg-surface-2 hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export const inputCls = "inspector-field";

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
