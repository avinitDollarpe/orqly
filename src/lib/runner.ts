"use client";

import { burstConfetti } from "@/lib/confetti";
import {
  InterpolationError,
  interpolateBody,
  interpolateString,
  type InterpolationContext,
} from "@/lib/interpolate";
import { nodeLevel } from "@/lib/layout";
import { applyPreRequestScript } from "@/lib/pre-request";
import { useStore } from "@/lib/store";
import type {
  ApiNode,
  ExecResponse,
  KV,
  ResolvedRequest,
  Workflow,
  WorkflowNode,
} from "@/lib/types";

/** Kahn topological order — used only to detect cycles. */
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
  const byX = (a: WorkflowNode, b: WorkflowNode) =>
    a.position.x - b.position.x;

  const queue = wf.nodes
    .filter((n) => indegree.get(n.id) === 0)
    .sort(byX);
  const order: WorkflowNode[] = [];
  while (queue.length) {
    queue.sort(byX);
    const node = queue.shift()!;
    order.push(node);
    const ready: WorkflowNode[] = [];
    for (const e of wf.edges) {
      if (e.source !== node.id) continue;
      const d = (indegree.get(e.target) ?? 0) - 1;
      indegree.set(e.target, d);
      if (d === 0) {
        const target = wf.nodes.find((n) => n.id === e.target);
        if (target) ready.push(target);
      }
    }
    queue.push(...ready);
  }
  const seen = new Set(order.map((n) => n.id));
  return { order, cyclic: wf.nodes.filter((n) => !seen.has(n.id)) };
}

function apiNodesAtLevel(wf: Workflow, level: number): ApiNode[] {
  return wf.nodes.filter(
    (n): n is ApiNode => n.type === "api" && nodeLevel(wf, n.id) === level,
  );
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
  const { headerSets, savedBodies, activeHeaderSetId } = useStore.getState();
  const set = headerSets.find((h) => h.id === activeHeaderSetId);

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
  preRequestScript?: string,
): Promise<{ ok: boolean; error?: string }> {
  const store = useStore.getState();
  let resolved: ResolvedRequest;
  try {
    resolved = resolveRequest(node, ctx);
    if (!resolved.url) throw new InterpolationError("URL is empty");
    resolved = applyPreRequestScript(preRequestScript, ctx.env, resolved);
  } catch (e) {
    store.setNodeRun(node.id, {
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
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

  const script =
    wf.preRequestEnabled === false ? undefined : wf.preRequestScript;

  try {
    const env = buildEnv();
    const { cyclic } = topoOrder(wf);
    const failed = new Set(cyclic.map((n) => n.id));
    for (const node of cyclic) {
      store.setNodeRun(node.id, {
        status: "error",
        error: "Node is part of a cycle — flows must be acyclic",
      });
    }

    const start = wf.nodes.find((n) => n.type === "start");
    if (start) {
      wf.edges
        .filter((e) => e.source === start.id)
        .forEach((e) => store.addDoneEdge(e.id));
    }

    const maxLevel = Math.max(
      0,
      ...wf.nodes
        .filter((n) => n.type === "api")
        .map((n) => nodeLevel(wf, n.id)),
    );

    for (let level = 1; level <= maxLevel; level++) {
      const batch: ApiNode[] = [];
      for (const node of apiNodesAtLevel(wf, level)) {
        if (failed.has(node.id)) continue;
        const incoming = wf.edges.filter((e) => e.target === node.id);
        if (incoming.some((e) => failed.has(e.source))) {
          failed.add(node.id);
          store.setNodeRun(node.id, { status: "skipped" });
          continue;
        }
        batch.push(node);
      }
      if (batch.length === 0) continue;

      const running = batch.flatMap((node) =>
        wf.edges.filter((e) => e.target === node.id).map((e) => e.id),
      );
      store.setRunningEdges(running);

      const ctx = { env, nodes: buildNodeContext(wf) };
      const results = await Promise.all(
        batch.map((node) => executeNode(node, ctx, script)),
      );
      store.setRunningEdges([]);

      for (let i = 0; i < batch.length; i++) {
        const node = batch[i]!;
        const { ok } = results[i]!;
        if (ok) {
          wf.edges
            .filter((e) => e.target === node.id)
            .forEach((e) => store.addDoneEdge(e.id));
        } else {
          failed.add(node.id);
        }
      }
    }

    const apiNodes = wf.nodes.filter((n) => n.type === "api");
    const allOk =
      apiNodes.length > 0 &&
      apiNodes.every((n) => useStore.getState().runs[n.id]?.status === "success");
    if (allOk) burstConfetti();
  } finally {
    store.setIsRunning(false);
    store.setRunningEdges([]);
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
    await executeNode(
      node,
      { env: buildEnv(), nodes: buildNodeContext(wf) },
      wf.preRequestEnabled === false ? undefined : wf.preRequestScript,
    );
  } finally {
    store.setIsRunning(false);
  }
}
