"use client";

import type { Method } from "@/lib/types";

/** Method chip colors come from the CSS palette so dark mode follows. */
export function methodStyle(method: Method): React.CSSProperties {
  const m = method.toLowerCase();
  return {
    color: `var(--m-${m})`,
    background: `var(--m-${m}-bg)`,
  };
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
      style={methodStyle(method)}
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
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface shadow-node">
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
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

export const selectCls =
  "rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent";

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-accent-strong px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-2 disabled:opacity-50";
