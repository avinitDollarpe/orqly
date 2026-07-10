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
import { autoLayout, levelFromPlacement, levelOfNode, nodeLevel, resolveEdgeSource } from "@/lib/layout";
import { seedDemo } from "@/lib/seed";
import type {
  ApiNode,
  ApiNodeData,
  Environment,
  HeaderSet,
  NodePlacement,
  NodeRun,
  SavedBody,
  StartNode,
  Workflow,
  WorkflowNode,
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
  /** Single header set applied to every node in the active workflow. */
  activeHeaderSetId: string | null;
  selectedNodeId: string | null;
  saveState: SaveState;
  /** Epoch ms of the last successful save — drives "Updated …" in the nav. */
  lastSavedAt: number | null;
  /** "Create new workflow" chooser; opens on load and from the sidebar. */
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
  /** Workflow delete confirmation — rendered at app root for viewport centering. */
  deleteWorkflowConfirm: { id: string; name: string; requests: number } | null;
  setDeleteWorkflowConfirm: (
    target: { id: string; name: string; requests: number } | null,
  ) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // ephemeral run state
  isRunning: boolean;
  runs: Record<string, NodeRun>;
  runningEdgeId: string | null;
  doneEdgeIds: string[];

  hydrate: () => Promise<void>;

  // graph ops on the active workflow
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  addNode: (opts?: {
    anchorNodeId?: string;
    placement?: NodePlacement;
    /** Prefill (imports): method, url, headers, body, label. */
    data?: Partial<ApiNodeData>;
  }) => string;
  updateNodeData: (nodeId: string, patch: Partial<ApiNodeData>) => void;

  // workflows
  createWorkflow: () => void;
  /** Create a workflow pre-populated with imported API nodes (OpenAPI). */
  createWorkflowFromNodes: (name: string, nodes: ApiNode[]) => void;
  renameWorkflow: (id: string, name: string) => void;
  setWorkflowPreRequestScript: (id: string, script: string) => void;
  setWorkflowPreRequestEnabled: (id: string, enabled: boolean) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string) => void;

  // saved resources
  upsertBody: (b: SavedBody) => void;
  deleteBody: (id: string) => void;
  upsertHeaderSet: (h: HeaderSet) => void;
  deleteHeaderSet: (id: string) => void;
  upsertEnvironment: (e: Environment) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnv: (id: string | null) => void;
  setActiveHeaderSet: (id: string | null) => void;

  selectNode: (id: string | null) => void;

  /** Re-PUT every entity — recovery action behind the "save failed" chip. */
  retrySaves: () => void;

  /** Canvas graph undo/redo for the active workflow. */
  historyTick: number;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  onNodeDragStart: () => void;

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
      if (--pendingSaves === 0) {
        useStore.setState({ saveState: "saved", lastSavedAt: Date.now() });
      }
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

export const makeStartNode = (position?: XYPosition): StartNode => ({
  id: uid(),
  type: "start",
  position: position ?? { x: 80, y: 40 },
  deletable: false,
  data: { label: "Start" },
});

/** Every workflow gets exactly one Start node; older ones are patched on load. */
function ensureStartNode(wf: Workflow): Workflow {
  if (wf.nodes.some((n) => n.type === "start")) return wf;
  const topmost = wf.nodes.reduce(
    (min, n) => Math.min(min, n.position.y),
    Number.POSITIVE_INFINITY,
  );
  const leftmost = wf.nodes.reduce(
    (min, n) => Math.min(min, n.position.x),
    Number.POSITIVE_INFINITY,
  );
  const start = makeStartNode(
    wf.nodes.length
      ? { x: leftmost, y: topmost - 180 }
      : undefined,
  );
  const firstRoot = wf.nodes.find(
    (n) => !wf.edges.some((e) => e.target === n.id),
  );
  return {
    ...wf,
    nodes: [start, ...wf.nodes],
    edges: firstRoot
      ? [
          {
            id: uid(),
            source: start.id,
            target: firstRoot.id,
            type: "smoothstep",
          },
          ...wf.edges,
        ]
      : wf.edges,
  };
}

/* ---------- store ---------- */

function workflowPayload(wf: Workflow | undefined) {
  if (!wf) return undefined;
  return {
    name: wf.name,
    nodes: wf.nodes,
    edges: wf.edges,
    preRequestScript: wf.preRequestScript ?? "",
    preRequestEnabled: wf.preRequestEnabled ?? true,
  };
}

type GraphSnapshot = { nodes: WorkflowNode[]; edges: Edge[] };

const MAX_GRAPH_HISTORY = 50;
const graphPast: Record<string, GraphSnapshot[]> = {};
const graphFuture: Record<string, GraphSnapshot[]> = {};

function cloneGraph(wf: Workflow): GraphSnapshot {
  return {
    nodes: structuredClone(wf.nodes),
    edges: structuredClone(wf.edges),
  };
}

function snapshotsEqual(a: GraphSnapshot, b: GraphSnapshot) {
  return (
    JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
    JSON.stringify(a.edges) === JSON.stringify(b.edges)
  );
}

export const useStore = create<Store>((set, get) => {
  function commitGraphHistory() {
    const { workflows, activeWorkflowId, historyTick } = get();
    const wf = workflows.find((w) => w.id === activeWorkflowId);
    if (!wf) return;
    const snap = cloneGraph(wf);
    const past = graphPast[wf.id] ?? [];
    const last = past[past.length - 1];
    if (last && snapshotsEqual(last, snap)) return;
    graphPast[wf.id] = [...past, snap].slice(-MAX_GRAPH_HISTORY);
    graphFuture[wf.id] = [];
    set({ historyTick: historyTick + 1 });
  }

  function restoreGraph(snapshot: GraphSnapshot) {
    const { workflows, activeWorkflowId, selectedNodeId, historyTick } = get();
    const wf = workflows.find((w) => w.id === activeWorkflowId);
    if (!wf) return;
    const nodeIds = new Set(snapshot.nodes.map((n) => n.id));
    set({
      workflows: workflows.map((w) =>
        w.id === wf.id
          ? { ...w, nodes: snapshot.nodes, edges: snapshot.edges }
          : w,
      ),
      selectedNodeId:
        selectedNodeId && nodeIds.has(selectedNodeId) ? selectedNodeId : null,
      historyTick: historyTick + 1,
    });
    scheduleSave("workflows", wf.id, () =>
      workflowPayload(get().workflows.find((w) => w.id === wf.id)),
    );
  }
  /** Mutate the active workflow and schedule its save. */
  function patchActive(fn: (wf: Workflow) => Partial<Workflow>) {
    const { workflows, activeWorkflowId } = get();
    const wf = workflows.find((w) => w.id === activeWorkflowId);
    if (!wf) return;
    const next = { ...wf, ...fn(wf) };
    set({ workflows: workflows.map((w) => (w.id === wf.id ? next : w)) });
    scheduleSave("workflows", wf.id, () => {
      const cur = get().workflows.find((w) => w.id === wf.id);
      return workflowPayload(cur);
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
    activeHeaderSetId: null,
    selectedNodeId: null,
    saveState: "idle",
    lastSavedAt: null,
    wizardOpen: false,
    setWizardOpen: (open) => set({ wizardOpen: open }),
    deleteWorkflowConfirm: null,
    setDeleteWorkflowConfirm: (target) => set({ deleteWorkflowConfirm: target }),
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    isRunning: false,
    runs: {},
    runningEdgeId: null,
    doneEdgeIds: [],
    historyTick: 0,

    hydrate: async () => {
      if (hydrating || get().hydrated) return;
      hydrating = true;
      const [workflows, savedBodies, headerSets, environments] =
        (await Promise.all(
          (["workflows", "bodies", "header-sets", "environments"] as const).map(
            (kind) => fetch(`/api/data/${kind}`).then((r) => r.json()),
          ),
        )) as [Workflow[], SavedBody[], HeaderSet[], Environment[]];

      const firstTime = workflows.length === 0;
      if (firstTime) {
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
        workflows: workflows.map((w) => autoLayout(ensureStartNode(w))),
        savedBodies,
        headerSets,
        environments,
        activeWorkflowId: workflows[0]?.id ?? null,
        activeEnvId: environments[0]?.id ?? null,
        activeHeaderSetId: headerSets[0]?.id ?? null,
        wizardOpen: firstTime,
      });
    },

    onNodesChange: (changes) => {
      if (changes.some((c) => c.type === "remove" || c.type === "add")) {
        commitGraphHistory();
      }
      patchActive((wf) => ({ nodes: applyNodeChanges(changes, wf.nodes) }));
    },

    onEdgesChange: (changes) => {
      if (changes.some((c) => c.type === "remove" || c.type === "add")) {
        commitGraphHistory();
      }
      patchActive((wf) => ({ edges: applyEdgeChanges(changes, wf.edges) }));
    },

    onConnect: (conn) => {
      const { workflows, activeWorkflowId } = get();
      const wf = workflows.find((w) => w.id === activeWorkflowId);
      const { source, target } = conn;
      if (!wf || !source || !target || source === target) return;
      // Start is entry-only — it can never become a child.
      if (wf.nodes.find((n) => n.id === target)?.type === "start") return;
      // Reject if target is already an ancestor of source (would form a cycle).
      for (let cur: string | undefined = source; cur; ) {
        const up: string | undefined = wf.edges.find((e) => e.target === cur)?.source;
        if (up === target) return;
        cur = up === cur ? undefined : up;
      }

      commitGraphHistory();
      // Manual connect wins: target becomes the source's child (one parent),
      // dropped one row below it, then the graph re-lays out from levels.
      patchActive((w) => {
        const srcLevel = levelOfNode(w, source);
        const nodes =
          srcLevel == null
            ? w.nodes
            : w.nodes.map((n) =>
                n.id === target && n.type === "api"
                  ? {
                      ...n,
                      data: { ...n.data, level: srcLevel + 1, placement: "below" as const },
                    }
                  : n,
              );
        const edges: Edge[] = [
          ...w.edges.filter((e) => e.target !== target),
          { id: uid(), source, target, type: "smoothstep" },
        ];
        return autoLayout({ ...w, nodes, edges });
      });
    },

    onNodeDragStart: () => commitGraphHistory(),

    addNode: (opts) => {
      const id = uid();
      const { selectedNodeId } = get();
      commitGraphHistory();
      patchActive((wf) => {
        const taken = new Set(
          wf.nodes.filter((n) => n.type === "api").map((n) => n.data.label),
        );
        const placement = opts?.placement ?? "below";
        const anchorId =
          opts?.anchorNodeId ??
          selectedNodeId ??
          wf.nodes.find((n) => n.type === "start")?.id;
        const anchorLvl =
          anchorId != null ? levelOfNode(wf, anchorId) : null;
        const level =
          anchorLvl != null
            ? levelFromPlacement(anchorLvl, placement)
            : wf.nodes.reduce(
                  (max, n) =>
                    n.type === "api" ? Math.max(max, nodeLevel(wf, n.id)) : max,
                  0,
                ) + 1;

        const node: ApiNode = {
          id,
          type: "api",
          position: { x: 0, y: 0 },
          data: {
            method: "GET",
            url: "",
            headers: [],
            bodyMode: "none",
            inlineBody: "",
            ...opts?.data,
            label: uniqueLabel(opts?.data?.label || "Request", taken),
            level,
            placement,
          },
        };

        const edgeSource =
          anchorId != null
            ? resolveEdgeSource(wf, anchorId, placement, level)
            : undefined;

        const edges =
          edgeSource && edgeSource !== id
            ? [
                ...wf.edges.filter((e) => e.target !== id),
                {
                  id: uid(),
                  source: edgeSource,
                  target: id,
                  type: "smoothstep",
                } satisfies Edge,
              ]
            : wf.edges;

        return autoLayout({ ...wf, nodes: [...wf.nodes, node], edges });
      });
      set({ selectedNodeId: id });
      return id;
    },

    updateNodeData: (nodeId, patch) => {
      commitGraphHistory();
      patchActive((wf) => {
        if (typeof patch.label === "string") {
          const taken = new Set(
            wf.nodes.filter((n) => n.id !== nodeId).map((n) => n.data.label),
          );
          patch = { ...patch, label: uniqueLabel(patch.label, taken) };
        }
        if (patch.placement || patch.level != null) {
          const upstream = wf.edges.find((e) => e.target === nodeId)?.source;
          if (upstream) {
            const pLevel = levelOfNode(wf, upstream);
            if (pLevel != null && patch.placement) {
              patch = {
                ...patch,
                level: levelFromPlacement(pLevel, patch.placement),
              };
            }
          }
        }
        const next = {
          ...wf,
          nodes: wf.nodes.map((n) =>
            n.id === nodeId && n.type === "api"
              ? { ...n, data: { ...n.data, ...patch } }
              : n,
          ),
        };
        return "level" in patch || "placement" in patch
          ? autoLayout(next)
          : next;
      });
    },

    createWorkflow: () => {
      const wf: Workflow = {
        id: uid(),
        name: "New workflow",
        nodes: [makeStartNode()],
        edges: [],
      };
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

    createWorkflowFromNodes: (name, nodes) => {
      const start = makeStartNode();
      const ranked = nodes.map((n, i) => ({
        ...n,
        data: {
          ...n.data,
          level: n.data.level ?? i + 1,
          placement: n.data.placement ?? "below",
        },
      }));
      const wf: Workflow = autoLayout({
        id: uid(),
        name,
        nodes: [start, ...ranked],
        edges: ranked.map((n) => ({
          id: uid(),
          source: start.id,
          target: n.id,
          type: "smoothstep",
        })),
      });
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
      scheduleSave("workflows", id, () => workflowPayload(get().workflows.find((w) => w.id === id)));
    },

    setWorkflowPreRequestScript: (id, script) => {
      set((s) => ({
        workflows: s.workflows.map((w) =>
          w.id === id ? { ...w, preRequestScript: script } : w,
        ),
      }));
      scheduleSave("workflows", id, () => workflowPayload(get().workflows.find((w) => w.id === id)));
    },

    setWorkflowPreRequestEnabled: (id, enabled) => {
      set((s) => ({
        workflows: s.workflows.map((w) =>
          w.id === id ? { ...w, preRequestEnabled: enabled } : w,
        ),
      }));
      scheduleSave("workflows", id, () => workflowPayload(get().workflows.find((w) => w.id === id)));
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
      set((s) => ({
        headerSets: s.headerSets.filter((x) => x.id !== id),
        activeHeaderSetId:
          s.activeHeaderSetId === id
            ? (s.headerSets.find((x) => x.id !== id)?.id ?? null)
            : s.activeHeaderSetId,
      }));
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
    setActiveHeaderSet: (id) => set({ activeHeaderSetId: id }),

    canUndo: () => {
      const id = get().activeWorkflowId;
      return id ? (graphPast[id]?.length ?? 0) > 0 : false;
    },
    canRedo: () => {
      const id = get().activeWorkflowId;
      return id ? (graphFuture[id]?.length ?? 0) > 0 : false;
    },
    undo: () => {
      const { activeWorkflowId } = get();
      if (!activeWorkflowId) return;
      const past = graphPast[activeWorkflowId];
      if (!past?.length) return;
      const wf = get().workflows.find((w) => w.id === activeWorkflowId);
      if (!wf) return;
      const prev = past[past.length - 1]!;
      graphPast[activeWorkflowId] = past.slice(0, -1);
      graphFuture[activeWorkflowId] = [
        cloneGraph(wf),
        ...(graphFuture[activeWorkflowId] ?? []),
      ];
      restoreGraph(prev);
    },
    redo: () => {
      const { activeWorkflowId } = get();
      if (!activeWorkflowId) return;
      const future = graphFuture[activeWorkflowId];
      if (!future?.length) return;
      const wf = get().workflows.find((w) => w.id === activeWorkflowId);
      if (!wf) return;
      const next = future[0]!;
      graphFuture[activeWorkflowId] = future.slice(1);
      graphPast[activeWorkflowId] = [
        ...(graphPast[activeWorkflowId] ?? []),
        cloneGraph(wf),
      ].slice(-MAX_GRAPH_HISTORY);
      restoreGraph(next);
    },

    selectNode: (id) => {
      patchActive((wf) => ({
        nodes: wf.nodes.map((n) => ({ ...n, selected: id != null && n.id === id })),
      }));
      set({ selectedNodeId: id });
    },

    retrySaves: () => {
      const { workflows, savedBodies, headerSets, environments } = get();
      workflows.forEach((w) => put("workflows", w.id, workflowPayload(w)));
      savedBodies.forEach((b) => put("bodies", b.id, b));
      headerSets.forEach((h) => put("header-sets", h.id, h));
      environments.forEach((e) => put("environments", e.id, e));
    },

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
