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
