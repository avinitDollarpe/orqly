"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { Inspector } from "@/components/inspector/Inspector";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
  const deleteWorkflowConfirm = useStore((s) => s.deleteWorkflowConfirm);
  const setDeleteWorkflowConfirm = useStore((s) => s.setDeleteWorkflowConfirm);
  const deleteWorkflow = useStore((s) => s.deleteWorkflow);

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
        <TopBar userName={userName} userEmail={userEmail} />
        <Sidebar />
        {selectedNodeId && <Inspector key={selectedNodeId} />}
        {wizardOpen && <WorkflowWizard onClose={() => setWizardOpen(false)} />}
        <ConfirmDialog
          open={deleteWorkflowConfirm != null}
          title="Delete workflow?"
          description={
            deleteWorkflowConfirm ? (
              <>
                <span className="font-semibold text-foreground">
                  {deleteWorkflowConfirm.name}
                </span>{" "}
                and its{" "}
                {deleteWorkflowConfirm.requests === 1
                  ? "1 request node"
                  : `${deleteWorkflowConfirm.requests} request nodes`}{" "}
                will be removed from your workspace. This cannot be undone.
              </>
            ) : null
          }
          cancelLabel="Keep workflow"
          confirmLabel="Delete workflow"
          onCancel={() => setDeleteWorkflowConfirm(null)}
          onConfirm={() => {
            if (deleteWorkflowConfirm) deleteWorkflow(deleteWorkflowConfirm.id);
            setDeleteWorkflowConfirm(null);
          }}
        />
      </div>
    </ReactFlowProvider>
  );
}
