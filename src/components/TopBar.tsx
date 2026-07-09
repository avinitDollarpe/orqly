"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { runWorkflow } from "@/lib/runner";
import { useActiveWorkflow, useStore } from "@/lib/store";
import type { WorkflowBundle } from "@/lib/types";

/* Slim rounded status pill, mono + uppercase like the reference bar */
const pillCls =
  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-foreground/5 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase";

/* Square ghost icon button on the right cluster */
const iconBtnCls =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40";

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={d}
      />
    </svg>
  );
}

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

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
  const addNode = useStore((s) => s.addNode);
  const isRunning = useStore((s) => s.isRunning);
  const saveState = useStore((s) => s.saveState);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const savedBodies = useStore((s) => s.savedBodies);
  const headerSets = useStore((s) => s.headerSets);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  function exportWorkflow() {
    if (!workflow) return;
    const bundle: WorkflowBundle = {
      orqly: 1,
      workflow,
      savedBodies: savedBodies.filter((b) =>
        workflow.nodes.some((n) => n.type === "api" && n.data.savedBodyId === b.id),
      ),
      headerSets: headerSets.filter((h) =>
        workflow.nodes.some((n) => n.type === "api" && n.data.headerSetId === h.id),
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

  const requestCount = workflow?.nodes.filter((n) => n.type === "api").length ?? 0;

  return (
    <header
      className={`absolute top-3 right-4 z-20 flex h-11 items-center gap-2 transition-[left] duration-300 ease-out motion-reduce:transition-none ${
        sidebarOpen ? "left-[264px]" : "left-14"
      }`}
    >
      {/* left: workflow name + critical values */}
      {workflow && (
        <>
          <input
            value={workflow.name}
            onChange={(e) => renameWorkflow(workflow.id, e.target.value)}
            className="w-44 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-bold tracking-tight outline-none transition hover:border-line focus:border-accent"
            aria-label="Workflow name"
          />
          <span className={pillCls}>
            <span className="text-foreground/80">{requestCount}</span>
            <span className="text-faint">
              {requestCount === 1 ? "request" : "requests"}
            </span>
          </span>
          <span className={pillCls}>
            {saveState === "saving" ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
                <span className="text-warning">Saving…</span>
              </>
            ) : saveState === "error" ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                <span className="text-danger">Save failed</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-success">Saved</span>
                {lastSavedAt && (
                  <span className="text-faint">{timeOf(lastSavedAt)}</span>
                )}
              </>
            )}
          </span>
        </>
      )}

      <span className="flex-1" />

      {/* right: environment, actions, run, profile */}
      <span className="relative inline-flex items-center">
        <select
          value={activeEnvId ?? ""}
          onChange={(e) => setActiveEnv(e.target.value || null)}
          className="cursor-pointer appearance-none rounded-full border border-white/10 bg-foreground/5 py-1.5 pr-7 pl-3 font-mono text-[10px] font-semibold tracking-[0.08em] text-foreground uppercase transition outline-none hover:border-white/25 focus-visible:border-accent"
          aria-label="Environment"
        >
          <option value="">No env</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 h-2.5 w-2.5 text-muted"
          viewBox="0 0 10 10"
          aria-hidden
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2 3.5 3 3 3-3"
          />
        </svg>
      </span>

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />

      <button
        onClick={() => addNode()}
        disabled={!workflow}
        className={iconBtnCls}
        title="Add request"
        aria-label="Add request"
      >
        <Icon d="M8 3v10M3 8h10" />
      </button>
      <button
        onClick={exportWorkflow}
        disabled={!workflow}
        className={iconBtnCls}
        title="Export workflow"
        aria-label="Export workflow"
      >
        <Icon d="M8 2.5v7.5m0 0 3-3m-3 3-3-3M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" />
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className={iconBtnCls}
        title="Import workflow"
        aria-label="Import workflow"
      >
        <Icon d="M8 10V2.5m0 0 3 3m-3-3-3 3M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" />
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
        disabled={!workflow || isRunning || requestCount === 0}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-on-accent transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
      >
        {isRunning ? (
          <>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-accent" />
            Running…
          </>
        ) : (
          <>
            <svg className="h-3 w-3" viewBox="0 0 16 16" aria-hidden>
              <path
                fill="currentColor"
                d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z"
              />
            </svg>
            Run flow
          </>
        )}
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold text-foreground transition hover:bg-foreground/15"
          title={userEmail}
          aria-label="Profile"
        >
          {(userName || userEmail).charAt(0).toUpperCase()}
        </button>
        {menuOpen && (
          <div className="glass-heavy absolute right-0 z-20 mt-2 w-56 rounded-xl p-1.5">
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
              className="w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-foreground/5"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
