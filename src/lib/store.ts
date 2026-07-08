"use client";

import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import { seedDemo } from "@/lib/seed";
import type {
  ApiNode,
  ApiNodeData,
  Environment,
  HeaderSet,
  NodeRun,
  SavedBody,
  Workflow,
  WorkflowBundle,
} from "@/lib/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

type ResourceKind = "workflows" | "bodies" | "header-sets" | "environments";

type Store = {
  hydrated: boolean;
  workflows: Workflow[];
  savedBodies: SavedBody[];
  headerSets: HeaderSet[];
  environments: Environment[];
  activeWorkflowId: string | null;
  activeEnvId: string | null;
  selectedNodeId: string | null;
  saveState: SaveState;

  // ephemeral run state
  isRunning: boolean;
  runs: Record<string, NodeRun>;
  runningEdgeId: string | null;
  doneEdgeIds: string[];

  hydrate: () => Promise<void>;

  // graph ops on the active workflow
  onNodesChange: (changes: NodeChange<ApiNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  addNode: (position?: XYPosition) => string;
  updateNodeData: (nodeId: string, patch: Partial<ApiNodeData>) => void;

  // workflows
  createWorkflow: () => void;
  renameWorkflow: (id: string, name: string) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string) => void;
  importBundle: (bundle: WorkflowBundle) => void;

  // saved resources
  upsertBody: (b: SavedBody) => void;
  deleteBody: (id: string) => void;
  upsertHeaderSet: (h: HeaderSet) => void;
  deleteHeaderSet: (id: string) => void;
  upsertEnvironment: (e: Environment) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnv: (id: string | null) => void;

  selectNode: (id: string | null) => void;

  // run-state setters (used by the runner)
  setNodeRun: (nodeId: string, run: NodeRun) => void;
  setRunningEdge: (edgeId: string | null) => void;
  addDoneEdge: (edgeId: string) => void;
  resetRuns: () => void;
  setIsRunning: (running: boolean) => void;
};

/* ---------- server sync (debounced per entity) ---------- */

const timers = new Map<string, ReturnType<typeof setTimeout>>();
let pendingSaves = 0;

function trackSave(promise: Promise<Response>) {
  pendingSaves++;
  useStore.setState({ saveState: "saving" });
  promise
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      if (--pendingSaves === 0) useStore.setState({ saveState: "saved" });
    })
    .catch(() => {
      pendingSaves = Math.max(0, pendingSaves - 1);
      useStore.setState({ saveState: "error" });
    });
}

function put(kind: ResourceKind, id: string, payload: unknown) {
  if (!payload) return; // entity vanished before the debounce fired
  trackSave(
    fetch(`/api/data/${kind}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

/** Debounced upsert — one in-flight timer per entity. */
function scheduleSave(kind: ResourceKind, id: string, getPayload: () => unknown) {
  const key = `${kind}:${id}`;
  clearTimeout(timers.get(key));
  useStore.setState({ saveState: "saving" });
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      put(kind, id, getPayload());
    }, 800),
  );
}

function destroy(kind: ResourceKind, id: string) {
  const key = `${kind}:${id}`;
  clearTimeout(timers.get(key));
  timers.delete(key);
  trackSave(fetch(`/api/data/${kind}/${id}`, { method: "DELETE" }));
}

const uid = () => crypto.randomUUID();

// hydrate() is triggered from an effect that React strict mode double-invokes;
// without a synchronous guard the demo seed would be created twice
let hydrating = false;

const uniqueLabel = (base: string, taken: Set<string>) => {
  let label = base;
  for (let i = 2; taken.has(label); i++) label = `${base} ${i}`;
  return label;
};

/* ---------- store ---------- */

export const useStore = create<Store>((set, get) => {
  /** Mutate the active workflow and schedule its save. */
  function patchActive(fn: (wf: Workflow) => Partial<Workflow>) {
    const { workflows, activeWorkflowId } = get();
    const wf = workflows.find((w) => w.id === activeWorkflowId);
    if (!wf) return;
    const next = { ...wf, ...fn(wf) };
    set({ workflows: workflows.map((w) => (w.id === wf.id ? next : w)) });
    scheduleSave("workflows", wf.id, () => {
      const cur = get().workflows.find((w) => w.id === wf.id);
      return cur && { name: cur.name, nodes: cur.nodes, edges: cur.edges };
    });
  }

  return {
    hydrated: false,
    workflows: [],
    savedBodies: [],
    headerSets: [],
    environments: [],
    activeWorkflowId: null,
    activeEnvId: null,
    selectedNodeId: null,
    saveState: "idle",

    isRunning: false,
    runs: {},
    runningEdgeId: null,
    doneEdgeIds: [],

    hydrate: async () => {
      if (hydrating || get().hydrated) return;
      hydrating = true;
      const [workflows, savedBodies, headerSets, environments] =
        (await Promise.all(
          (["workflows", "bodies", "header-sets", "environments"] as const).map(
            (kind) => fetch(`/api/data/${kind}`).then((r) => r.json()),
          ),
        )) as [Workflow[], SavedBody[], HeaderSet[], Environment[]];

      if (workflows.length === 0) {
        const demo = seedDemo();
        workflows.push(demo.workflow);
        savedBodies.push(...demo.savedBodies);
        headerSets.push(...demo.headerSets);
        environments.push(...demo.environments);
        const { workflow } = demo;
        put("workflows", workflow.id, workflow);
        demo.savedBodies.forEach((b) => put("bodies", b.id, b));
        demo.headerSets.forEach((h) => put("header-sets", h.id, h));
        demo.environments.forEach((e) => put("environments", e.id, e));
      }

      set({
        hydrated: true,
        workflows,
        savedBodies,
        headerSets,
        environments,
        activeWorkflowId: workflows[0]?.id ?? null,
        activeEnvId: environments[0]?.id ?? null,
      });
    },

    onNodesChange: (changes) =>
      patchActive((wf) => ({ nodes: applyNodeChanges(changes, wf.nodes) })),

    onEdgesChange: (changes) =>
      patchActive((wf) => ({ edges: applyEdgeChanges(changes, wf.edges) })),

    onConnect: (conn) =>
      patchActive((wf) => ({
        edges: [
          ...wf.edges.filter(
            (e) => !(e.source === conn.source && e.target === conn.target),
          ),
          {
            id: uid(),
            source: conn.source,
            target: conn.target,
            type: "smoothstep",
          } satisfies Edge,
        ],
      })),

    addNode: (position) => {
      const id = uid();
      patchActive((wf) => {
        const taken = new Set(wf.nodes.map((n) => n.data.label));
        const node: ApiNode = {
          id,
          type: "api",
          position: position ?? {
            x: 80 + wf.nodes.length * 60,
            y: 80 + wf.nodes.length * 40,
          },
          data: {
            label: uniqueLabel("Request", taken),
            method: "GET",
            url: "",
            headers: [],
            bodyMode: "none",
            inlineBody: "",
          },
        };
        return { nodes: [...wf.nodes, node] };
      });
      set({ selectedNodeId: id });
      return id;
    },

    updateNodeData: (nodeId, patch) =>
      patchActive((wf) => {
        if (typeof patch.label === "string") {
          const taken = new Set(
            wf.nodes.filter((n) => n.id !== nodeId).map((n) => n.data.label),
          );
          patch = { ...patch, label: uniqueLabel(patch.label, taken) };
        }
        return {
          nodes: wf.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
          ),
        };
      }),

    createWorkflow: () => {
      const wf: Workflow = { id: uid(), name: "New workflow", nodes: [], edges: [] };
      set((s) => ({
        workflows: [...s.workflows, wf],
        activeWorkflowId: wf.id,
        selectedNodeId: null,
        runs: {},
        doneEdgeIds: [],
        runningEdgeId: null,
      }));
      put("workflows", wf.id, wf);
    },

    renameWorkflow: (id, name) => {
      set((s) => ({
        workflows: s.workflows.map((w) => (w.id === id ? { ...w, name } : w)),
      }));
      scheduleSave("workflows", id, () => {
        const cur = get().workflows.find((w) => w.id === id);
        return cur && { name: cur.name, nodes: cur.nodes, edges: cur.edges };
      });
    },

    deleteWorkflow: (id) => {
      set((s) => {
        const workflows = s.workflows.filter((w) => w.id !== id);
        return {
          workflows,
          activeWorkflowId:
            s.activeWorkflowId === id
              ? (workflows[0]?.id ?? null)
              : s.activeWorkflowId,
          selectedNodeId: null,
        };
      });
      destroy("workflows", id);
    },

    setActiveWorkflow: (id) =>
      set({
        activeWorkflowId: id,
        selectedNodeId: null,
        runs: {},
        runningEdgeId: null,
        doneEdgeIds: [],
      }),

    importBundle: (bundle) => {
      const { workflows, savedBodies, headerSets } = get();
      // re-id the workflow to avoid clobbering an existing one
      const wf: Workflow = { ...bundle.workflow, id: uid() };
      const existingNames = new Set(workflows.map((w) => w.name));
      wf.name = uniqueLabel(wf.name, existingNames);

      const newBodies = bundle.savedBodies.filter(
        (b) => !savedBodies.some((x) => x.id === b.id),
      );
      const newSets = bundle.headerSets.filter(
        (h) => !headerSets.some((x) => x.id === h.id),
      );

      set((s) => ({
        workflows: [...s.workflows, wf],
        savedBodies: [...s.savedBodies, ...newBodies],
        headerSets: [...s.headerSets, ...newSets],
        activeWorkflowId: wf.id,
        selectedNodeId: null,
        runs: {},
        doneEdgeIds: [],
        runningEdgeId: null,
      }));
      put("workflows", wf.id, wf);
      newBodies.forEach((b) => put("bodies", b.id, b));
      newSets.forEach((h) => put("header-sets", h.id, h));
    },

    upsertBody: (b) => {
      set((s) => ({
        savedBodies: s.savedBodies.some((x) => x.id === b.id)
          ? s.savedBodies.map((x) => (x.id === b.id ? b : x))
          : [...s.savedBodies, b],
      }));
      scheduleSave("bodies", b.id, () =>
        get().savedBodies.find((x) => x.id === b.id),
      );
    },
    deleteBody: (id) => {
      set((s) => ({ savedBodies: s.savedBodies.filter((x) => x.id !== id) }));
      destroy("bodies", id);
    },

    upsertHeaderSet: (h) => {
      set((s) => ({
        headerSets: s.headerSets.some((x) => x.id === h.id)
          ? s.headerSets.map((x) => (x.id === h.id ? h : x))
          : [...s.headerSets, h],
      }));
      scheduleSave("header-sets", h.id, () =>
        get().headerSets.find((x) => x.id === h.id),
      );
    },
    deleteHeaderSet: (id) => {
      set((s) => ({ headerSets: s.headerSets.filter((x) => x.id !== id) }));
      destroy("header-sets", id);
    },

    upsertEnvironment: (e) => {
      set((s) => ({
        environments: s.environments.some((x) => x.id === e.id)
          ? s.environments.map((x) => (x.id === e.id ? e : x))
          : [...s.environments, e],
        activeEnvId: s.activeEnvId ?? e.id,
      }));
      scheduleSave("environments", e.id, () =>
        get().environments.find((x) => x.id === e.id),
      );
    },
    deleteEnvironment: (id) => {
      set((s) => ({
        environments: s.environments.filter((x) => x.id !== id),
        activeEnvId:
          s.activeEnvId === id
            ? (s.environments.find((x) => x.id !== id)?.id ?? null)
            : s.activeEnvId,
      }));
      destroy("environments", id);
    },
    setActiveEnv: (id) => set({ activeEnvId: id }),

    selectNode: (id) => set({ selectedNodeId: id }),

    setNodeRun: (nodeId, run) =>
      set((s) => ({ runs: { ...s.runs, [nodeId]: run } })),
    setRunningEdge: (edgeId) => set({ runningEdgeId: edgeId }),
    addDoneEdge: (edgeId) =>
      set((s) => ({ doneEdgeIds: [...s.doneEdgeIds, edgeId] })),
    resetRuns: () => set({ runs: {}, runningEdgeId: null, doneEdgeIds: [] }),
    setIsRunning: (running) => set({ isRunning: running }),
  };
});

export const useActiveWorkflow = () =>
  useStore((s) => s.workflows.find((w) => w.id === s.activeWorkflowId));
