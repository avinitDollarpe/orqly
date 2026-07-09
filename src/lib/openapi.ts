import type { ApiNode, Method, SavedBody } from "@/lib/types";
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

type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  default?: unknown;
  example?: unknown;
  enum?: unknown[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  allOf?: Schema[];
};

type MediaType = {
  schema?: Schema;
  example?: unknown;
  examples?: Record<string, { value?: unknown }>;
};

type Operation = {
  summary?: string;
  operationId?: string;
  requestBody?: { content?: Record<string, MediaType> };
  /** Swagger 2 puts the request body in parameters as { in: "body", schema } */
  parameters?: { in?: string; schema?: Schema }[];
};

const uid = () => crypto.randomUUID();

function baseUrl(doc: OpenApiDoc): string {
  if (doc.servers?.[0]?.url) return doc.servers[0].url.replace(/\/$/, "");
  if (doc.host) {
    const scheme = doc.schemes?.includes("https") ? "https" : (doc.schemes?.[0] ?? "https");
    return `${scheme}://${doc.host}${doc.basePath ?? ""}`.replace(/\/$/, "");
  }
  return "";
}

/** Follow a local "#/components/schemas/X" or "#/definitions/X" pointer. */
function resolveRef(doc: unknown, ref: string): Schema | undefined {
  if (!ref.startsWith("#/")) return undefined;
  return ref
    .slice(2)
    .split("/")
    .reduce<unknown>(
      (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
      doc,
    ) as Schema | undefined;
}

/**
 * Synthesize an example value from a JSON schema: prefer explicit
 * example/default/enum, otherwise stub each type. Depth-capped and
 * cycle-safe so recursive specs can't loop.
 */
function exampleFromSchema(
  schema: Schema | undefined,
  doc: unknown,
  depth = 0,
  seen: ReadonlySet<string> = new Set(),
): unknown {
  if (!schema || depth > 8) return null;
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return null;
    return exampleFromSchema(
      resolveRef(doc, schema.$ref),
      doc,
      depth + 1,
      new Set([...seen, schema.$ref]),
    );
  }
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  const variant = schema.oneOf?.[0] ?? schema.anyOf?.[0];
  if (variant) return exampleFromSchema(variant, doc, depth + 1, seen);
  if (schema.allOf?.length) {
    const parts = schema.allOf.map((s) => exampleFromSchema(s, doc, depth + 1, seen));
    return Object.assign({}, ...parts.filter((p) => p && typeof p === "object"));
  }
  switch (schema.type) {
    case "object": {
      const out: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(schema.properties ?? {})) {
        out[key] = exampleFromSchema(prop, doc, depth + 1, seen);
      }
      return out;
    }
    case "array": {
      const item = exampleFromSchema(schema.items, doc, depth + 1, seen);
      return item === null ? [] : [item];
    }
    case "string":
      return schema.format === "date-time" ? "2024-01-01T00:00:00Z" : "string";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return false;
    default:
      return null;
  }
}

/** Example request body for an operation, or "" when it has none. */
function exampleBody(op: Operation, doc: unknown): string {
  const content = op.requestBody?.content;
  const media = content
    ? (content["application/json"] ?? Object.values(content)[0])
    : undefined;
  // Swagger 2 body parameter
  const swaggerSchema = op.parameters?.find((p) => p.in === "body")?.schema;

  const example =
    media?.example ??
    Object.values(media?.examples ?? {})[0]?.value ??
    exampleFromSchema(media?.schema ?? swaggerSchema, doc);

  return example === undefined || example === null
    ? ""
    : JSON.stringify(example, null, 2);
}

export type ParsedOpenApi = {
  name: string;
  /** First server URL — import it as {{env.BASE_URL}}. Empty when the spec has none. */
  baseUrl: string;
  nodes: ApiNode[];
  /** One library body per operation with a request body; nodes reference these. */
  bodies: SavedBody[];
};

/**
 * Parse an OpenAPI/Swagger JSON document into request nodes, one per
 * operation. Positions are assigned later by autoLayout (level 1 row).
 */
export function parseOpenApi(raw: unknown): ParsedOpenApi {
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
  const bodies: SavedBody[] = [];
  const bodyIdByJson = new Map<string, string>();

  for (const [path, ops] of Object.entries(doc.paths)) {
    for (const [verb, op] of Object.entries(ops ?? {})) {
      const method = verb.toUpperCase() as Method;
      if (!METHODS.includes(method)) continue;

      const label = unique(op.summary || op.operationId || `${method} ${path}`);
      const json = method !== "GET" ? exampleBody(op, doc) : "";

      // identical bodies share one library entry
      let savedBodyId = json ? bodyIdByJson.get(json) : undefined;
      if (json && !savedBodyId) {
        savedBodyId = uid();
        bodyIdByJson.set(json, savedBodyId);
        bodies.push({ id: savedBodyId, name: `${label} body`, json });
      }

      nodes.push({
        id: uid(),
        type: "api",
        position: { x: 0, y: 0 },
        data: {
          label,
          level: 1,
          placement: "same",
          method,
          url: base ? `{{env.BASE_URL}}${path}` : path,
          headers: [],
          bodyMode: savedBodyId ? "saved" : "none",
          savedBodyId,
          inlineBody: "",
        },
      });
    }
  }

  if (nodes.length === 0) {
    throw new Error("The spec contains no operations to import");
  }

  return { name: doc.info?.title || "Imported API", baseUrl: base, nodes, bodies };
}
