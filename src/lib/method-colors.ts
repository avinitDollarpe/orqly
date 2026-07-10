import type { Method } from "@/lib/types";

/** Method hues — values live in `src/app/globals.css` (--m-* vars), single source. */
export const METHOD_COLORS: Record<Method, { color: string; background: string }> = {
  GET: { color: "var(--m-get)", background: "var(--m-get-bg)" },
  POST: { color: "var(--m-post)", background: "var(--m-post-bg)" },
  PUT: { color: "var(--m-put)", background: "var(--m-put-bg)" },
  PATCH: { color: "var(--m-patch)", background: "var(--m-patch-bg)" },
  DELETE: { color: "var(--m-delete)", background: "var(--m-delete-bg)" },
};
