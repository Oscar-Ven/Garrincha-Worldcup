import { NextResponse } from "next/server";

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function rejectCrossOriginRequest(request: Request) {
  if (isSameOriginRequest(request)) return null;
  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}

/**
 * Returns the real client IP address.
 * Prefers x-real-ip (set by Vercel/Nginx edge) over x-forwarded-for,
 * which can be spoofed in setups without a trusted proxy.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip")?.trim() ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
