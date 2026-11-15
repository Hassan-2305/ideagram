import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth check: signed-out visitors to private areas get a real 307
 * to /login before rendering starts. This only looks for the cookie — the
 * session itself is validated server-side by requireUser() on every page and
 * by route() on every API call.
 */
export function proxy(req: NextRequest) {
  if (req.cookies.get("ig_session")?.value) return NextResponse.next();
  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/lab/:path*", "/remix/:path*", "/hackathon/:path*", "/vault/:path*", "/build/:path*", "/profile/:path*", "/settings/:path*", "/welcome/:path*"],
};
