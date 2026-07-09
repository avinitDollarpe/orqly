"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid min-h-dvh w-full place-items-center bg-black/65 p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="confirm-dialog glass-heavy w-full max-w-[380px] overflow-hidden rounded-[22px] p-6 text-center"
      >
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset ring-danger/25"
          style={{
            color: "var(--danger)",
            background: "color-mix(in srgb, var(--danger) 12%, transparent)",
          }}
          aria-hidden
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h2
          id="confirm-dialog-title"
          className="mt-4 text-[18px] font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>
        <div
          id="confirm-dialog-desc"
          className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-muted"
        >
          {description}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="nav-row inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-white/12 bg-foreground/[0.04] text-sm font-medium text-foreground transition hover:bg-foreground/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="nav-row inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-danger text-sm font-semibold text-on-accent transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
