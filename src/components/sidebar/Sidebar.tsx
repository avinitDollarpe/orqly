"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { JsonTextarea } from "@/components/shared/JsonTextarea";
import { KVTable } from "@/components/shared/KVTable";
import { btnGhost, inputCls, Modal } from "@/components/shared/ui";
import { DEFAULT_PRE_REQUEST_SCRIPT } from "@/lib/pre-request";
import { useStore } from "@/lib/store";

type EditorTarget =
  | { kind: "body"; id: string }
  | { kind: "headerSet"; id: string }
  | { kind: "environment"; id: string }
  | { kind: "preRequest" };

type DeleteTarget = {
  kind: "body" | "headerSet" | "environment";
  id: string;
  name: string;
};

const DELETE_COPY: Record<DeleteTarget["kind"], { title: string; note: string }> = {
  body: {
    title: "Delete request body?",
    note: "Nodes using it will show a missing-body warning until you pick another.",
  },
  headerSet: {
    title: "Delete header set?",
    note: "Workflows using it fall back to no shared headers.",
  },
  environment: {
    title: "Delete environment?",
    note: "Its variables stop resolving in {{env.…}} templates.",
  },
};

function Section({
  title,
  count,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pt-3">
      <div className="group/head flex items-center justify-between pr-2 pl-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1.5 rounded-md py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-foreground uppercase transition hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg
            className={`h-2 w-2 transition-transform ${open ? "rotate-90" : ""}`}
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
          {title}
          {count > 0 && <span className="text-foreground/70">{count}</span>}
        </button>
        <button
          onClick={onAdd}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-faint opacity-0 transition group-hover/head:opacity-100 hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          title={addLabel}
          aria-label={addLabel}
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              d="M5 1.5v7M1.5 5h7"
            />
          </svg>
        </button>
      </div>
      {open && <div className="pt-0.5 pb-1">{children}</div>}
    </div>
  );
}

function Row({
  name,
  meta,
  active,
  onClick,
  onDelete,
}: {
  name: string;
  meta?: string;
  active?: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group mx-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition ${
        active
          ? "bg-foreground/10 font-medium text-foreground"
          : "text-muted hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <span className="flex h-1.5 w-1.5 flex-none items-center justify-center" aria-hidden>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </span>
      <button
        onClick={onClick}
        className="min-w-0 flex-1 cursor-pointer truncate text-left"
      >
        {name}
      </button>
      <span className="relative flex h-9 w-9 flex-none items-center justify-center">
        {meta && (
          <span className="font-mono text-[10px] text-faint group-hover:opacity-0">
            {meta}
          </span>
        )}
        <button
          onClick={onDelete}
          // opacity (not display) so the button stays keyboard-focusable;
          // pointer-events gate stops invisible clicks over the meta count
          className="pointer-events-none absolute inset-0 flex cursor-pointer items-center justify-center rounded text-faint opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 hover:text-danger focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:text-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          title="Delete"
          aria-label={`Delete ${name}`}
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              d="m1.5 1.5 7 7m0-7-7 7"
            />
          </svg>
        </button>
      </span>
    </div>
  );
}

const empty = (msg: string) => (
  <p className="px-4.5 py-1 text-xs text-faint/80">{msg}</p>
);

export function Sidebar() {
  // scoped selector — a whole-store subscribe re-rendered the sidebar on every
  // run tick and keystroke anywhere in the app
  const s = useStore(
    useShallow((st) => ({
      workflows: st.workflows,
      savedBodies: st.savedBodies,
      headerSets: st.headerSets,
      environments: st.environments,
      activeWorkflowId: st.activeWorkflowId,
      activeEnvId: st.activeEnvId,
      sidebarOpen: st.sidebarOpen,
      setWizardOpen: st.setWizardOpen,
      setActiveWorkflow: st.setActiveWorkflow,
      setDeleteWorkflowConfirm: st.setDeleteWorkflowConfirm,
      upsertBody: st.upsertBody,
      deleteBody: st.deleteBody,
      upsertHeaderSet: st.upsertHeaderSet,
      deleteHeaderSet: st.deleteHeaderSet,
      upsertEnvironment: st.upsertEnvironment,
      deleteEnvironment: st.deleteEnvironment,
      setWorkflowPreRequestScript: st.setWorkflowPreRequestScript,
      setWorkflowPreRequestEnabled: st.setWorkflowPreRequestEnabled,
    })),
  );
  const [editing, setEditing] = useState<EditorTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const uid = () => crypto.randomUUID();

  function confirmDelete() {
    if (!deleting) return;
    if (deleting.kind === "body") s.deleteBody(deleting.id);
    else if (deleting.kind === "headerSet") s.deleteHeaderSet(deleting.id);
    else s.deleteEnvironment(deleting.id);
    setDeleting(null);
  }

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

  const requestCount = (id: string) =>
    String(
      s.workflows
        .find((w) => w.id === id)
        ?.nodes.filter((n) => n.type === "api").length ?? 0,
    );

  const activeWorkflow = s.workflows.find((w) => w.id === s.activeWorkflowId);

  return (
    <>
      {/* Floats below the nav line — the logo and panel toggle live in the TopBar */}
      <aside
        className={`glass absolute top-(--inspector-top) bottom-(--inspector-gap) left-3 z-20 flex w-60 flex-col overflow-hidden rounded-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          s.sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* workflows: the primary object, roomier than the library below */}
        <Section
          title="Workflows"
          count={s.workflows.length}
          onAdd={() => s.setWizardOpen(true)}
          addLabel="New workflow"
        >
          {s.workflows.length === 0 && empty("No workflows yet")}
          {s.workflows.map((wf) => (
            <Row
              key={wf.id}
              name={wf.name}
              meta={requestCount(wf.id)}
              active={wf.id === s.activeWorkflowId}
              onClick={() => s.setActiveWorkflow(wf.id)}
              onDelete={() =>
                s.setDeleteWorkflowConfirm({
                  id: wf.id,
                  name: wf.name,
                  requests: Number(requestCount(wf.id)),
                })
              }
            />
          ))}
        </Section>

        {activeWorkflow && (
          <div className="mt-2 border-t border-line px-2 pt-2">
            <div className="flex items-center justify-between rounded-lg pr-2.5 transition hover:bg-foreground/5">
              <button
                type="button"
                onClick={() => setEditing({ kind: "preRequest" })}
                className="min-w-0 flex-1 cursor-pointer rounded-md px-2.5 py-2 text-left font-mono text-[10px] font-bold tracking-[0.14em] text-foreground uppercase transition hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Pre-request script
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={activeWorkflow.preRequestEnabled !== false}
                aria-label="Run pre-request script"
                onClick={() =>
                  s.setWorkflowPreRequestEnabled(
                    activeWorkflow.id,
                    activeWorkflow.preRequestEnabled === false,
                  )
                }
                className={`flex h-4 w-8 flex-none cursor-pointer items-center rounded-full px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  activeWorkflow.preRequestEnabled !== false
                    ? "justify-end bg-accent"
                    : "justify-start bg-foreground/25"
                }`}
              >
                <span className="block h-3 w-3 rounded-full bg-foreground/90" />
              </button>
            </div>
            <p className="px-2.5 pt-1 text-[11px] leading-snug text-faint">
              Runs before each API in this workflow. Use env vars like{" "}
              <code className="font-mono">API_KEY</code>.
            </p>
          </div>
        )}

        {/* library: reusable pieces referenced by nodes */}
        <div className="mt-4 border-t border-line pb-2">
          <Section
            title="Request Bodies"
            count={s.savedBodies.length}
            addLabel="New request body"
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
                onDelete={() => setDeleting({ kind: "body", id: b.id, name: b.name })}
              />
            ))}
          </Section>

          <Section
            title="Headers"
            count={s.headerSets.length}
            addLabel="New header set"
            onAdd={() => {
              const id = uid();
              s.upsertHeaderSet({
                id,
                name: "New header set",
                headers: [
                  { key: "Content-Type", value: "application/json", enabled: true },
                ],
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
                onDelete={() => setDeleting({ kind: "headerSet", id: h.id, name: h.name })}
              />
            ))}
          </Section>

          <Section
            title="Environments"
            count={s.environments.length}
            addLabel="New environment"
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
                onDelete={() => setDeleting({ kind: "environment", id: e.id, name: e.name })}
              />
            ))}
          </Section>
        </div>
        </div>

        {editing?.kind === "preRequest" && activeWorkflow && (
          <Modal
            title="Workflow pre-request script"
            onClose={() => setEditing(null)}
          >
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-faint">
                Postman-style script applied to every API request in{" "}
                <span className="font-medium text-muted">{activeWorkflow.name}</span>
                . Read secrets with{" "}
                <code className="font-mono">pm.environment.get(&quot;API_KEY&quot;)</code>{" "}
                and add headers with{" "}
                <code className="font-mono">pm.request.headers.add(&#123; key, value &#125;)</code>.
              </p>
              <textarea
                className="inspector-field min-h-[300px] resize-y font-mono text-xs leading-relaxed"
                value={activeWorkflow.preRequestScript ?? ""}
                onChange={(e) =>
                  s.setWorkflowPreRequestScript(activeWorkflow.id, e.target.value)
                }
                spellCheck={false}
                placeholder="// Runs before each request in this workflow"
                aria-label="Pre-request script"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() =>
                    s.setWorkflowPreRequestScript(
                      activeWorkflow.id,
                      DEFAULT_PRE_REQUEST_SCRIPT,
                    )
                  }
                >
                  Use signing template
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() =>
                    s.setWorkflowPreRequestScript(activeWorkflow.id, "")
                  }
                >
                  Clear
                </button>
              </div>
            </div>
          </Modal>
        )}
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
        <ConfirmDialog
          open={deleting != null}
          title={deleting ? DELETE_COPY[deleting.kind].title : ""}
          description={
            deleting ? (
              <>
                <span className="font-semibold text-foreground">{deleting.name}</span>{" "}
                will be removed. {DELETE_COPY[deleting.kind].note}
              </>
            ) : null
          }
          cancelLabel="Keep it"
          confirmLabel="Delete"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
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
    </>
  );
}
