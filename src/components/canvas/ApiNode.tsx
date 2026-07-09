"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { AddNodeButton } from "@/components/canvas/AddNodeButton";
import {
  handleCls,
  NodeChevron,
  NodeField,
  NodeMetaBadge,
  NodeShell,
  NodeTitleRow,
  TaskIcon,
  urlDisplayPath,
} from "@/components/canvas/WorkflowNodeParts";
import { MethodChip } from "@/components/shared/ui";
import { methodHue } from "@/lib/method-colors";
import { nodeLevel } from "@/lib/layout";
import { useActiveWorkflow, useStore } from "@/lib/store";
import type { ApiNode as ApiNodeType, NodeRun, NodeRunStatus } from "@/lib/types";

const ringByStatus: Record<NodeRunStatus, string> = {
  idle: "",
  running: "ring-2 ring-accent/45 node-running",
  success: "ring-2 ring-(--success)/40",
  error: "ring-2 ring-(--danger)/40",
  skipped: "opacity-55",
};

function runMeta(status: NodeRunStatus, run?: NodeRun) {
  switch (status) {
    case "success":
      return {
        chip: "OK",
        detail: run?.response ? `${run.response.status} · ${run.response.ms}ms` : undefined,
        hue: "var(--success)",
      };
    case "error":
      return { chip: "Failed", detail: run?.error, hue: "var(--danger)" };
    case "running":
      return { chip: "Running", hue: "var(--accent)" };
    case "skipped":
      return { chip: "Skipped", hue: "var(--faint)" };
    default:
      return { chip: "Ready", hue: "var(--accent)" };
  }
}

export const ApiNode = memo(function ApiNode({
  id,
  data,
  selected,
}: NodeProps<ApiNodeType>) {
  const run = useStore((s) => s.runs[id]);
  const workflow = useActiveWorkflow();
  const status: NodeRunStatus = run?.status ?? "idle";
  const step = workflow ? nodeLevel(workflow, id) : 1;
  const hue = methodHue(data.method).color;
  const path = urlDisplayPath(data.url);
  const meta = runMeta(status, run);

  return (
    <div className="group relative">
      <NodeShell selected={selected} statusClass={ringByStatus[status]}>
        <Handle type="target" position={Position.Top} className={handleCls} />

        <NodeTitleRow
          hue={hue}
          icon={<TaskIcon />}
          title={data.label}
          step={step}
          emphasized={selected}
        />

        <NodeField trailing={<NodeChevron />}>
          <MethodChip method={data.method} className="shrink-0" />
          <span className="min-w-0 truncate font-mono text-[12px] leading-none text-foreground">
            {path || <span className="font-sans text-[13px] text-faint">No URL yet</span>}
          </span>
        </NodeField>

        <div className="flex px-1">
          <NodeMetaBadge chip={meta.chip} detail={meta.detail} hue={meta.hue} />
        </div>

        <Handle type="source" position={Position.Bottom} className={handleCls} />
      </NodeShell>

      <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
        <AddNodeButton nodeId={id} />
      </div>
    </div>
  );
});
