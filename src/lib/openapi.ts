import type { ApiNode, Method } from "@/lib/types";
import { METHODS } from "@/lib/types";

/** Minimal shapes we read from an OpenAPI 3 / Swagger 2 JSON document. */
type OpenApiDoc = {
  openapi?: string;
  swagger?: string;
  info?: { title?: string };
  servers?: { url?: string }[];
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths?: Record<string, Record<string, Operation>>;
};

type Operation = {
  summary?: string;
  operationId?: string;
  requestBody?: {
    content?: Record<
      string,
      { example?: unknown; examples?: Record<string, { value?: unknown }> }
    >;
  };
};

const uid = () => crypto.randomUUID();

const NODES_PER_COLUMN = 4;
const COLUMN_GAP = 320;
const ROW_GAP = 190;
const FIRST_ROW_Y = 260; // leaves room for the Start node above

function baseUrl(doc: OpenApiDoc): string {
  if (doc.servers?.[0]?.url) return doc.servers[0].url.replace(/\/$/, "");
  if (doc.host) {
    const scheme = doc.schemes?.includes("https") ? "https" : (doc.schemes?.[0] ?? "https");
    return `${scheme}://${doc.host}${doc.basePath ?? ""}`.replace(/\/$/, "");
  }
  return "";
}

function exampleBody(op: Operation): string {
  const content = op.requestBody?.content;
  if (!content) return "";
  const json = content["application/json"] ?? Object.values(content)[0];
  const example =
    json?.example ?? Object.values(json?.examples ?? {})[0]?.value;
  return example === undefined ? "" : JSON.stringify(example, null, 2);
}

/**
 * Parse an OpenAPI/Swagger JSON document into request nodes, one per
 * operation, laid out in columns reading top to bottom.
 */
export function parseOpenApi(raw: unknown): { name: string; nodes: ApiNode[] } {
  const doc = raw as OpenApiDoc;
  if (!doc || typeof doc !== "object" || !doc.paths) {
    throw new Error("Not an OpenAPI document — no \"paths\" object found");
  }

  const base = baseUrl(doc);
  const taken = new Set<string>();
  const unique = (label: string) => {
    let out = label;
    for (let i = 2; taken.has(out); i++) out = `${label} ${i}`;
    taken.add(out);
    return out;
  };

  const nodes: ApiNode[] = [];
  for (const [path, ops] of Object.entries(doc.paths)) {
    for (const [verb, op] of Object.entries(ops ?? {})) {
      const method = verb.toUpperCase() as Method;
      if (!METHODS.includes(method)) continue;

      const i = nodes.length;
      const body = method !== "GET" ? exampleBody(op) : "";
      nodes.push({
        id: uid(),
        type: "api",
        position: {
          x: 80 + Math.floor(i / NODES_PER_COLUMN) * COLUMN_GAP,
          y: FIRST_ROW_Y + (i % NODES_PER_COLUMN) * ROW_GAP,
        },
        data: {
          label: unique(op.summary || op.operationId || `${method} ${path}`),
          method,
          url: `${base}${path}`,
          headers: [],
          bodyMode: body ? "inline" : "none",
          inlineBody: body,
        },
      });
    }
  }

  if (nodes.length === 0) {
    throw new Error("The spec contains no operations to import");
  }

  return { name: doc.info?.title || "Imported API", nodes };
}
