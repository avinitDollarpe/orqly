import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { BETA_COOKIE, betaCookieValue, betaGateEnabled, passcodeMatches } from "@/lib/beta";

/**
 * Public (unauthenticated) endpoint behind the beta wall's only open door:
 * { email } joins the waitlist, { passcode } trades the shared beta passcode
 * for the signed cookie the proxy checks.
 */
export async function POST(req: Request) {
  let body: { email?: string; passcode?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.passcode === "string") {
    if (!betaGateEnabled() || !passcodeMatches(body.passcode)) {
      return Response.json({ error: "Invalid passcode" }, { status: 401 });
    }
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `${BETA_COOKIE}=${await betaCookieValue()}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`,
        },
      },
    );
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email" }, { status: 400 });
  }
  await db.insert(waitlist).values({ email }).onConflictDoNothing();
  return Response.json({ ok: true });
}
