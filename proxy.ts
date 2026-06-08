import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/server/session";

const SESSION_COOKIE = "mct_session";

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  // A session is valid only if the cookie carries a valid HMAC signature.
  const isAuthed = Boolean(await verifySession(cookie?.value));

  // Protect private routes under /dashboard.
  if (pathname.startsWith("/dashboard") && !isAuthed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Send already-authenticated users away from the login page.
  if (pathname === "/" && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on dashboard and root login pages, ignoring static assets and API routes.
  matcher: ["/", "/dashboard/:path*"],
};
