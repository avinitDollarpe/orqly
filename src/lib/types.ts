import type { Edge, Node } from "@xyflow/react";

export type KV = { key: string; value: string; enabled: boolean };

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** Where a node sits relative to its upstream parent when auto-placed. */
export type NodePlacement = "same" | "below";

export type ApiNodeData = {
  /** Display name; also the `{{nodes.<label>...}}` namespace key. */
  label: string;
  /**
   * Row index on the canvas (Start is 0). Nodes sharing a level sit on the
   * same horizontal line; higher levels stack below.
   */
  level?: number;
  /**
   * Relative to the upstream parent: "same" keeps the row, "below" drops
   * one level down. Used when adding a node and when recomputing level.
   */
  placement?: NodePlacement;
  method: Method;
  url: string;
  headerSetId?: string;
  /** Inline headers, merged over the referenced header set. */
  headers: KV[];
  bodyMode: "none" | "saved" | "inline";
  savedBodyId?: string;
  inlineBody: string;
};

export type ApiNode = Node<ApiNodeData, "api">;

export type StartNodeData = { label: string };
export type StartNode = Node<StartNodeData, "start">;

/** Canvas node: the always-present Start node or an API request node. */
export type WorkflowNode = ApiNode | StartNode;

export type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  /** Postman-style script run before every API request in this workflow. */
  preRequestScript?: string;
};

export type SavedBody = { id: string; name: string; json: string };
export type HeaderSet = { id: string; name: string; headers: KV[] };
export type Environment = { id: string; name: string; vars: KV[] };

/* ---- run state (ephemeral, never persisted) ---- */

export type NodeRunStatus = "idle" | "running" | "success" | "error" | "skipped";

export type ExecResponse = {
  status: number;
  statusText: string;
  ms: number;
  headers: Record<string, string>;
  /** Parsed JSON when the body is JSON, otherwise the raw text. */
  body: unknown;
  bodyText: string;
};

export type ResolvedRequest = {
  method: Method;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type NodeRun = {
  status: NodeRunStatus;
  response?: ExecResponse;
  error?: string;
  resolved?: ResolvedRequest;
};

/** Export bundle: a workflow plus every saved resource it references. */
export type WorkflowBundle = {
  orqly: 1;
  workflow: Workflow;
  savedBodies: SavedBody[];
  headerSets: HeaderSet[];
};
