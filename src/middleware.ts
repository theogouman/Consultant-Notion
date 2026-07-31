import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/modules/booking/lib/admin-auth";

/**
 * Protège /admin par cookie signé (§8). Toute route /admin hors /admin/login
 * exige une session valide, sinon redirection vers /admin/login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // La page de login reste accessible.
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const valid = secret ? await verifySessionToken(secret, token) : false;

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
