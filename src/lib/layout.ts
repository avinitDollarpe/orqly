import type { NodePlacement, Workflow } from "@/lib/types";

/** Node card dimensions — keep in sync with ApiNode / StartNode (280×125, Didit proportions). */
export const CARD_W = 280;
export const CARD_H = 125;
/** Equal gap between neighbouring nodes in every direction. */
export const NODE_GAP = 96;

const H_PITCH = CARD_W + NODE_GAP;
const V_PITCH = CARD_H + NODE_GAP;
const CENTER_X = 400;
const START_Y = 40;

/** Level of a node: Start is always 0. */
export function levelOfNode(
  wf: Workflow,
  nodeId: string,
): number | null {
  const n = wf.nodes.find((node) => node.id === nodeId);
  if (!n) return null;
  return n.type === "start" ? 0 : nodeLevel(wf, nodeId);
}

/** Row index shown on the badge; nodes sharing a level align horizontally. */
export function nodeLevel(wf: Workflow, nodeId: string): number {
  const node = wf.nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== "api") return 0;
  if (node.data.level != null) return node.data.level;

  const parent = wf.edges.find((e) => e.target === nodeId)?.source;
  if (parent) {
    const pLevel = levelOfNode(wf, parent);
    if (pLevel != null) {
      return levelFromPlacement(pLevel, node.data.placement ?? "below");
    }
  }

  const api = wf.nodes.filter((n) => n.type === "api");
  const idx = api.findIndex((n) => n.id === nodeId);
  return idx + 1;
}

/** Compute child row from parent row and placement intent. */
export function levelFromPlacement(
  parentLevel: number,
  placement: NodePlacement,
): number {
  if (placement === "below") return parentLevel + 1;
  // same row — Start (0) fans out to the first request row
  return parentLevel === 0 ? 1 : parentLevel;
}

/** Primary upstream node, if any. */
export function parentId(wf: Workflow, nodeId: string): string | undefined {
  return wf.edges.find((e) => e.target === nodeId)?.source;
}

/**
 * Who the new edge should run from:
 * - below → anchor is the parent
 * - same → anchor's parent (level 1 nodes fan out from Start)
 */
export function resolveEdgeSource(
  wf: Workflow,
  anchorId: string,
  placement: NodePlacement,
  childLevel: number,
): string | undefined {
  if (placement === "below") return anchorId;

  const parentLevel = childLevel - 1;
  if (parentLevel <= 0) {
    return wf.nodes.find((n) => n.type === "start")?.id;
  }

  const upstream = parentId(wf, anchorId);
  if (upstream && levelOfNode(wf, upstream) === parentLevel) {
    return upstream;
  }
  return upstream;
}

/** Ensure every API node connects from the row above (level N → parent at N−1). */
export function syncEdgesToLevels(wf: Workflow): Workflow {
  const start = wf.nodes.find((n) => n.type === "start");
  if (!start) return wf;

  const edges = [...wf.edges];

  const parentFrom = (nodeId: string) =>
    edges.find((e) => e.target === nodeId)?.source;

  for (const node of wf.nodes) {
    if (node.type !== "api") continue;

    const level = nodeLevel(wf, node.id);
    const parentLevel = level - 1;
    const desiredSource =
      parentLevel <= 0
        ? start.id
        : (() => {
            const up = parentFrom(node.id);
            if (up && levelOfNode(wf, up) === parentLevel) return up;
            return wf.nodes.find(
              (n) =>
                n.type === "api" && nodeLevel(wf, n.id) === parentLevel,
            )?.id;
          })();

    if (!desiredSource) continue;

    const incoming = edges.filter((e) => e.target === node.id);
    const valid = incoming.some((e) => e.source === desiredSource);
    if (valid && incoming.length === 1) continue;

    for (let i = edges.length - 1; i >= 0; i--) {
      if (edges[i].target === node.id) edges.splice(i, 1);
    }
    edges.push({
      id: crypto.randomUUID(),
      source: desiredSource,
      target: node.id,
      type: "smoothstep",
    });
  }

  return { ...wf, edges };
}

/** Reposition every node from its level; equal gap on all sides. */
export function autoLayout(wf: Workflow): Workflow {
  const synced = syncEdgesToLevels(wf);
  const order = new Map(synced.nodes.map((n, i) => [n.id, i]));
  const rows = new Map<number, string[]>();

  for (const n of synced.nodes) {
    const level = n.type === "start" ? 0 : nodeLevel(synced, n.id);
    rows.set(level, [...(rows.get(level) ?? []), n.id]);
  }

  for (const ids of rows.values()) {
    ids.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }

  const pos = new Map<string, { x: number; y: number }>();
  for (const [level, ids] of rows) {
    const rowWidth = (ids.length - 1) * H_PITCH;
    ids.forEach((id, i) => {
      pos.set(id, {
        x: CENTER_X - CARD_W / 2 - rowWidth / 2 + i * H_PITCH,
        y: START_Y + level * V_PITCH,
      });
    });
  }

  return {
    ...synced,
    nodes: synced.nodes.map((n) => ({
      ...n,
      position: pos.get(n.id) ?? n.position,
    })),
  };
}
