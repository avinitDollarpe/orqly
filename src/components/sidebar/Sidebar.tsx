"use client";

import { useState } from "react";
import { JsonTextarea } from "@/components/shared/JsonTextarea";
import { KVTable } from "@/components/shared/KVTable";
import { inputCls, Modal } from "@/components/shared/ui";
import { useStore } from "@/lib/store";

type EditorTarget =
  | { kind: "body"; id: string }
  | { kind: "headerSet"; id: string }
  | { kind: "environment"; id: string };

function Section({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-line">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase"
        >
          <span
            className={`text-[9px] transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          {title}
        </button>
        <button
          onClick={onAdd}
          className="rounded-md px-1.5 text-sm leading-5 text-accent transition hover:bg-accent-soft"
          title={`New ${title.toLowerCase().replace(/s$/, "")}`}
        >
          +
        </button>
      </div>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

function Row({
  name,
  active,
  onClick,
  onDelete,
}: {
  name: string;
  active?: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group mx-2 flex items-center rounded-lg px-2 py-1 text-sm transition ${
        active
          ? "bg-accent-soft font-medium text-accent"
          : "text-foreground hover:bg-surface-2"
      }`}
    >
      <button onClick={onClick} className="min-w-0 flex-1 truncate text-left">
        {name}
      </button>
      <button
        onClick={onDelete}
        className="hidden rounded px-1 text-xs text-faint group-hover:block hover:text-danger"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}

const empty = (msg: string) => (
  <p className="px-4 py-1 text-xs text-faint">{msg}</p>
);

export function Sidebar() {
  const s = useStore();
  const [editing, setEditing] = useState<EditorTarget | null>(null);
  const uid = () => crypto.randomUUID();

  const editingBody =
    editing?.kind === "body"
      ? s.savedBodies.find((b) => b.id === editing.id)
      : undefined;
  const editingSet =
    editing?.kind === "headerSet"
      ? s.headerSets.find((h) => h.id === editing.id)
      : undefined;
  const editingEnv =
    editing?.kind === "environment"
      ? s.environments.find((e) => e.id === editing.id)
      : undefined;

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-strong font-mono text-xs font-bold text-white">
          ⌘
        </span>
        <span className="text-sm font-semibold tracking-tight">Orqly</span>
      </div>

      <Section title="Workflows" onAdd={s.createWorkflow}>
        {s.workflows.length === 0 && empty("No workflows yet")}
        {s.workflows.map((wf) => (
          <Row
            key={wf.id}
            name={wf.name}
            active={wf.id === s.activeWorkflowId}
            onClick={() => s.setActiveWorkflow(wf.id)}
            onDelete={() =>
              confirm(`Delete workflow "${wf.name}"?`) && s.deleteWorkflow(wf.id)
            }
          />
        ))}
      </Section>

      <Section
        title="Request bodies"
        onAdd={() => {
          const id = uid();
          s.upsertBody({ id, name: "New body", json: "{\n  \n}" });
          setEditing({ kind: "body", id });
        }}
      >
        {s.savedBodies.length === 0 && empty("Reusable JSON bodies")}
        {s.savedBodies.map((b) => (
          <Row
            key={b.id}
            name={b.name}
            onClick={() => setEditing({ kind: "body", id: b.id })}
            onDelete={() => s.deleteBody(b.id)}
          />
        ))}
      </Section>

      <Section
        title="Header sets"
        onAdd={() => {
          const id = uid();
          s.upsertHeaderSet({
            id,
            name: "New header set",
            headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
          });
          setEditing({ kind: "headerSet", id });
        }}
      >
        {s.headerSets.length === 0 && empty("Reusable header groups")}
        {s.headerSets.map((h) => (
          <Row
            key={h.id}
            name={h.name}
            onClick={() => setEditing({ kind: "headerSet", id: h.id })}
            onDelete={() => s.deleteHeaderSet(h.id)}
          />
        ))}
      </Section>

      <Section
        title="Environments"
        onAdd={() => {
          const id = uid();
          s.upsertEnvironment({ id, name: "New environment", vars: [] });
          setEditing({ kind: "environment", id });
        }}
      >
        {s.environments.length === 0 && empty("Variables like {{env.API_KEY}}")}
        {s.environments.map((e) => (
          <Row
            key={e.id}
            name={e.name}
            active={e.id === s.activeEnvId}
            onClick={() => setEditing({ kind: "environment", id: e.id })}
            onDelete={() => s.deleteEnvironment(e.id)}
          />
        ))}
      </Section>

      {editingBody && (
        <Modal title="Edit request body" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <input
              className={inputCls}
              value={editingBody.name}
              onChange={(e) =>
                s.upsertBody({ ...editingBody, name: e.target.value })
              }
              aria-label="Body name"
            />
            <JsonTextarea
              value={editingBody.json}
              onChange={(json) => s.upsertBody({ ...editingBody, json })}
              rows={12}
              placeholder='{ "customerId": "c_123" }'
            />
            <p className="text-xs text-faint">
              Templates like{" "}
              <code className="font-mono">
                {"{{nodes.Create Customer.response.body.id}}"}
              </code>{" "}
              are resolved at run time.
            </p>
          </div>
        </Modal>
      )}
      {editingSet && (
        <Modal title="Edit header set" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <input
              className={inputCls}
              value={editingSet.name}
              onChange={(e) =>
                s.upsertHeaderSet({ ...editingSet, name: e.target.value })
              }
              aria-label="Header set name"
            />
            <KVTable
              rows={editingSet.headers}
              onChange={(headers) =>
                s.upsertHeaderSet({ ...editingSet, headers })
              }
              keyPlaceholder="Header"
            />
          </div>
        </Modal>
      )}
      {editingEnv && (
        <Modal title="Edit environment" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <input
              className={inputCls}
              value={editingEnv.name}
              onChange={(e) =>
                s.upsertEnvironment({ ...editingEnv, name: e.target.value })
              }
              aria-label="Environment name"
            />
            <KVTable
              rows={editingEnv.vars}
              onChange={(vars) => s.upsertEnvironment({ ...editingEnv, vars })}
              keyPlaceholder="Variable"
            />
            <p className="text-xs text-faint">
              Reference anywhere with{" "}
              <code className="font-mono">{"{{env.VARIABLE}}"}</code>
            </p>
          </div>
        </Modal>
      )}
    </aside>
  );
}
