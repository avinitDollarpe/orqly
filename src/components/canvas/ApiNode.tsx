"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { MethodChip } from "@/components/shared/ui";
import { useStore } from "@/lib/store";
import type { ApiNode as ApiNodeType, NodeRunStatus } from "@/lib/types";

const ringByStatus: Record<NodeRunStatus, string> = {
  idle: "border-line",
  running: "border-accent node-running",
  success: "border-(--success)",
  error: "border-(--danger)",
  skipped: "border-line opacity-50",
};

export const ApiNode = memo(function ApiNode({
  id,
  data,
  selected,
}: NodeProps<ApiNodeType>) {
  const run = useStore((s) => s.runs[id]);
  const status: NodeRunStatus = run?.status ?? "idle";

  return (
    <div
      className={`w-56 rounded-xl border bg-surface shadow-node transition-colors ${
        ringByStatus[status]
      } ${selected ? "ring-2 ring-accent/40" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <MethodChip method={data.method} />
        <span className="truncate text-[13px] font-semibold">{data.label}</span>
        {status === "success" && run?.response && (
          <span className="ml-auto shrink-0 font-mono text-[10px] text-(--success)">
            {run.response.ms}ms
          </span>
        )}
        {status === "error" && (
          <span className="ml-auto shrink-0 font-mono text-[10px] text-(--danger)">
            failed
          </span>
        )}
        {status === "skipped" && (
          <span className="ml-auto shrink-0 font-mono text-[10px] text-faint">
            skipped
          </span>
        )}
      </div>
      <div className="truncate px-3 pt-1 pb-2.5 font-mono text-[11px] text-muted">
        {data.url || <span className="text-faint">no URL yet</span>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
