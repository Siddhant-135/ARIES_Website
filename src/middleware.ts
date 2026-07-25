import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Soft gate for /admin/editor — requires aries_session cookie from AuthContext. */
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin/editor")) {
    return NextResponse.next();
  }
  const session = req.cookies.get("aries_session");
  if (!session?.value) {
    const login = new URL("/admin", req.url);
    login.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/editor/:path*"],
};
