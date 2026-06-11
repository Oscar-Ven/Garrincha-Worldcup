import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { runAntwerpenImport } from "@/lib/import/player-import-runner";

// Allow up to 60 s on Vercel Pro — large imports + email dispatch take time
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  try {
    const report = await runAntwerpenImport();
    return NextResponse.json(report);
  } catch (err) {
    console.error("[admin/import/antwerpen]", err);
    return NextResponse.json(
      {
        error: "Import failed unexpectedly.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
