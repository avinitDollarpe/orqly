import { parseOpenApi, type ParsedOpenApi } from "@/lib/openapi";
import type { ApiNode, KV, Method } from "@/lib/types";
import { METHODS } from "@/lib/types";

/** Minimal shapes we read from a Postman collection v2.x JSON export. */
type PmKV = { key?: string; value?: string; disabled?: boolean };
type PmUrl =
  | string
  | {
      raw?: string;
      protocol?: string;
      host?: string[] | string;
      path?: string[] | string;
      query?: PmKV[];
    };
type PmFormField = PmKV & { type?: string };
type PmBody = {
  mode?: string;
  raw?: string;
  urlencoded?: PmKV[];
  formdata?: PmFormField[];
  graphql?: { query?: string; variables?: string };
};
type PmRequest =
  | string
  | { method?: string; url?: PmUrl; header?: PmKV[]; body?: PmBody };
type PmItem = { name?: string; item?: PmItem[]; request?: PmRequest };
type PmCollection = {
  info?: { name?: string; schema?: string };
  item?: PmItem[];
  variable?: PmKV[];
};

const uid = () => crypto.randomUUID();

export function isPostmanCollection(raw: unknown): boolean {
  return (
    !!raw &&
    typeof raw === "object" &&
    "info" in raw &&
    Array.isArray((raw as PmCollection).item)
  );
}

/** Postman {{var}} → orqly {{env.var}}; already-namespaced paths pass through. */
function envify(s: string): string {
  return s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, path: string) =>
    path.startsWith("env.") || path.startsWith("nodes.")
      ? match
      : `{{env.${path}}}`,
  );
}

function urlOf(u: PmUrl | undefined): string {
  if (!u) return "";
  if (typeof u === "string") return u;
  if (u.raw) return u.raw;
  const host = Array.isArray(u.host) ? u.host.join(".") : (u.host ?? "");
  const path = Array.isArray(u.path) ? u.path.join("/") : (u.path ?? "");
  const query = (u.query ?? [])
    .filter((q) => !q.disabled && q.key)
    .map((q) => `${q.key}=${q.value ?? ""}`)
    .join("&");
  const base = `${u.protocol ? `${u.protocol}://` : ""}${host}${path ? `/${path}` : ""}`;
  return query ? `${base}?${query}` : base;
}

function bodyOf(b: PmBody | undefined): string {
  if (!b) return "";
  if (b.mode === "urlencoded") {
    return (b.urlencoded ?? [])
      .filter((p) => !p.disabled && p.key)
      .map((p) => `${encodeURIComponent(p.key!)}=${encodeURIComponent(p.value ?? "")}`)
      .join("&");
  }
  if (b.mode === "graphql" && b.graphql) {
    let vars: unknown = {};
    try {
      vars = JSON.parse(b.graphql.variables || "{}");
    } catch {
      vars = b.graphql.variables;
    }
    return JSON.stringify({ query: b.graphql.query ?? "", variables: vars }, null, 2);
  }
  if (b.mode === "formdata") {
    // File fields can't be imported (no file to carry); text fields become a JSON object.
    const obj: Record<string, string> = {};
    for (const f of b.formdata ?? []) {
      if (!f.disabled && f.type !== "file" && f.key) obj[f.key] = f.value ?? "";
    }
    return Object.keys(obj).length ? JSON.stringify(obj, null, 2) : "";
  }
  return b.raw ?? "";
}

/**
 * Parse a Postman collection v2.x into request nodes, one per request,
 * walking folders recursively. Collection variables come back as env vars.
 */
export function parsePostman(raw: unknown): ParsedOpenApi {
  const col = raw as PmCollection;
  if (!isPostmanCollection(raw)) {
    throw new Error('Not a Postman collection — no "info" and "item" found');
  }

  const taken = new Set<string>();
  const unique = (label: string) => {
    let out = label;
    for (let i = 2; taken.has(out); i++) out = `${label} ${i}`;
    taken.add(out);
    return out;
  };

  const nodes: ApiNode[] = [];
  const visit = (items: PmItem[]) => {
    for (const it of items) {
      if (it.item) {
        visit(it.item);
        continue;
      }
      if (!it.request) continue;
      const r = typeof it.request === "string" ? { url: it.request } : it.request;
      const method = ((r.method ?? "GET").toUpperCase()) as Method;
      if (!METHODS.includes(method)) continue;
      const url = envify(urlOf(r.url));
      if (!url) continue;
      const headers: KV[] = (r.header ?? [])
        .filter((h) => h.key)
        .map((h) => ({
          key: h.key!,
          value: envify(h.value ?? ""),
          enabled: !h.disabled,
        }));
      const body = envify(bodyOf(r.body));

      nodes.push({
        id: uid(),
        type: "api",
        position: { x: 0, y: 0 },
        data: {
          label: unique(it.name || `${method} ${url}`),
          level: 1,
          placement: "same",
          method,
          url,
          headers,
          bodyMode: body ? "inline" : "none",
          inlineBody: body,
        },
      });
    }
  };
  visit(col.item ?? []);

  if (nodes.length === 0) {
    throw new Error("The collection contains no requests to import");
  }

  const vars: KV[] = (col.variable ?? [])
    .filter((v) => v.key)
    .map((v) => ({ key: v.key!, value: v.value ?? "", enabled: !v.disabled }));

  return {
    name: col.info?.name || "Imported collection",
    baseUrl: "",
    nodes,
    bodies: [],
    vars,
  };
}

/** Auto-detect Postman collection vs OpenAPI/Swagger and parse accordingly. */
export function parseApiFile(raw: unknown): ParsedOpenApi {
  return isPostmanCollection(raw) ? parsePostman(raw) : parseOpenApi(raw);
}
