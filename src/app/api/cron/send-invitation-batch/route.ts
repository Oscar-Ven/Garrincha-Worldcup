import { NextRequest, NextResponse } from "next/server";
import { processSendBatch } from "@/lib/import/invitation-batch";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processSendBatch();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron:send-invitation-batch]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
