import type { Method } from "@/lib/types";

/** Canonical HTTP method hues — keep in sync with `src/app/globals.css`. */
export const METHOD_COLORS: Record<Method, { color: string; background: string }> = {
  GET: {
    color: "#14DB7F",
    background: "color-mix(in srgb, #14DB7F 10%, #141313)",
  },
  POST: {
    color: "#ff5a19",
    background: "color-mix(in srgb, #ff5a19 10%, #141313)",
  },
  PUT: {
    color: "#ffc107",
    background: "color-mix(in srgb, #ffc107 10%, #141313)",
  },
  PATCH: {
    color: "#2563EB",
    background: "color-mix(in srgb, #2563EB 10%, #141313)",
  },
  DELETE: {
    color: "#dd2545",
    background: "color-mix(in srgb, #dd2545 10%, #141313)",
  },
};

export function methodHue(method: Method) {
  return METHOD_COLORS[method];
}
