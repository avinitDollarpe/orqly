"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";
import { ApiNode } from "@/components/canvas/ApiNode";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { StartNode } from "@/components/canvas/StartNode";
import { useActiveWorkflow, useStore } from "@/lib/store";

const nodeTypes = { api: ApiNode, start: StartNode };

export function FlowCanvas() {
  const workflow = useActiveWorkflow();
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const onNodeDragStart = useStore((s) => s.onNodeDragStart);
  const addNode = useStore((s) => s.addNode);
  const selectNode = useStore((s) => s.selectNode);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const runningEdgeId = useStore((s) => s.runningEdgeId);
  const doneEdgeIds = useStore((s) => s.doneEdgeIds);
  const { fitView } = useReactFlow();

  // Re-center when switching to (or creating) another workflow, otherwise the
  // new graph renders wherever the previous viewport happened to be
  const workflowId = workflow?.id;
  useEffect(() => {
    if (!workflowId) return;
    const raf = requestAnimationFrame(() =>
      void fitView({ padding: 0.3, maxZoom: 1 }),
    );
    return () => cancelAnimationFrame(raf);
  }, [workflowId, fitView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

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

  const onDoubleClick = useCallback(() => {
      addNode();
    },
    [addNode],
  );

  if (!workflow) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
        Create a workflow to get started
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={workflow.nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        onNodeDragStart={onNodeDragStart}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onDoubleClick={onDoubleClick}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
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
        <CanvasToolbar />
      </ReactFlow>
    </div>
  );
}
