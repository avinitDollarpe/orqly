import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { isResourceSlug, RESOURCES } from "@/lib/resources";
import { getSession, unauthorized } from "@/lib/session";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ resource: string }> },
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { resource } = await ctx.params;
  if (!isResourceSlug(resource)) {
    return Response.json({ error: "Unknown resource" }, { status: 404 });
  }

  const { table } = RESOURCES[resource];
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.userId, session.user.id))
    .orderBy(asc(table.createdAt));

  return Response.json(rows);
}
