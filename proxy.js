import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "d60155b93198cdce275efee6b4a242c75a4dc372e9a2be74cfd34208a546ccf9"
);

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const userToken = request.cookies.get("session_token")?.value;
  const adminToken = request.cookies.get("admin_session_token")?.value;

  // 1. Admin Pages protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/auth")) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/auth/login", request.url));
    }
    try {
      await jwtVerify(adminToken, JWT_SECRET);
      // Admin session is verified
    } catch (e) {
      const res = NextResponse.redirect(new URL("/admin/auth/login", request.url));
      res.cookies.delete("admin_session_token");
      return res;
    }
  }

  // 2. Customer Pages protection
  if (pathname.startsWith("/dashboard")) {
    if (!userToken) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    try {
      await jwtVerify(userToken, JWT_SECRET);
      // Customer session is verified
    } catch (e) {
      const res = NextResponse.redirect(new URL("/auth/login", request.url));
      res.cookies.delete("session_token");
      return res;
    }
  }

  // 3. Prevent logged-in admins from visiting admin auth page
  if (pathname === "/admin/auth/login" && adminToken) {
    try {
      await jwtVerify(adminToken, JWT_SECRET);
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } catch (e) {
      // Clean stale token
      const res = NextResponse.next();
      res.cookies.delete("admin_session_token");
      return res;
    }
  }

  // 4. Prevent logged-in users from visiting customer auth pages
  if ((pathname === "/auth/login" || pathname === "/auth/register") && userToken) {
    try {
      await jwtVerify(userToken, JWT_SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (e) {
      // Clean stale token
      const res = NextResponse.next();
      res.cookies.delete("session_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*", "/auth/login", "/auth/register"],
};
