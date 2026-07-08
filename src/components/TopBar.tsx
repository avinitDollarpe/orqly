"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { btnGhost, btnPrimary, selectCls } from "@/components/shared/ui";
import { authClient } from "@/lib/auth-client";
import { runWorkflow } from "@/lib/runner";
import { useActiveWorkflow, useStore } from "@/lib/store";
import type { WorkflowBundle } from "@/lib/types";

export function TopBar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const workflow = useActiveWorkflow();
  const environments = useStore((s) => s.environments);
  const activeEnvId = useStore((s) => s.activeEnvId);
  const setActiveEnv = useStore((s) => s.setActiveEnv);
  const renameWorkflow = useStore((s) => s.renameWorkflow);
  const importBundle = useStore((s) => s.importBundle);
  const isRunning = useStore((s) => s.isRunning);
  const saveState = useStore((s) => s.saveState);
  const savedBodies = useStore((s) => s.savedBodies);
  const headerSets = useStore((s) => s.headerSets);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportWorkflow() {
    if (!workflow) return;
    const bundle: WorkflowBundle = {
      orqly: 1,
      workflow,
      savedBodies: savedBodies.filter((b) =>
        workflow.nodes.some((n) => n.data.savedBodyId === b.id),
      ),
      headerSets: headerSets.filter((h) =>
        workflow.nodes.some((n) => n.data.headerSetId === h.id),
      ),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${workflow.name.replace(/\s+/g, "-").toLowerCase()}.orqly.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importFile(file: File) {
    try {
      const bundle = JSON.parse(await file.text());
      if (bundle?.orqly !== 1 || !bundle.workflow) {
        throw new Error("Not an Orqly export");
      }
      importBundle(bundle as WorkflowBundle);
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  return (
    <header className="flex h-13 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
      {workflow && (
        <input
          value={workflow.name}
          onChange={(e) => renameWorkflow(workflow.id, e.target.value)}
          className="w-52 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold outline-none transition hover:border-line focus:border-accent"
          aria-label="Workflow name"
        />
      )}
      <span className="flex-1" />
      <span
        className={`font-mono text-[11px] transition ${
          saveState === "saving"
            ? "text-warning"
            : saveState === "error"
              ? "text-danger"
              : saveState === "saved"
                ? "text-faint"
                : "text-transparent"
        }`}
      >
        {saveState === "saving"
          ? "Saving…"
          : saveState === "error"
            ? "Save failed"
            : "Saved"}
      </span>
      <select
        value={activeEnvId ?? ""}
        onChange={(e) => setActiveEnv(e.target.value || null)}
        className={selectCls}
        aria-label="Environment"
      >
        <option value="">No environment</option>
        {environments.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name}
          </option>
        ))}
      </select>
      <button onClick={exportWorkflow} disabled={!workflow} className={btnGhost}>
        Export
      </button>
      <button onClick={() => fileRef.current?.click()} className={btnGhost}>
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => workflow && runWorkflow(workflow)}
        disabled={!workflow || isRunning || workflow.nodes.length === 0}
        className={btnPrimary}
      >
        {isRunning ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Running…
          </>
        ) : (
          <>▶ Run flow</>
        )}
      </button>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
          title={userEmail}
        >
          {(userName || userEmail).charAt(0).toUpperCase()}
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-node">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted">{userEmail}</p>
            </div>
            <button
              onClick={async () => {
                await authClient.signOut();
                router.push("/sign-in");
                router.refresh();
              }}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-surface-2"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
