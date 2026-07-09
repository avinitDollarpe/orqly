"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { AddNodeButton } from "@/components/canvas/AddNodeButton";
import {
  handleCls,
  NodeField,
  NodeMetaBadge,
  NodeShell,
  NodeTitleRow,
  PlayIcon,
} from "@/components/canvas/WorkflowNodeParts";
import type { StartNode as StartNodeType } from "@/lib/types";

const success = "var(--success)";

export const StartNode = memo(function StartNode({
  id,
  selected,
}: NodeProps<StartNodeType>) {
  return (
    <div className="relative">
      <NodeShell selected={selected}>
        <NodeTitleRow
          hue={success}
          icon={<PlayIcon />}
          title="Start"
          step={0}
          emphasized={selected}
        />

        <NodeField>
          <span className="truncate text-[13px] leading-snug text-muted">
            Entry point for your workflow
          </span>
        </NodeField>

        <div className="flex px-1">
          <NodeMetaBadge chip="Trigger" hue={success} />
        </div>

        <Handle type="source" position={Position.Bottom} className={handleCls} />
      </NodeShell>

      <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
        <AddNodeButton nodeId={id} variant="start" />
      </div>
    </div>
  );
});
