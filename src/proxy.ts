import { NextResponse, type NextRequest } from "next/server";
import { BETA_COOKIE, betaCookieValue, betaGateEnabled } from "@/lib/beta";

/**
 * Private-beta wall: with BETA_PASSCODE set, every route — pages and APIs —
 * requires the signed beta cookie. Only the waitlist page and its API are
 * public, so no deep link lands past the wall.
 */
export async function proxy(request: NextRequest) {
  if (!betaGateEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/waitlist" || pathname === "/api/waitlist") {
    return NextResponse.next();
  }

  if (request.cookies.get(BETA_COOKIE)?.value === (await betaCookieValue())) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Private beta" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/waitlist", request.url));
}

export const config = {
  // Everything except Next internals and static assets (files with an extension)
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
