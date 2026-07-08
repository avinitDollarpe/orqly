import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Session for the current request, or null when unauthenticated. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export const unauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });
