import { NextResponse, type NextRequest } from "next/server";
import { BETA_COOKIE, betaCookieValue, betaGateEnabled } from "@/lib/beta";

/**
 * Private-beta wall: with BETA_PASSCODE set, every route — pages and APIs —
 * requires the signed beta cookie. Only the waitlist page and its API are
 * public, so no deep link lands past the wall.
 *
 * Better Auth Infrastructure calls /api/auth/dash/* with a JWT (no cookie) when
 * you connect or update a project in their dashboard — those routes stay open.
 */
function isBetaPublicPath(pathname: string): boolean {
  if (pathname === "/waitlist" || pathname === "/api/waitlist") return true;
  if (pathname === "/api/auth/dash" || pathname.startsWith("/api/auth/dash/")) {
    return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  if (!betaGateEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isBetaPublicPath(pathname)) {
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
