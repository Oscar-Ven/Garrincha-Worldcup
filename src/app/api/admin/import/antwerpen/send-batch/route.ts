import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { processSendBatch } from "@/lib/import/invitation-batch";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const result = await processSendBatch();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/import/antwerpen/send-batch]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
