"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { METHOD_COLORS } from "@/lib/method-colors";
import type { Method } from "@/lib/types";

/** Escape closes; traps Tab inside panel; restores focus on close. */
export function useDialogBasics(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const focusable = () => {
      const root = panelRef.current;
      if (!root) return [] as HTMLElement[];
      return [
        ...root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute("disabled"));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreFocus.current?.focus();
    };
  }, [onClose]);

  return panelRef;
}

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
  const panelRef = useDialogBasics(onClose);
  // Portal to body: backdrop-filter on .glass ancestors turns them into
  // containing blocks, which would trap this fixed overlay inside the panel.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="glass-heavy flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-0.5 text-muted transition hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

/** beui.dev "Dot Matrix" loader — 3×3 dots, diagonal wave. Colors via currentColor. */
// ponytail: CSS-only port of the beui variant; grab their full component if more variants needed
export function DotMatrixLoader({
  size = 32,
  label = "Loading",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  const gap = size * 0.14;
  const dot = (size - gap * 2) / 3;
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-grid ${className}`}
      style={{ gap, gridTemplateColumns: `repeat(3, ${dot}px)` }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="dot-matrix-cell rounded-full bg-current"
          style={{
            width: dot,
            height: dot,
            // Diagonal wave: delay grows with distance from top-left corner.
            animationDelay: `${(((i % 3) + Math.floor(i / 3)) / 4).toFixed(3)}s`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export const inputCls = "inspector-field";

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
