"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { PillPicker } from "@/components/PillPicker";
import { authClient } from "@/lib/auth-client";
import { runWorkflow } from "@/lib/runner";
import { useActiveWorkflow, useStore } from "@/lib/store";

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

function MetaItem({
  label,
  value,
  chip,
}: {
  label: string;
  value?: string;
  chip?: { text: string; tone: "success" | "warning" | "danger" };
}) {
  const chipTone = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[chip?.tone ?? "success"];

  const detail = [value, label].filter(Boolean).join(" ");

  return (
    <span className="nav-row inline-flex shrink-0 items-center gap-2 font-mono text-xs font-bold tracking-[0.08em] uppercase">
      {chip && <span className={chipTone}>{chip.text}</span>}
      {detail && <span className="text-muted">{detail}</span>}
    </span>
  );
}

export function TopBar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const workflow = useActiveWorkflow();
  const {
    environments,
    activeEnvId,
    setActiveEnv,
    headerSets,
    activeHeaderSetId,
    setActiveHeaderSet,
    renameWorkflow,
    isRunning,
    saveState,
    lastSavedAt,
    retrySaves,
  } = useStore(
    useShallow((s) => ({
      environments: s.environments,
      activeEnvId: s.activeEnvId,
      setActiveEnv: s.setActiveEnv,
      headerSets: s.headerSets,
      activeHeaderSetId: s.activeHeaderSetId,
      setActiveHeaderSet: s.setActiveHeaderSet,
      renameWorkflow: s.renameWorkflow,
      isRunning: s.isRunning,
      saveState: s.saveState,
      lastSavedAt: s.lastSavedAt,
      retrySaves: s.retrySaves,
    })),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const envLabel = environments.find((e) => e.id === activeEnvId)?.name ?? "No env";
  const headerLabel =
    headerSets.find((h) => h.id === activeHeaderSetId)?.name ?? "No headers";
  const requestCount = workflow?.nodes.filter((n) => n.type === "api").length ?? 0;

  const saveChip =
    saveState === "saving"
      ? { text: "Saving…", tone: "warning" as const }
      : saveState === "error"
        ? { text: "Failed", tone: "danger" as const }
        : { text: "Saved", tone: "success" as const };

  return (
    <header className="pointer-events-none absolute top-3 right-3 left-3 z-50 flex nav-row items-center gap-2">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-[19px] leading-none font-bold text-on-accent">
          ⌘
        </span>
        <span className="hidden text-sm font-semibold leading-none tracking-tight sm:inline">Orqly</span>

        {workflow && (
          <>
            <input
              value={workflow.name}
              onChange={(e) => renameWorkflow(workflow.id, e.target.value)}
              className="nav-row max-w-[120px] min-w-0 shrink-0 truncate bg-transparent px-1 text-[15px] font-bold leading-none tracking-tight text-foreground outline-none sm:max-w-[200px]"
              aria-label="Workflow name"
            />
            <span className="hidden md:contents">
              <MetaItem
                value={String(requestCount)}
                label={requestCount === 1 ? "request" : "requests"}
              />
            </span>
            {saveState === "error" ? (
              <button
                type="button"
                onClick={retrySaves}
                className="cursor-pointer rounded-md transition hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                title="Saving failed — click to retry"
              >
                <MetaItem chip={{ text: "Save failed — retry", tone: "danger" }} label="" />
              </button>
            ) : (
              <MetaItem
                chip={saveChip}
                value={lastSavedAt && saveState !== "saving" ? timeOf(lastSavedAt) : undefined}
                label=""
              />
            )}
          </>
        )}
      </div>

      <span className="min-w-2 flex-1" />

      <div className="pointer-events-auto flex items-center gap-2">
        {/* pills crowd the nav row below lg — env/header live in sidebar editors */}
        <span className="hidden items-center gap-2 md:flex">
          <PillPicker
            ariaLabel="Header set"
            label={headerLabel}
            items={[
              { id: null, name: "No headers" },
              ...headerSets.map((h) => ({ id: h.id, name: h.name })),
            ]}
            activeId={activeHeaderSetId}
            onSelect={setActiveHeaderSet}
          />
          <PillPicker
            ariaLabel="Environment"
            label={envLabel}
            items={[
              { id: null, name: "No env" },
              ...environments.map((e) => ({ id: e.id, name: e.name })),
            ]}
            activeId={activeEnvId}
            onSelect={setActiveEnv}
          />
        </span>

        <button
          type="button"
          onClick={() => workflow && runWorkflow(workflow)}
          disabled={!workflow || isRunning || requestCount === 0}
          title={isRunning ? "Running…" : "Run flow"}
          aria-label={isRunning ? "Running…" : "Run flow"}
          className="nav-icon-btn shrink-0 text-accent transition hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {isRunning ? (
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
          ) : (
            <svg className="h-[18px] w-[18px]" viewBox="0 0 16 16" aria-hidden>
              <path
                fill="currentColor"
                d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z"
              />
            </svg>
          )}
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="nav-icon-btn border border-white/12 bg-foreground/[0.08] text-sm font-semibold text-foreground hover:border-white/20 hover:bg-foreground/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            title={userEmail}
            aria-label="Profile"
          >
            {(userName || userEmail).charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="glass-heavy absolute right-0 z-50 mt-2 w-56 rounded-xl p-1.5 shadow-panel">
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
                className="w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
