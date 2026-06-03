import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { rejectCrossOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}
