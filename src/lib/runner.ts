"use client";

import {
  InterpolationError,
  interpolateBody,
  interpolateString,
  type InterpolationContext,
} from "@/lib/interpolate";
import { useStore } from "@/lib/store";
import type {
  ApiNode,
  ExecResponse,
  KV,
  ResolvedRequest,
  Workflow,
  WorkflowNode,
} from "@/lib/types";

/** Kahn topological order; nodes in cycles are returned separately. */
function topoOrder(wf: Workflow): {
  order: WorkflowNode[];
  cyclic: WorkflowNode[];
} {
  const indegree = new Map(wf.nodes.map((n) => [n.id, 0]));
  for (const e of wf.edges) {
    if (indegree.has(e.target) && indegree.has(e.source)) {
      indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
    }
  }
  const queue = wf.nodes.filter((n) => indegree.get(n.id) === 0);
  const order: WorkflowNode[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const e of wf.edges) {
      if (e.source !== node.id) continue;
      const d = (indegree.get(e.target) ?? 0) - 1;
      indegree.set(e.target, d);
      if (d === 0) {
        const target = wf.nodes.find((n) => n.id === e.target);
        if (target) queue.push(target);
      }
    }
  }
  const seen = new Set(order.map((n) => n.id));
  return { order, cyclic: wf.nodes.filter((n) => !seen.has(n.id)) };
}

function buildEnv(): Record<string, string> {
  const { environments, activeEnvId } = useStore.getState();
  const env = environments.find((e) => e.id === activeEnvId);
  return Object.fromEntries(
    (env?.vars ?? []).filter((v) => v.enabled && v.key).map((v) => [v.key, v.value]),
  );
}

/** Context of every node that has a successful response this run. */
function buildNodeContext(wf: Workflow): InterpolationContext["nodes"] {
  const { runs } = useStore.getState();
  const ctx: InterpolationContext["nodes"] = {};
  for (const node of wf.nodes) {
    if (node.type !== "api") continue;
    const run = runs[node.id];
    if (run?.response) ctx[node.data.label] = { response: run.response };
  }
  return ctx;
}

function resolveRequest(node: ApiNode, ctx: InterpolationContext): ResolvedRequest {
  const { headerSets, savedBodies } = useStore.getState();
  const set = headerSets.find((h) => h.id === node.data.headerSetId);

  const headers: Record<string, string> = {};
  const apply = (kvs: KV[]) => {
    for (const kv of kvs) {
      if (kv.enabled && kv.key.trim()) {
        headers[kv.key.trim()] = interpolateString(kv.value, ctx);
      }
    }
  };
  apply(set?.headers ?? []);
  apply(node.data.headers); // inline rows win over the set

  let body: string | undefined;
  if (node.data.method !== "GET" && node.data.bodyMode !== "none") {
    const raw =
      node.data.bodyMode === "saved"
        ? (savedBodies.find((b) => b.id === node.data.savedBodyId)?.json ?? "")
        : node.data.inlineBody;
    body = interpolateBody(raw, ctx);
    if (body && !("Content-Type" in headers) && !("content-type" in headers)) {
      headers["Content-Type"] = "application/json";
    }
  }

  return {
    method: node.data.method,
    url: interpolateString(node.data.url.trim(), ctx),
    headers,
    body,
  };
}

async function executeNode(
  node: ApiNode,
  ctx: InterpolationContext,
): Promise<{ ok: boolean; error?: string }> {
  const store = useStore.getState();
  let resolved: ResolvedRequest;
  try {
    resolved = resolveRequest(node, ctx);
    if (!resolved.url) throw new InterpolationError("URL is empty");
  } catch (e) {
    store.setNodeRun(node.id, {
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }

  store.setNodeRun(node.id, { status: "running", resolved });
  try {
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolved),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error ?? `Proxy error (${res.status})`);

    const response = payload as ExecResponse;
    const ok = response.status < 400;
    useStore.getState().setNodeRun(node.id, {
      status: ok ? "success" : "error",
      resolved,
      response,
      error: ok ? undefined : `${response.status} ${response.statusText}`,
    });
    return { ok };
  } catch (e) {
    useStore.getState().setNodeRun(node.id, {
      status: "error",
      resolved,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }
}

export async function runWorkflow(wf: Workflow) {
  const store = useStore.getState();
  if (store.isRunning) return;
  store.resetRuns();
  store.setIsRunning(true);

  try {
    const env = buildEnv();
    const { order, cyclic } = topoOrder(wf);
    for (const node of cyclic) {
      store.setNodeRun(node.id, {
        status: "error",
        error: "Node is part of a cycle — flows must be acyclic",
      });
    }

    const failed = new Set(cyclic.map((n) => n.id));
    for (const node of order) {
      if (node.type === "start") {
        // Start executes nothing; its outgoing edges light up immediately
        wf.edges
          .filter((e) => e.source === node.id)
          .forEach((e) => useStore.getState().addDoneEdge(e.id));
        continue;
      }
      const incoming = wf.edges.filter((e) => e.target === node.id);
      if (incoming.some((e) => failed.has(e.source))) {
        failed.add(node.id);
        useStore.getState().setNodeRun(node.id, { status: "skipped" });
        continue;
      }

      const inEdge = incoming[incoming.length - 1];
      if (inEdge) useStore.getState().setRunningEdge(inEdge.id);

      const ctx = { env, nodes: buildNodeContext(wf) };
      const { ok } = await executeNode(node, ctx);

      useStore.getState().setRunningEdge(null);
      if (ok) {
        incoming.forEach((e) => useStore.getState().addDoneEdge(e.id));
      } else {
        failed.add(node.id);
      }
    }
  } finally {
    useStore.getState().setIsRunning(false);
    useStore.getState().setRunningEdge(null);
  }
}

/** Run one node against the context accumulated from previous runs. */
export async function runSingleNode(wf: Workflow, nodeId: string) {
  const store = useStore.getState();
  if (store.isRunning) return;
  const node = wf.nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== "api") return;
  store.setIsRunning(true);
  try {
    await executeNode(node, { env: buildEnv(), nodes: buildNodeContext(wf) });
  } finally {
    useStore.getState().setIsRunning(false);
  }
}
