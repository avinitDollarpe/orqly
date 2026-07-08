"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { Inspector } from "@/components/inspector/Inspector";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/TopBar";
import { useStore } from "@/lib/store";

export function Builder({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const selectedNodeId = useStore((s) => s.selectedNodeId);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted">
        <span className="animate-pulse">Loading your workspace…</span>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar userName={userName} userEmail={userEmail} />
          <div className="flex min-h-0 flex-1">
            <FlowCanvas />
            {selectedNodeId && <Inspector key={selectedNodeId} />}
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
