"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import { ApiNode } from "@/components/canvas/ApiNode";
import { useActiveWorkflow, useStore } from "@/lib/store";

const nodeTypes = { api: ApiNode };

export function FlowCanvas() {
  const workflow = useActiveWorkflow();
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const addNode = useStore((s) => s.addNode);
  const selectNode = useStore((s) => s.selectNode);
  const runningEdgeId = useStore((s) => s.runningEdgeId);
  const doneEdgeIds = useStore((s) => s.doneEdgeIds);
  const { screenToFlowPosition } = useReactFlow();

  const edges: Edge[] = useMemo(
    () =>
      (workflow?.edges ?? []).map((e) => ({
        ...e,
        className:
          e.id === runningEdgeId
            ? "edge-running"
            : doneEdgeIds.includes(e.id)
              ? "edge-done"
              : undefined,
      })),
    [workflow?.edges, runningEdgeId, doneEdgeIds],
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      addNode(
        screenToFlowPosition({ x: event.clientX - 112, y: event.clientY - 30 }),
      );
    },
    [addNode, screenToFlowPosition],
  );

  if (!workflow) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        Create a workflow to get started
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <ReactFlow
        nodes={workflow.nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onDoubleClick={onDoubleClick}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: false }}
        fitView
        zoomOnDoubleClick={false}
        deleteKeyCode={["Backspace", "Delete"]}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.5}
          color="var(--canvas-dot)"
        />
        <MiniMap pannable zoomable position="bottom-right" />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
      <button
        onClick={() => addNode()}
        className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium shadow-panel transition hover:bg-surface-2"
        title="Add a request node (or double-click the canvas)"
      >
        <span className="text-accent">+</span> Add request
      </button>
    </div>
  );
}
