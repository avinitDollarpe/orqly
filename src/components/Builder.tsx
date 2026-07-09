"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { Inspector } from "@/components/inspector/Inspector";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/TopBar";
import { WorkflowWizard } from "@/components/WorkflowWizard";
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
  const wizardOpen = useStore((s) => s.wizardOpen);
  const setWizardOpen = useStore((s) => s.setWizardOpen);

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
      <div className="relative h-screen overflow-hidden bg-background">
        <FlowCanvas />
        <Sidebar />
        <TopBar userName={userName} userEmail={userEmail} />
        {selectedNodeId && <Inspector key={selectedNodeId} />}
        {wizardOpen && <WorkflowWizard onClose={() => setWizardOpen(false)} />}
      </div>
    </ReactFlowProvider>
  );
}
