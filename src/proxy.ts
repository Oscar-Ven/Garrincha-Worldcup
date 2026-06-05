import { jwtVerify, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { isPlaceholderValue, isPreviewMode } from "@/lib/app-mode";

const SESSION_COOKIE = "garrincha_session";
const encoder = new TextEncoder();

function getSecret() {
  const value = process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? "";
  return value.length >= 32 && !isPlaceholderValue(value) ? encoder.encode(value) : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = getSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Skip in preview/demo mode so the admin UI is previewable without credentials.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !isPreviewMode()) {
    if (!token || !secret) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== "ADMIN" && payload.role !== "CENTER_ADMIN" && payload.role !== "SUPER_ADMIN") {
        const url = new URL("/admin/login", request.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, secret);
      const exp = payload.exp as number;
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;

      if (exp - now < sevenDays) {
        const refreshed = await new SignJWT({ userId: payload.userId, role: payload.role })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("30d")
          .sign(secret);

        const response = NextResponse.next();
        response.cookies.set(SESSION_COOKIE, refreshed, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
        return response;
      }
    } catch {
      // Invalid token; page-level auth handles the resulting unauthenticated state.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/leaderboards/:path*"],
};
