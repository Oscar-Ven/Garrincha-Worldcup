import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { isLocale } from "@/lib/translations";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!(await checkRateLimit(`locale:${ip}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = (await request.json()) as { locale?: string };
  if (!isLocale(body.locale)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("garrincha_locale", body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
