"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { StartNode as StartNodeType } from "@/lib/types";

export const StartNode = memo(function StartNode({
  selected,
}: NodeProps<StartNodeType>) {
  return (
    <div
      className={`glass w-64 rounded-2xl p-2 transition-shadow ${
        selected ? "ring-2 ring-(--success)/40" : ""
      }`}
    >
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-(--success)/15 to-transparent px-2.5 py-1.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-(--success)">
          <svg className="h-4 w-4 flex-none" viewBox="0 0 16 16" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z"
            />
          </svg>
          Start
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-(--success)/70 font-mono text-[11px] font-semibold text-(--success)">
          0
        </span>
      </div>
      <div className="mt-2 rounded-xl border border-white/10 bg-foreground/4 px-3 py-3 text-[12.5px] leading-snug text-muted">
        The beginning of your workflow. Connect to the first step.
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-(--success) !bg-surface"
      />
    </div>
  );
});
