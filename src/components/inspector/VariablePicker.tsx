"use client";

import { useMemo, useState } from "react";
import { flattenPaths } from "@/lib/interpolate";
import { useActiveWorkflow, useStore } from "@/lib/store";

type Item = { template: string; preview: string; group: string };

/** Node ids that can feed data into `nodeId` (its ancestors). */
function ancestorIds(
  edges: { source: string; target: string }[],
  nodeId: string,
): Set<string> {
  const result = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const cur = queue.pop()!;
    for (const e of edges) {
      if (e.target === cur && !result.has(e.source)) {
        result.add(e.source);
        queue.push(e.source);
      }
    }
  }
  return result;
}

export function VariablePicker({
  nodeId,
  onInsert,
}: {
  nodeId: string;
  onInsert: (template: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const workflow = useActiveWorkflow();
  const environments = useStore((s) => s.environments);
  const activeEnvId = useStore((s) => s.activeEnvId);
  const runs = useStore((s) => s.runs);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    const env = environments.find((e) => e.id === activeEnvId);
    for (const v of env?.vars ?? []) {
      if (v.enabled && v.key) {
        out.push({
          template: `{{env.${v.key}}}`,
          preview: v.value,
          group: `Environment · ${env!.name}`,
        });
      }
    }
    if (workflow) {
      const upstream = ancestorIds(workflow.edges, nodeId);
      for (const node of workflow.nodes) {
        if (!upstream.has(node.id)) continue;
        const response = runs[node.id]?.response;
        if (!response) continue;
        const label = node.data.label;
        out.push({
          template: `{{nodes.${label}.response.status}}`,
          preview: String(response.status),
          group: label,
        });
        for (const { path, preview } of flattenPaths(response.body)) {
          out.push({
            template: `{{nodes.${label}.response.body.${path}}}`,
            preview,
            group: label,
          });
        }
      }
    }
    return out;
  }, [environments, activeEnvId, workflow, nodeId, runs]);

  const filtered = items.filter((i) =>
    i.template.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = [...new Set(filtered.map((i) => i.group))];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-line bg-surface px-1.5 py-1 font-mono text-[10px] text-muted transition hover:border-accent hover:text-accent"
        title="Insert a variable"
      >
        {"{{}}"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1.5 w-80 rounded-xl border border-line bg-surface shadow-node">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search variables…"
              className="w-full rounded-t-xl border-b border-line bg-transparent px-3 py-2 text-xs outline-none placeholder:text-faint"
            />
            <div className="max-h-64 overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-xs text-faint">
                  Nothing to insert yet — add environment variables, or run
                  upstream nodes to expose their response fields.
                </p>
              )}
              {groups.map((group) => (
                <div key={group}>
                  <p className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-faint uppercase">
                    {group}
                  </p>
                  {filtered
                    .filter((i) => i.group === group)
                    .map((item) => (
                      <button
                        key={item.template}
                        onClick={() => {
                          onInsert(item.template);
                          setOpen(false);
                        }}
                        className="flex w-full items-baseline gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-accent-soft"
                      >
                        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground">
                          {item.template}
                        </code>
                        <span className="max-w-24 truncate font-mono text-[10px] text-faint">
                          {item.preview}
                        </span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
