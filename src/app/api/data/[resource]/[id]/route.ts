import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { isResourceSlug, RESOURCES } from "@/lib/resources";
import { getSession, unauthorized } from "@/lib/session";

const MAX_PAYLOAD = 1_000_000; // 1 MB per entity is plenty for a flow graph

type Ctx = { params: Promise<{ resource: string; id: string }> };

async function resolve(ctx: Ctx) {
  const session = await getSession();
  const { resource, id } = await ctx.params;
  if (!session) return { error: unauthorized() } as const;
  if (!isResourceSlug(resource) || !id) {
    return {
      error: Response.json({ error: "Unknown resource" }, { status: 404 }),
    } as const;
  }
  return { session, resource, id } as const;
}

/** Upsert (insert or full update) of one user-owned row. */
export async function PUT(req: Request, ctx: Ctx) {
  const r = await resolve(ctx);
  if ("error" in r) return r.error;
  const { session, resource, id } = r;
  const { table, keys } = RESOURCES[resource];

  const raw = await req.text();
  if (raw.length > MAX_PAYLOAD) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body?.name !== "string" || !body.name.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in body) payload[key] = body[key];
  }

  const [existing] = await db
    .select({ userId: table.userId })
    .from(table)
    .where(eq(table.id, id));
  if (existing && existing.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing) {
    await db
      .update(table)
      .set({ ...payload, updatedAt: new Date() })
      .where(and(eq(table.id, id), eq(table.userId, session.user.id)));
  } else {
    await db
      .insert(table)
      .values({ ...payload, id, userId: session.user.id } as never);
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const r = await resolve(ctx);
  if ("error" in r) return r.error;
  const { session, resource, id } = r;
  const { table } = RESOURCES[resource];

  await db
    .delete(table)
    .where(and(eq(table.id, id), eq(table.userId, session.user.id)));
  return Response.json({ ok: true });
}
