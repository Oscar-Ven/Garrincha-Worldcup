import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { isPlaceholderValue, isPreviewMode } from "@/lib/app-mode";

const SESSION_COOKIE = "garrincha_session";
const encoder = new TextEncoder();

function getSecret() {
  const value = process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? "";
  return value.length >= 32 && !isPlaceholderValue(value) ? encoder.encode(value) : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  // Redirect any legacy /owner path to the protected /admin portal
  if (pathname.startsWith("/owner")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const secret = getSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Admin route guard — skip in preview mode so the UI is browsable without credentials
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

  // Sliding-window token refresh: renew when less than 7 days remain on a 30-day session
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

        if (firstSegment === "en" || firstSegment === "fr" || firstSegment === "nl") {
          response.cookies.set("garrincha_locale", firstSegment, {
            path: "/",
            httpOnly: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
          });
        }

        return response;
      }
    } catch {
      // Invalid/expired token — page-level auth handles the resulting state
    }
  }

  // Persist locale preference when navigating to locale-prefixed routes
  if (firstSegment === "en" || firstSegment === "fr" || firstSegment === "nl") {
    const response = NextResponse.next();
    response.cookies.set("garrincha_locale", firstSegment, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
