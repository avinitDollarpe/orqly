"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { importedEnvVars, type ParsedOpenApi } from "@/lib/openapi";
import { METHOD_COLORS } from "@/lib/method-colors";
import { parseApiFile } from "@/lib/postman";
import { useStore } from "@/lib/store";
import { METHODS, type ApiNode } from "@/lib/types";

/** Squash the levels a user picked down to a contiguous 1..k with no gaps. */
export function normalizeLevels(levels: number[]): Map<number, number> {
  const used = [...new Set(levels)].sort((a, b) => a - b);
  return new Map(used.map((lv, i) => [lv, i + 1]));
}

type Step =
  | { name: "choose" }
  | { name: "upload"; error?: string }
  | { name: "collecting"; fileName: string; parsed: ParsedOpenApi }
  | { name: "layout"; fileName: string; parsed: ParsedOpenApi }
  | { name: "placing"; fileName: string; parsed: ParsedOpenApi };

/* Dotted mini-canvas the previews sit on — same texture as the real canvas */
const dots: React.CSSProperties = {
  background:
    "radial-gradient(var(--canvas-dot) 1.2px, transparent 1.2px) 0 0 / 14px 14px, var(--canvas)",
};

/** Tiny request-node card, the same vocabulary as the real canvas nodes. */
function MiniNode({
  method,
  path,
  hue,
}: {
  method: string;
  path: string;
  hue: string;
}) {
  return (
    <div className="flex w-32 items-center gap-1.5 rounded-lg border border-white/10 bg-surface/90 px-2 py-1.5 shadow-node">
      <span
        className="rounded px-1 py-px font-mono text-[8px] font-bold"
        style={{ color: hue, background: `color-mix(in srgb, ${hue} 12%, transparent)` }}
      >
        {method}
      </span>
      <span className="truncate font-mono text-[9px] text-muted">{path}</span>
    </div>
  );
}

function ImportPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-3 px-3" style={dots}>
      <div className="w-28 rounded-lg border border-white/10 bg-surface/90 shadow-node">
        <div className="border-b border-line px-2 py-1 font-mono text-[9px] text-foreground/80">
          openapi.json
        </div>
        <div className="space-y-1 px-2 py-1.5 font-mono text-[8px]">
          <p style={{ color: "var(--m-get)" }}>GET /pets</p>
          <p style={{ color: "var(--m-post)" }}>POST /orders</p>
          <p style={{ color: "var(--m-delete)" }}>DELETE /pets/1</p>
        </div>
      </div>
      <svg className="h-4 w-5 flex-none text-faint" viewBox="0 0 20 16" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M1.5 8h15M12 3.5 16.5 8 12 12.5"
        />
      </svg>
      <div className="space-y-2">
        <MiniNode method="GET" path="/pets" hue="var(--m-get)" />
        <MiniNode method="POST" path="/orders" hue="var(--m-post)" />
      </div>
    </div>
  );
}

function ManualPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center" style={dots}>
      <div className="w-40 rounded-lg border border-white/10 bg-surface/90 px-2 py-1.5 shadow-node">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-(--success)">
          <svg className="h-2.5 w-2.5 flex-none" viewBox="0 0 16 16" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z"
            />
          </svg>
          Start
        </span>
      </div>
      <svg className="h-6 w-2 text-faint" viewBox="0 0 2 24" aria-hidden>
        <path stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" d="M1 0v24" />
      </svg>
      <div className="flex w-40 items-center justify-center rounded-lg border border-dashed border-white/20 px-2 py-1.5 font-mono text-[10px] text-faint">
        + first request
      </div>
    </div>
  );
}

/** A card that acts immediately — no confirm step. */
function ActionCard({
  onActivate,
  preview,
  title,
  description,
  meta,
  onDropFile,
}: {
  onActivate: () => void;
  preview: React.ReactNode;
  title: string;
  description: string;
  meta: string;
  onDropFile?: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      onClick={onActivate}
      onDragOver={
        onDropFile &&
        ((e) => {
          e.preventDefault();
          setDragging(true);
        })
      }
      onDragLeave={onDropFile && (() => setDragging(false))}
      onDrop={
        onDropFile &&
        ((e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onDropFile(f);
        })
      }
      className={`wizard-card group flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        dragging ? "border-accent/70" : "border-line hover:border-white/30"
      }`}
    >
      <div className="h-32 shrink-0 border-b border-line">{preview}</div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
          <svg
            className="h-3.5 w-3.5 flex-none text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            viewBox="0 0 16 16"
            aria-hidden
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.5 8h11m-4.5-4.5L13.5 8 9 12.5"
            />
          </svg>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">{description}</p>
        <p className="mt-auto pt-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
          {meta}
        </p>
      </div>
    </button>
  );
}

/** Staged "gathering" sequence with the real numbers from the parsed spec. */
function Processing({
  fileName,
  title,
  nodes,
  stage = "collect",
  onDone,
}: {
  fileName: string;
  title: string;
  nodes: ApiNode[];
  stage?: "collect" | "place";
  onDone: () => void;
}) {
  const [phase, setPhase] = useState(0);

  const methodCounts = METHODS.map(
    (m) => [m, nodes.filter((n) => n.data.method === m).length] as const,
  ).filter(([, c]) => c > 0);
  const bodies = nodes.filter((n) => n.data.bodyMode !== "none").length;
  const maxLevel = nodes.reduce((m, n) => Math.max(m, n.data.level ?? 1), 1);

  const lines =
    stage === "collect"
      ? [
          `Reading ${fileName}`,
          `${nodes.length} endpoint${nodes.length === 1 ? "" : "s"} found in "${title}"`,
          methodCounts.map(([m, c]) => `${m} ${c}`).join(" · "),
          `${bodies} example ${bodies === 1 ? "body" : "bodies"} prefilled`,
          `Ready to arrange ${nodes.length} nodes`,
        ]
      : [
          `Placing ${nodes.length} node${nodes.length === 1 ? "" : "s"} on the canvas`,
          `Wiring ${maxLevel} level${maxLevel === 1 ? "" : "s"} from Start`,
          `Connecting nodes to their parents`,
          `Aligning rows and columns`,
          `Finishing "${title}"`,
        ];

  useEffect(() => {
    if (phase > lines.length) return;
    const t = setTimeout(
      () => (phase === lines.length ? onDone() : setPhase((p) => p + 1)),
      phase === lines.length ? 500 : 480,
    );
    return () => clearTimeout(t);
  }, [phase, lines.length, onDone]);

  return (
    <div className="px-6 pb-6">
      <div
        className="flex min-h-64 flex-col items-center justify-center gap-6 rounded-2xl border border-line py-8"
        style={dots}
      >
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface/90 px-3 py-1.5 font-mono text-[11px] text-foreground/85 shadow-node">
          <svg className="h-3.5 w-3.5 text-faint" viewBox="0 0 16 16" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
              d="M4 1.5h5.5L13 5v8A1.5 1.5 0 0 1 11.5 14.5h-7A1.5 1.5 0 0 1 3 13V2.5a1 1 0 0 1 1-1Zm5.5 0V5H13"
            />
          </svg>
          {fileName}
        </div>
        <ul className="flex flex-col gap-2.5 font-mono text-[12px]" aria-live="polite">
          {lines.map((line, i) => {
            const done = phase > i;
            const current = phase === i;
            if (!done && !current) {
              return <li key={i} className="invisible">{line}</li>;
            }
            return (
              <li
                key={i}
                className={`flex items-center gap-2.5 ${
                  done ? "text-muted" : "text-foreground"
                }`}
              >
                {done ? (
                  <svg
                    className="h-3 w-3 flex-none text-success"
                    viewBox="0 0 12 12"
                    aria-hidden
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.5 6.2 4.8 8.5l4.7-5"
                    />
                  </svg>
                ) : (
                  <span className="h-3 w-3 flex-none">
                    <span className="block h-2 w-2 translate-x-0.5 translate-y-0.5 animate-pulse rounded-full bg-accent" />
                  </span>
                )}
                {line}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Level-picker: drag each node onto a level row before nodes are built. */
function LayoutDesigner({
  parsed,
  onBack,
  onContinue,
}: {
  parsed: ParsedOpenApi;
  onBack: () => void;
  onContinue: (parsed: ParsedOpenApi) => void;
}) {
  const [levels, setLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(parsed.nodes.map((n, i) => [n.id, n.data.level ?? i + 1])),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [overLevel, setOverLevel] = useState<number | null>(null);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const kept = parsed.nodes.filter((n) => !removed.has(n.id));
  const maxLevel = Math.max(1, ...kept.map((n) => levels[n.id]!));

  const apply = () => {
    const remap = normalizeLevels(kept.map((n) => levels[n.id]!));
    onContinue({
      ...parsed,
      nodes: kept.map((n) => ({
        ...n,
        data: { ...n.data, level: remap.get(levels[n.id]!)!, placement: "below" as const },
      })),
    });
  };

  // trailing row (maxLevel + 1) lets a node be dragged onto a fresh deeper level
  const rows = Array.from({ length: maxLevel + 1 }, (_, i) => i + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
      <div
        className="min-h-0 flex-1 space-y-1.5 overflow-y-auto rounded-2xl border border-line p-3"
        style={dots}
      >
        {rows.map((lv) => {
          const inRow = kept.filter((n) => levels[n.id] === lv);
          const isNew = lv > maxLevel;
          const over = overLevel === lv;
          return (
            <div
              key={lv}
              onDragOver={(e) => {
                e.preventDefault();
                setOverLevel(lv);
              }}
              onDragLeave={() => setOverLevel((o) => (o === lv ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) setLevels((l) => ({ ...l, [dragId]: lv }));
                setDragId(null);
                setOverLevel(null);
              }}
              className={`rounded-xl border border-dashed p-2 transition-colors ${
                over ? "border-accent/70 bg-accent/5" : "border-transparent"
              }`}
            >
              <p className="px-1 pb-1 font-mono text-[10px] font-bold tracking-[0.14em] text-foreground uppercase">
                Level {lv}
                {isNew && (
                  <span className="font-semibold text-faint"> · drop to add</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {inRow.length === 0 && (
                  <span className="rounded-lg border border-dashed border-white/15 px-3 py-2 font-mono text-[11px] text-faint">
                    drop a request here
                  </span>
                )}
                {inRow.map((n) => {
                  const hue = METHOD_COLORS[n.data.method].color;
                  return (
                    <div
                      key={n.id}
                      draggable
                      onDragStart={(e) => {
                        setDragId(n.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", n.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverLevel(null);
                      }}
                      className={`flex cursor-grab items-center gap-2 rounded-lg border border-white/10 bg-surface/90 py-1.5 pr-2.5 pl-2 shadow-node transition-opacity active:cursor-grabbing ${
                        dragId === n.id ? "opacity-40" : ""
                      }`}
                    >
                      <svg
                        className="h-3.5 w-3.5 flex-none text-faint"
                        viewBox="0 0 16 16"
                        aria-hidden
                      >
                        <circle cx="6" cy="4" r="1" fill="currentColor" />
                        <circle cx="10" cy="4" r="1" fill="currentColor" />
                        <circle cx="6" cy="8" r="1" fill="currentColor" />
                        <circle cx="10" cy="8" r="1" fill="currentColor" />
                        <circle cx="6" cy="12" r="1" fill="currentColor" />
                        <circle cx="10" cy="12" r="1" fill="currentColor" />
                      </svg>
                      <span
                        className="rounded px-1 py-px font-mono text-[9px] font-bold"
                        style={{
                          color: hue,
                          background: `color-mix(in srgb, ${hue} 12%, transparent)`,
                        }}
                      >
                        {n.data.method}
                      </span>
                      <span className="max-w-40 truncate text-[12px] text-foreground">
                        {n.data.label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRemoved((r) => new Set(r).add(n.id))
                        }
                        aria-label={`Remove ${n.data.label}`}
                        className="-mr-1 flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded text-faint transition hover:bg-danger/15 hover:text-danger"
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" aria-hidden>
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="m2 2 8 8M10 2l-8 8"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-medium text-muted transition hover:text-foreground"
        >
          Back
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={kept.length === 0}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-default disabled:opacity-40"
        >
          Build workflow
        </button>
      </div>
    </div>
  );
}

export function WorkflowWizard({ onClose }: { onClose: () => void }) {
  const createWorkflow = useStore((s) => s.createWorkflow);
  const createWorkflowFromNodes = useStore((s) => s.createWorkflowFromNodes);
  const upsertBody = useStore((s) => s.upsertBody);
  const upsertEnvironment = useStore((s) => s.upsertEnvironment);
  const environments = useStore((s) => s.environments);
  const activeEnvId = useStore((s) => s.activeEnvId);
  const [step, setStep] = useState<Step>({ name: "choose" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    try {
      const parsed = parseApiFile(JSON.parse(await file.text()));
      setStep({ name: "collecting", fileName: file.name, parsed });
    } catch (e) {
      setStep({
        name: "upload",
        error: e instanceof Error ? e.message : "Could not parse that file",
      });
    }
  }

  /** Library bodies + BASE_URL land in the store before the workflow is created. */
  function finishImport(parsed: ParsedOpenApi) {
    for (const body of parsed.bodies) upsertBody(body);
    const env = environments.find((e) => e.id === activeEnvId);
    const vars = importedEnvVars(env?.vars ?? [], parsed);
    if (vars) {
      // upsertEnvironment activates the new env when none is active yet
      upsertEnvironment(
        env
          ? { ...env, vars }
          : { id: crypto.randomUUID(), name: "Development", vars },
      );
    }
    createWorkflowFromNodes(parsed.name, parsed.nodes);
    onClose();
  }

  function startManually() {
    createWorkflow();
    onClose();
  }

  const processing = step.name === "collecting" || step.name === "placing";
  const headline =
    step.name === "choose"
      ? "Create new workflow"
      : step.name === "upload"
        ? "Import API definition"
        : step.name === "layout"
          ? "Arrange your nodes"
          : "Building your workflow";
  const subline =
    step.name === "choose"
      ? "Pick a starting point — you can add, wire and edit nodes either way."
      : step.name === "upload"
        ? "OpenAPI 3, Swagger 2 and Postman collection JSON are supported."
        : step.name === "layout"
          ? "Move each request up or down to set which level it sits on."
          : step.name === "placing"
            ? "Placing every node in the order you set."
            : "Gathering endpoints, methods and request bodies from your spec.";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onMouseDown={(e) =>
        !processing && e.target === e.currentTarget && onClose()
      }
    >
      <div className="wizard-panel glass-heavy flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl">
        {/* header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-start gap-2.5">
            {step.name === "upload" && (
              <button
                onClick={() => setStep({ name: "choose" })}
                aria-label="Back"
                className="mt-0.5 -ml-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-foreground/10 hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden>
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 8h-11m4.5 4.5L2.5 8 7 3.5"
                  />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight">{headline}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{subline}</p>
            </div>
          </div>
          {!processing && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-foreground/10 hover:text-foreground"
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" aria-hidden>
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="m2 2 8 8M10 2l-8 8"
                />
              </svg>
            </button>
          )}
        </div>

        {step.name === "choose" && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 pb-6 sm:grid-cols-2">
            <ActionCard
              onActivate={() => setStep({ name: "upload" })}
              preview={<ImportPreview />}
              title="Import spec or collection"
              description="Every endpoint becomes a request node — URL, method, headers and body prefilled."
              meta="OpenAPI 3 · Swagger 2 · Postman"
              onDropFile={onFile}
            />
            <ActionCard
              onActivate={startManually}
              preview={<ManualPreview />}
              title="Start manually"
              description="A blank canvas with a Start node. Add requests and wire them together as you go."
              meta="Tip: double-click the canvas to add a node"
            />
          </div>
        )}

        {step.name === "upload" && (
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void onFile(f);
              }}
              className={`flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-8 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                dragging
                  ? "border-accent/80"
                  : "border-white/20 hover:border-white/40"
              }`}
              style={dots}
            >
              <div className="flex h-14 w-11 flex-col justify-between rounded-lg border border-white/15 bg-surface/90 p-1.5 shadow-node">
                <span className="block h-1 w-6 rounded-full" style={{ background: "var(--m-get)" }} />
                <span className="block h-1 w-4 rounded-full" style={{ background: "var(--m-post)" }} />
                <span className="block h-1 w-5 rounded-full" style={{ background: "var(--m-delete)" }} />
                <span className="block h-1 w-3 rounded-full bg-white/15" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold">
                  Drop your spec here
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  or click to browse — we&apos;ll parse it right away
                </p>
              </div>
              <p className="font-mono text-[10px] tracking-wide text-faint uppercase">
                .json only
              </p>
            </button>
            {step.error && (
              <p className="mt-3 text-[13px] text-danger" role="alert">
                {step.error} — check the file and try again.
              </p>
            )}
          </div>
        )}

        {step.name === "collecting" && (
          <Processing
            fileName={step.fileName}
            title={step.parsed.name}
            nodes={step.parsed.nodes}
            stage="collect"
            onDone={() =>
              setStep({ name: "layout", fileName: step.fileName, parsed: step.parsed })
            }
          />
        )}

        {step.name === "layout" && (
          <LayoutDesigner
            parsed={step.parsed}
            onBack={() => setStep({ name: "upload" })}
            onContinue={(parsed) =>
              setStep({ name: "placing", fileName: step.fileName, parsed })
            }
          />
        )}

        {step.name === "placing" && (
          <Processing
            fileName={step.fileName}
            title={step.parsed.name}
            nodes={step.parsed.nodes}
            stage="place"
            onDone={() => finishImport(step.parsed)}
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onFile(f);
        }}
      />
    </div>,
    document.body,
  );
}
