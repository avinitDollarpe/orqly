"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseOpenApi } from "@/lib/openapi";
import { useStore } from "@/lib/store";
import { METHODS, type ApiNode } from "@/lib/types";

type Step =
  | { name: "choose" }
  | { name: "upload"; error?: string }
  | { name: "processing"; fileName: string; title: string; nodes: ApiNode[] };

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
    <div className="flex w-36 items-center gap-1.5 rounded-lg border border-white/10 bg-surface/90 px-2 py-1.5 shadow-node">
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
    <div className="flex h-full items-center justify-center gap-4" style={dots}>
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
      className={`wizard-card group cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        dragging ? "border-accent/70" : "border-line hover:border-white/30"
      }`}
    >
      <div className="h-32 border-b border-line">{preview}</div>
      <div className="flex flex-col gap-1.5 p-4">
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
        <p className="mt-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
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
  onDone,
}: {
  fileName: string;
  title: string;
  nodes: ApiNode[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState(0);

  const methodCounts = METHODS.map(
    (m) => [m, nodes.filter((n) => n.data.method === m).length] as const,
  ).filter(([, c]) => c > 0);
  const bodies = nodes.filter((n) => n.data.bodyMode === "inline").length;

  const lines = [
    `Reading ${fileName}`,
    `${nodes.length} endpoint${nodes.length === 1 ? "" : "s"} found in "${title}"`,
    methodCounts.map(([m, c]) => `${m} ${c}`).join(" · "),
    `${bodies} example ${bodies === 1 ? "body" : "bodies"} prefilled`,
    `Laying out ${nodes.length + 1} nodes on the canvas`,
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

export function WorkflowWizard({ onClose }: { onClose: () => void }) {
  const createWorkflow = useStore((s) => s.createWorkflow);
  const createWorkflowFromNodes = useStore((s) => s.createWorkflowFromNodes);
  const [step, setStep] = useState<Step>({ name: "choose" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    try {
      const { name, nodes } = parseOpenApi(JSON.parse(await file.text()));
      setStep({ name: "processing", fileName: file.name, title: name, nodes });
    } catch (e) {
      setStep({
        name: "upload",
        error: e instanceof Error ? e.message : "Could not parse that file",
      });
    }
  }

  function startManually() {
    createWorkflow();
    onClose();
  }

  const processing = step.name === "processing";
  const headline =
    step.name === "choose"
      ? "Create new workflow"
      : step.name === "upload"
        ? "Import OpenAPI spec"
        : "Building your workflow";
  const subline =
    step.name === "choose"
      ? "Pick a starting point — you can add, wire and edit nodes either way."
      : step.name === "upload"
        ? "OpenAPI 3 and Swagger 2 JSON documents are supported."
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
              title="Import OpenAPI.json"
              description="Every endpoint in your spec becomes a request node — URL, method and example body prefilled."
              meta="OpenAPI 3 · Swagger 2"
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

        {step.name === "processing" && (
          <Processing
            fileName={step.fileName}
            title={step.title}
            nodes={step.nodes}
            onDone={() => {
              createWorkflowFromNodes(step.title, step.nodes, []);
              onClose();
            }}
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
