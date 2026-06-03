import { NextResponse } from "next/server";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { isLocale } from "@/lib/translations";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

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
