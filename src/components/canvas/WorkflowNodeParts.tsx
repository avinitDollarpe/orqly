"use client";

import type { ReactNode } from "react";

export const NODE_W = 280;
export const NODE_H = 125;

const handleCls =
  "!size-3 !rounded-full !border-2 !border-accent !bg-canvas !opacity-40 !transition-opacity hover:!opacity-100 group-hover:!opacity-100";

export { handleCls };

export function NodeTintGradient({ hue, children }: { hue: string; children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full py-1 pr-1 pl-2"
      style={{
        background: `linear-gradient(to right, color-mix(in srgb, ${hue} 8.2%, transparent), transparent)`,
      }}
    >
      {children}
    </div>
  );
}

export function NodeTitleRow({
  hue,
  icon,
  title,
  step,
  emphasized = false,
}: {
  hue: string;
  icon: ReactNode;
  title: string;
  step: number;
  emphasized?: boolean;
}) {
  return (
    <NodeTintGradient hue={hue}>
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5 truncate leading-tight"
        style={{ color: hue }}
      >
        {icon}
        <span
          className={`truncate text-[15px] tracking-[-0.01em] ${emphasized ? "font-bold" : "font-medium"}`}
        >
          {title}
        </span>
      </div>
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-medium leading-none"
        style={{ color: hue, borderColor: hue }}
        aria-label={`Step ${step}`}
      >
        {step}
      </span>
    </NodeTintGradient>
  );
}

export function NodeField({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-white/12 bg-foreground/[0.03] px-3 py-2 transition-colors duration-150">
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      {trailing}
    </div>
  );
}

export function NodeChevron() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M18 9 12 15 6 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NodeMetaBadge({
  chip,
  detail,
  hue = "var(--accent)",
}: {
  chip: string;
  detail?: string;
  hue?: string;
}) {
  return (
    <span className="inline-flex h-7 max-w-full items-center gap-1 overflow-hidden rounded-full border border-white/10 bg-foreground/[0.04] py-0.5 pr-2.5 pl-1 font-mono text-[10px] font-medium tracking-[0.12em] uppercase backdrop-blur-sm">
      <span
        className="shrink-0 rounded-full px-2 py-0.5"
        style={{
          color: hue,
          background: `color-mix(in srgb, ${hue} 14%, transparent)`,
        }}
      >
        {chip}
      </span>
      {detail && (
        <span className="truncate text-muted normal-case tracking-normal">{detail}</span>
      )}
    </span>
  );
}

export function NodeShell({
  selected,
  statusClass = "",
  children,
}: {
  selected?: boolean;
  statusClass?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`workflow-node flex flex-col gap-2 rounded-[20px] p-2 transition-[box-shadow,border-color] duration-200 ease-out ${statusClass} ${
        selected ? "workflow-node--selected" : ""
      }`}
      style={{ width: NODE_W, height: NODE_H }}
    >
      {children}
    </div>
  );
}

/** Strip origin for display; keep template URLs intact. */
export function urlDisplayPath(url: string): string {
  if (!url.trim()) return "";
  if (url.includes("{{")) return url;
  try {
    const parsed = new URL(
      url.includes("://") ? url : `https://stub${url.startsWith("/") ? "" : "/"}${url}`,
    );
    return `${parsed.pathname}${parsed.search}` || url;
  } catch {
    return url;
  }
}

export function TaskIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.37 8.88h5.25M6.38 8.88l.75.75 2.25-2.25M12.37 15.88h5.25M6.38 15.88l.75.75 2.25-2.25M9 22h6c5 0 7-2 7-7V9c0-5-2-7-7-7H9C4 2 2 4 2 9v6c0 5 2 7 7 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z"
      />
    </svg>
  );
}
