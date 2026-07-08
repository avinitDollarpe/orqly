"use client";

import { useRef, useState } from "react";
import { VariablePicker } from "@/components/inspector/VariablePicker";
import { JsonTextarea } from "@/components/shared/JsonTextarea";
import { KVTable } from "@/components/shared/KVTable";
import { inputCls, MethodChip, selectCls } from "@/components/shared/ui";
import { flattenPaths } from "@/lib/interpolate";
import { runSingleNode } from "@/lib/runner";
import { useActiveWorkflow, useStore } from "@/lib/store";
import { METHODS, type Method } from "@/lib/types";

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

export function Inspector() {
  const workflow = useActiveWorkflow();
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const updateNodeData = useStore((s) => s.updateNodeData);
  const selectNode = useStore((s) => s.selectNode);
  const headerSets = useStore((s) => s.headerSets);
  const savedBodies = useStore((s) => s.savedBodies);
  const isRunning = useStore((s) => s.isRunning);
  const run = useStore((s) => (selectedNodeId ? s.runs[selectedNodeId] : undefined));

  const [tab, setTab] = useState<"request" | "response">("request");
  const [copied, setCopied] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const node = workflow?.nodes.find((n) => n.id === selectedNodeId);
  if (!workflow || !node) return null;
  const { data } = node;

  const danglingSet = data.headerSetId && !headerSets.some((h) => h.id === data.headerSetId);
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
    <aside className="flex w-96 shrink-0 flex-col border-l border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <MethodChip method={data.method} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {data.label}
        </span>
        <button
          onClick={() => runSingleNode(workflow, node.id)}
          disabled={isRunning}
          className="rounded-md px-2 py-0.5 text-xs font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
          title="Run only this node, reusing previous responses"
        >
          ▶ Run node
        </button>
        <button
          onClick={() => selectNode(null)}
          className="rounded-md px-1.5 text-muted transition hover:bg-surface-2"
          aria-label="Close inspector"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-1 border-b border-line px-3 pt-2">
        {(["request", "response"] as const).map((t) => (
          <button
            key={t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
              tab === t
                ? "border border-b-0 border-line bg-background text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t}
            {t === "response" && run?.response && (
              <span
                className={`ml-1.5 font-mono text-[10px] ${
                  run.response.status < 400 ? "text-(--success)" : "text-(--danger)"
                }`}
              >
                {run.response.status}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {tab === "request" ? (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Name
              </span>
              <input
                className={inputCls}
                defaultValue={data.label}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== data.label) patch({ label: v });
                }}
              />
              <span className="mt-1 block text-[11px] text-faint">
                Downstream nodes reference this as{" "}
                <code className="font-mono">{`{{nodes.${data.label}…}}`}</code>
              </span>
            </label>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Request</span>
                <VariablePicker
                  nodeId={node.id}
                  onInsert={(t) =>
                    patch({ url: insertAt(urlRef.current, data.url, t) })
                  }
                />
              </div>
              <div className="flex gap-1.5">
                <select
                  value={data.method}
                  onChange={(e) => patch({ method: e.target.value as Method })}
                  className={`${selectCls} font-mono text-xs font-bold`}
                  style={{ color: `var(--m-${data.method.toLowerCase()})` }}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  ref={urlRef}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="{{env.BASE_URL}}/v1/customers"
                  value={data.url}
                  onChange={(e) => patch({ url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs font-medium text-muted">
                Headers
              </span>
              <select
                value={danglingSet ? "" : (data.headerSetId ?? "")}
                onChange={(e) =>
                  patch({ headerSetId: e.target.value || undefined })
                }
                className={`${selectCls} mb-2 w-full`}
              >
                <option value="">No header set</option>
                {headerSets.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {danglingSet && (
                <p className="mb-2 rounded-lg bg-warning-soft px-2 py-1 text-[11px] text-(--warning)">
                  The header set this node referenced was deleted.
                </p>
              )}
              <KVTable
                rows={data.headers}
                onChange={(headers) => patch({ headers })}
                keyPlaceholder="Header"
              />
              <p className="mt-1 text-[11px] text-faint">
                Inline rows override the header set.
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Body</span>
                {data.bodyMode === "inline" && (
                  <VariablePicker
                    nodeId={node.id}
                    onInsert={(t) =>
                      patch({
                        inlineBody: insertAt(bodyRef.current, data.inlineBody, t),
                      })
                    }
                  />
                )}
              </div>
              <div className="mb-2 flex overflow-hidden rounded-lg border border-line text-xs">
                {(["none", "saved", "inline"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => patch({ bodyMode: mode })}
                    className={`flex-1 px-2 py-1.5 font-medium capitalize transition ${
                      data.bodyMode === mode
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-surface-2"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {data.bodyMode === "saved" && (
                <>
                  <select
                    value={danglingBody ? "" : (data.savedBodyId ?? "")}
                    onChange={(e) =>
                      patch({ savedBodyId: e.target.value || undefined })
                    }
                    className={`${selectCls} w-full`}
                  >
                    <option value="">Choose a saved body…</option>
                    {savedBodies.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {danglingBody && (
                    <p className="mt-2 rounded-lg bg-warning-soft px-2 py-1 text-[11px] text-(--warning)">
                      The saved body this node referenced was deleted.
                    </p>
                  )}
                </>
              )}
              {data.bodyMode === "inline" && (
                <JsonTextarea
                  value={data.inlineBody}
                  onChange={(inlineBody) => patch({ inlineBody })}
                  textareaRef={bodyRef}
                  placeholder={'{\n  "id": "{{nodes.Create Customer.response.body.id}}"\n}'}
                />
              )}
            </div>
          </>
        ) : (
          <>
            {!run && (
              <p className="text-sm text-muted">
                This node hasn&apos;t run yet. Run the flow (or just this node)
                to see its response here.
              </p>
            )}
            {run?.status === "skipped" && (
              <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
                Skipped — an upstream node failed.
              </p>
            )}
            {run?.error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 font-mono text-xs break-words text-(--danger)">
                {run.error}
              </p>
            )}
            {run?.resolved && (
              <div>
                <span className="mb-1 block text-xs font-medium text-muted">
                  Sent request
                </span>
                <pre className="overflow-x-auto rounded-lg border border-line bg-background p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted">
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
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-bold ${
                      run.response.status < 400
                        ? "bg-success-soft text-(--success)"
                        : "bg-danger-soft text-(--danger)"
                    }`}
                  >
                    {run.response.status} {run.response.statusText}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {run.response.ms}ms
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Body
                  </span>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-line bg-background p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
                    {typeof run.response.body === "string"
                      ? run.response.body
                      : JSON.stringify(run.response.body, null, 2)}
                  </pre>
                </div>
                {responsePaths.length > 0 && (
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Fields — click to copy a reference
                    </span>
                    <div className="overflow-hidden rounded-lg border border-line">
                      {responsePaths.slice(0, 60).map(({ path, preview }) => {
                        const template = `{{nodes.${data.label}.response.body.${path}}}`;
                        return (
                          <button
                            key={path}
                            onClick={() => copyTemplate(template)}
                            className="flex w-full items-baseline gap-2 border-b border-line px-2.5 py-1.5 text-left transition last:border-b-0 hover:bg-accent-soft"
                            title={template}
                          >
                            <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                              {path}
                            </code>
                            {copied === template ? (
                              <span className="text-[10px] font-medium text-(--success)">
                                Copied ✓
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
          </>
        )}
      </div>
    </aside>
  );
}
