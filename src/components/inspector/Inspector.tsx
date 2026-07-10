"use client";

import { useRef, useState } from "react";
import { VariablePicker } from "@/components/inspector/VariablePicker";
import { JsonTextarea } from "@/components/shared/JsonTextarea";
import { KVTable } from "@/components/shared/KVTable";
import { MethodChip } from "@/components/shared/ui";
import { flattenPaths } from "@/lib/interpolate";
import { METHOD_COLORS } from "@/lib/method-colors";
import { nodeLevel } from "@/lib/layout";
import { runSingleNode } from "@/lib/runner";
import { useActiveWorkflow, useStore } from "@/lib/store";
import { METHODS, type Method, type NodePlacement } from "@/lib/types";

const accent = "var(--accent)";

const labelCls =
  "mb-1.5 block font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase";
const fieldCls = "inspector-field";
const hintCls = "mt-1.5 text-[11px] leading-snug text-faint";

function insertAt(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  text: string,
): string {
  if (!el) return current + text;
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? start;
  return current.slice(0, start) + text + current.slice(end);
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full cursor-pointer items-center gap-2 text-left"
      >
        <svg
          className={`h-2.5 w-2.5 text-faint transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 8 8"
          aria-hidden
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.5 1.5 3 2.5-3 2.5"
          />
        </svg>
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          {title}
        </span>
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-foreground/[0.05] p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide uppercase transition ${
            value === opt.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Notice({ tone, children }: { tone: "warning" | "danger"; children: React.ReactNode }) {
  const bg = tone === "warning" ? "bg-warning/10 text-warning" : "bg-danger/10 text-(--danger)";
  return (
    <p className={`rounded-xl px-3 py-2 text-[11px] leading-snug ${bg}`}>{children}</p>
  );
}

export function Inspector() {
  const workflow = useActiveWorkflow();
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const updateNodeData = useStore((s) => s.updateNodeData);
  const selectNode = useStore((s) => s.selectNode);
  const savedBodies = useStore((s) => s.savedBodies);
  const isRunning = useStore((s) => s.isRunning);
  const run = useStore((s) => (selectedNodeId ? s.runs[selectedNodeId] : undefined));

  const [tab, setTab] = useState<"request" | "response">("request");
  const [copied, setCopied] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const node = workflow?.nodes.find((n) => n.id === selectedNodeId);
  if (!workflow || !node || node.type !== "api") return null;
  const { data } = node;
  const step = nodeLevel(workflow, node.id);

  const danglingBody =
    data.bodyMode === "saved" &&
    data.savedBodyId &&
    !savedBodies.some((b) => b.id === data.savedBodyId);

  const patch = (p: Parameters<typeof updateNodeData>[1]) =>
    updateNodeData(node.id, p);

  function copyTemplate(template: string) {
    void navigator.clipboard.writeText(template);
    setCopied(template);
    setTimeout(() => setCopied((c) => (c === template ? null : c)), 1200);
  }

  const responsePaths = run?.response ? flattenPaths(run.response.body) : [];

  return (
    <aside className="inspector-panel inspector-float z-40 flex w-[400px] flex-col overflow-hidden rounded-[20px]">
      {/* header — mirrors node card */}
      <div className="shrink-0 p-3">
        <div className="flex items-start gap-2">
          <div
            className="min-w-0 flex-1 rounded-full py-1 pr-1 pl-2"
            style={{
              background: `linear-gradient(to right, color-mix(in srgb, ${accent} 8.2%, transparent), transparent)`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <MethodChip method={data.method} className="shrink-0" />
              <span
                className="min-w-0 flex-1 truncate text-[15px] font-semibold"
                style={{ color: accent }}
              >
                {data.label}
              </span>
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-medium"
                style={{ color: accent, borderColor: accent }}
              >
                {step}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => selectNode(null)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-foreground/8 hover:text-foreground"
            aria-label="Close inspector"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M4 4l8 8M12 4l-8 8"
              />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 rounded-full bg-foreground/[0.05] p-1">
            {(["request", "response"] as const).map((t) => (
              <button
                key={t}
                type="button"
                data-testid={`tab-${t}`}
                onClick={() => setTab(t)}
                className={`flex flex-1 items-baseline justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                  tab === t
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t}
                {t === "response" && run?.response && (
                  <span
                    className={`font-mono text-[10px] ${
                      run.response.status < 400 ? "text-(--success)" : "text-(--danger)"
                    }`}
                  >
                    {run.response.status}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => runSingleNode(workflow, node.id)}
            disabled={isRunning}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/12 bg-foreground/[0.04] px-3 text-xs font-medium text-muted transition hover:border-accent/30 hover:text-accent disabled:opacity-50"
            title="Run only this node"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" aria-hidden>
              <path fill="currentColor" d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z" />
            </svg>
            Run
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {tab === "request" ? (
          <div className="space-y-6">
            <Section title="Identity">
              <label className="block">
                <span className={labelCls}>Name</span>
                <input
                  className={fieldCls}
                  defaultValue={data.label}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== data.label) patch({ label: v });
                  }}
                />
                <span className={hintCls}>
                  Referenced downstream as{" "}
                  <code className="font-mono text-muted">{`{{nodes.${data.label}…}}`}</code>
                </span>
              </label>
            </Section>

            <Section title="Layout" defaultOpen={false}>
              <div className="flex gap-3">
                <label className="block w-20">
                  <span className={labelCls}>Level</span>
                  <input
                    type="number"
                    min={1}
                    className={`${fieldCls} font-mono`}
                    value={step}
                    onChange={(e) => {
                      const v = Math.max(1, Math.round(Number(e.target.value)));
                      if (Number.isFinite(v)) patch({ level: v });
                    }}
                  />
                </label>
                <label className="block min-w-0 flex-1">
                  <span className={labelCls}>Placement</span>
                  <select
                    className={`${fieldCls} cursor-pointer`}
                    value={data.placement ?? "below"}
                    onChange={(e) =>
                      patch({ placement: e.target.value as NodePlacement })
                    }
                  >
                    <option value="below">Below parent</option>
                    <option value="same">Same row</option>
                  </select>
                </label>
              </div>
              <p className={hintCls}>Same level shares a row. Placement sets the parent edge.</p>
            </Section>

            <Section title="Endpoint">
              <span className={labelCls}>URL</span>
              <div className="flex gap-2">
                <select
                  value={data.method}
                  onChange={(e) => patch({ method: e.target.value as Method })}
                  className={`${fieldCls} shrink-0 cursor-pointer font-mono text-xs font-bold`}
                  /* .inspector-field's width:100% outranks Tailwind's layered w-* utility */
                  style={{ color: METHOD_COLORS[data.method].color, width: "5.5rem" }}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  ref={urlRef}
                  className={`${fieldCls} min-w-0 flex-1 font-mono text-xs`}
                  placeholder="{{env.BASE_URL}}/v1/customers"
                  value={data.url}
                  onChange={(e) => patch({ url: e.target.value })}
                />
              </div>
            </Section>

            <Section title="Headers">
              <KVTable
                rows={data.headers}
                onChange={(headers) => patch({ headers })}
                keyPlaceholder="Header"
              />
              <p className={`${hintCls} mt-2`}>
                Inline rows override the workflow header set (picked in the top bar).
              </p>
            </Section>

            <Section title="Body">
              <Segmented
                value={data.bodyMode}
                options={[
                  { id: "none", label: "None" },
                  { id: "saved", label: "Saved" },
                  { id: "inline", label: "Inline" },
                ]}
                onChange={(bodyMode) => patch({ bodyMode })}
              />
              {data.bodyMode === "saved" && (
                <div className="mt-3 space-y-2">
                  <select
                    value={danglingBody ? "" : (data.savedBodyId ?? "")}
                    onChange={(e) =>
                      patch({ savedBodyId: e.target.value || undefined })
                    }
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="">Choose a saved body…</option>
                    {savedBodies.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {danglingBody && (
                    <Notice tone="warning">
                      The saved body this node referenced was deleted.
                    </Notice>
                  )}
                </div>
              )}
              {data.bodyMode === "inline" && (
                <div className="mt-3">
                  <div className="mb-2 flex justify-end">
                    <VariablePicker
                      nodeId={node.id}
                      onInsert={(t) =>
                        patch({
                          inlineBody: insertAt(bodyRef.current, data.inlineBody, t),
                        })
                      }
                    />
                  </div>
                  <JsonTextarea
                    value={data.inlineBody}
                    onChange={(inlineBody) => patch({ inlineBody })}
                    textareaRef={bodyRef}
                    placeholder={'{\n  "id": "{{nodes.Create Customer.response.body.id}}"\n}'}
                  />
                </div>
              )}
            </Section>
          </div>
        ) : (
          <div className="space-y-5">
            {!run && (
              <p className="text-sm leading-relaxed text-muted">
                Run the flow or this node to inspect the response.
              </p>
            )}
            {run?.status === "skipped" && (
              <Notice tone="warning">Skipped — an upstream node failed.</Notice>
            )}
            {run?.error && <Notice tone="danger">{run.error}</Notice>}
            {run?.resolved && (
              <div>
                <span className={labelCls}>Sent request</span>
                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-foreground/[0.03] p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted">
                  {`${run.resolved.method} ${run.resolved.url}\n` +
                    Object.entries(run.resolved.headers)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n") +
                    (run.resolved.body ? `\n\n${run.resolved.body}` : "")}
                </pre>
              </div>
            )}
            {run?.response && (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-wide uppercase">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      run.response.status < 400
                        ? "bg-success/15 text-(--success)"
                        : "bg-danger/15 text-(--danger)"
                    }`}
                  >
                    {run.response.status} {run.response.statusText}
                  </span>
                  <span className="text-muted">{run.response.ms}ms</span>
                </div>
                <div>
                  <span className={labelCls}>Body</span>
                  <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-foreground/[0.03] p-3 font-mono text-[11px] leading-relaxed text-foreground">
                    {typeof run.response.body === "string"
                      ? run.response.body
                      : JSON.stringify(run.response.body, null, 2)}
                  </pre>
                </div>
                {responsePaths.length > 0 && (
                  <div>
                    <span className={labelCls}>Fields — click to copy</span>
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      {responsePaths.slice(0, 60).map(({ path, preview }) => {
                        const template = `{{nodes.${data.label}.response.body.${path}}}`;
                        return (
                          <button
                            key={path}
                            type="button"
                            onClick={() => copyTemplate(template)}
                            className="flex w-full cursor-pointer items-baseline gap-2 border-b border-white/8 px-3 py-2 text-left transition last:border-b-0 hover:bg-accent/8"
                            title={template}
                          >
                            <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                              {path}
                            </code>
                            {copied === template ? (
                              <span className="text-[10px] font-medium text-(--success)">
                                Copied
                              </span>
                            ) : (
                              <span className="max-w-28 truncate font-mono text-[10px] text-faint">
                                {preview}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
