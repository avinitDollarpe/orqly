import { environments, headerSets, savedBodies, workflows } from "@/db/schema";

/** API resource slug → table + payload columns the client may write. */
export const RESOURCES = {
  workflows: { table: workflows, keys: ["name", "nodes", "edges"] },
  bodies: { table: savedBodies, keys: ["name", "json"] },
  "header-sets": { table: headerSets, keys: ["name", "headers"] },
  environments: { table: environments, keys: ["name", "vars"] },
} as const;

export type ResourceSlug = keyof typeof RESOURCES;

export function isResourceSlug(s: string): s is ResourceSlug {
  return s in RESOURCES;
}
