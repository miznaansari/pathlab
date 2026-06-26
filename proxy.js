import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "d60155b93198cdce275efee6b4a242c75a4dc372e9a2be74cfd34208a546ccf9"
);

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session_token")?.value;

  // 1. Admin Pages protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/auth")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/auth/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.roleId !== 1) {
        return NextResponse.redirect(new URL("/admin/auth/login?error=unauthorized", request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL("/admin/auth/login", request.url));
    }
  }

  // 2. Customer Pages protection
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // 3. Prevent logged-in users from visiting auth pages
  if (
    (pathname === "/auth/login" || pathname === "/auth/register" || pathname === "/admin/auth/login") &&
    token
  ) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.roleId === 1) {
        return NextResponse.redirect(new URL("/admin/userApprove", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (e) {
      const res = NextResponse.next();
      res.cookies.delete("session_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/login", "/auth/register"],
};
