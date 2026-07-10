"use client";

import { ReactFlowProvider } from "@xyflow/react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DotMatrixLoader } from "@/components/shared/ui";
import { useStore } from "@/lib/store";

const Inspector = dynamic(
  () => import("@/components/inspector/Inspector").then((m) => ({ default: m.Inspector })),
  { ssr: false },
);

const WorkflowWizard = dynamic(
  () => import("@/components/WorkflowWizard").then((m) => ({ default: m.WorkflowWizard })),
  { ssr: false },
);

export function Builder({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const {
    hydrated,
    hydrate,
    selectedNodeId,
    wizardOpen,
    setWizardOpen,
    deleteWorkflowConfirm,
    setDeleteWorkflowConfirm,
    deleteWorkflow,
    setSidebarOpen,
  } = useStore(
    useShallow((s) => ({
      hydrated: s.hydrated,
      hydrate: s.hydrate,
      selectedNodeId: s.selectedNodeId,
      wizardOpen: s.wizardOpen,
      setWizardOpen: s.setWizardOpen,
      deleteWorkflowConfirm: s.deleteWorkflowConfirm,
      setDeleteWorkflowConfirm: s.setDeleteWorkflowConfirm,
      deleteWorkflow: s.deleteWorkflow,
      setSidebarOpen: s.setSidebarOpen,
    })),
  );

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  // Tablet floor: the fixed-width sidebar would cover most of the canvas,
  // so it starts closed below lg and stays user-toggleable
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setSidebarOpen(false);
  }, [setSidebarOpen]);

  if (!hydrated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-sm text-muted">
        <DotMatrixLoader size={28} label="Loading your workspace" className="text-accent" />
        <span aria-hidden>Loading your workspace…</span>
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
