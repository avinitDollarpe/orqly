"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { MethodChip } from "@/components/shared/ui";
import { useActiveWorkflow, useStore } from "@/lib/store";
import type { ApiNode as ApiNodeType, NodeRunStatus } from "@/lib/types";

const ringByStatus: Record<NodeRunStatus, string> = {
  idle: "",
  running: "ring-2 ring-accent/50 node-running",
  success: "ring-2 ring-(--success)/50",
  error: "ring-2 ring-(--danger)/50",
  skipped: "opacity-50",
};

function RequestIcon() {
  return (
    <svg className="h-4 w-4 flex-none" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 2.5h8.5A1.5 1.5 0 0 1 13 4v8a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 12V2.5Zm2.6 3.4h4.8m-4.8 2.6h4.8m-4.8 2.6h3"
      />
    </svg>
  );
}

export const ApiNode = memo(function ApiNode({
  id,
  data,
  selected,
}: NodeProps<ApiNodeType>) {
  const run = useStore((s) => s.runs[id]);
  const workflow = useActiveWorkflow();
  const status: NodeRunStatus = run?.status ?? "idle";

  // 1-based step number among request nodes (Start is 0)
  const step =
    (workflow?.nodes.filter((n) => n.type === "api").findIndex((n) => n.id === id) ??
      0) + 1;

  const hue = `var(--m-${data.method.toLowerCase()})`;

  return (
    <div
      className={`glass w-64 rounded-2xl p-2 transition-shadow ${
        ringByStatus[status]
      } ${selected ? "ring-2 ring-accent/40" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !bg-surface"
        style={{ borderColor: hue }}
      />
      {/* header: label tinted by method hue + step badge */}
      <div
        className="flex items-center justify-between rounded-xl px-2.5 py-1.5"
        style={{
          background: `linear-gradient(90deg, color-mix(in srgb, ${hue} 14%, transparent), transparent)`,
        }}
      >
        <span
          className="flex min-w-0 items-center gap-2 text-[15px] font-semibold"
          style={{ color: hue }}
        >
          <RequestIcon />
          <span className="truncate">{data.label}</span>
        </span>
        <span
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full border font-mono text-[11px] font-semibold"
          style={{ color: hue, borderColor: `color-mix(in srgb, ${hue} 70%, transparent)` }}
        >
          {step}
        </span>
      </div>
      {/* body: request summary field */}
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-foreground/4 px-2.5 py-2">
        <MethodChip method={data.method} className="flex-none" />
        <span className="min-w-0 truncate font-mono text-[11px] text-muted">
          {data.url || <span className="text-faint">no URL yet</span>}
        </span>
      </div>
      {/* footer: status pill */}
      <div className="mt-2 flex items-center gap-1.5 px-0.5 pb-0.5">
        {status === "success" && run?.response ? (
          <span className="rounded-full bg-(--success)/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-(--success)">
            {run.response.status} · {run.response.ms}ms
          </span>
        ) : status === "error" ? (
          <span className="rounded-full bg-(--danger)/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-(--danger)">
            FAILED
          </span>
        ) : status === "running" ? (
          <span className="rounded-full bg-accent/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
            RUNNING…
          </span>
        ) : status === "skipped" ? (
          <span className="rounded-full bg-foreground/8 px-2 py-0.5 font-mono text-[10px] font-semibold text-faint">
            SKIPPED
          </span>
        ) : (
          <span className="rounded-full bg-foreground/8 px-2 py-0.5 font-mono text-[10px] font-semibold text-faint">
            READY
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !bg-surface"
        style={{ borderColor: hue }}
      />
    </div>
  );
});
