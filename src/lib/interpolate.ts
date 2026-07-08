import type { ExecResponse } from "@/lib/types";

export type InterpolationContext = {
  env: Record<string, string>;
  /** node label → last response, for upstream nodes that have run */
  nodes: Record<string, { response: ExecResponse }>;
};

export class InterpolationError extends Error {}

const TEMPLATE = /\{\{\s*([^}]+?)\s*\}\}/g;
const WHOLE_TEMPLATE = /^\{\{\s*([^}]+?)\s*\}\}$/;

function walk(obj: unknown, segments: string[], path: string): unknown {
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur === null || typeof cur !== "object") {
      throw new InterpolationError(`Cannot resolve {{${path}}} — "${seg}" not found`);
    }
    cur = (cur as Record<string, unknown>)[seg];
  }
  if (cur === undefined) {
    throw new InterpolationError(`Cannot resolve {{${path}}}`);
  }
  return cur;
}

/** Resolve one template path (`env.X`, `nodes.<label>.response...`). */
export function resolvePath(path: string, ctx: InterpolationContext): unknown {
  if (path.startsWith("env.")) {
    const key = path.slice(4);
    const value = ctx.env[key];
    if (value === undefined) {
      throw new InterpolationError(
        `Cannot resolve {{${path}}} — no variable "${key}" in the active environment`,
      );
    }
    return value;
  }

  if (path.startsWith("nodes.")) {
    const rest = path.slice(6);
    // labels may contain spaces or dots — longest-prefix match against known labels
    const label = Object.keys(ctx.nodes)
      .filter((l) => rest === l || rest.startsWith(l + "."))
      .sort((a, b) => b.length - a.length)[0];
    if (!label) {
      throw new InterpolationError(
        `Cannot resolve {{${path}}} — no upstream node response matches. ` +
          `Nodes only expose data after they have run.`,
      );
    }
    const remainder = rest.slice(label.length + 1);
    const segments = remainder ? remainder.split(".") : [];
    return walk(ctx.nodes[label], segments, path);
  }

  throw new InterpolationError(
    `Cannot resolve {{${path}}} — paths must start with "env." or "nodes."`,
  );
}

/** Plain string interpolation (URLs, header values). */
export function interpolateString(input: string, ctx: InterpolationContext): string {
  return input.replace(TEMPLATE, (_, path: string) => {
    const value = resolvePath(path, ctx);
    return typeof value === "string" ? value : JSON.stringify(value);
  });
}

function interpolateJsonValue(value: unknown, ctx: InterpolationContext): unknown {
  if (typeof value === "string") {
    const whole = value.match(WHOLE_TEMPLATE);
    // a string that IS a single template keeps the resolved value's type
    if (whole) return resolvePath(whole[1], ctx);
    return interpolateString(value, ctx);
  }
  if (Array.isArray(value)) {
    return value.map((v) => interpolateJsonValue(v, ctx));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, interpolateJsonValue(v, ctx)]),
    );
  }
  return value;
}

/**
 * JSON-aware body interpolation: parses the body so a value that is exactly
 * one template keeps the resolved type (number stays number, object stays
 * object). Non-JSON bodies fall back to plain string interpolation.
 */
export function interpolateBody(body: string, ctx: InterpolationContext): string {
  if (!body.trim()) return body;
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return interpolateString(body, ctx);
  }
  return JSON.stringify(interpolateJsonValue(parsed, ctx));
}

/** Flatten a JSON value into dot paths, for the variable picker. */
export function flattenPaths(
  value: unknown,
  prefix = "",
  out: { path: string; preview: string }[] = [],
  depth = 0,
): { path: string; preview: string }[] {
  if (depth > 6 || out.length > 200) return out;
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      flattenPaths(v, prefix ? `${prefix}.${k}` : k, out, depth + 1);
    }
  } else if (prefix) {
    out.push({ path: prefix, preview: JSON.stringify(value) ?? "undefined" });
  }
  return out;
}
