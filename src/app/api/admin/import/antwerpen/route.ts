import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import {
  runAntwerpenImport,
  type ImportFileOverride,
} from "@/lib/import/player-import-runner";

// Allow up to 60 s on Vercel Pro — large imports + bulk inserts take time
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

  // Accept an optional CSV/Excel file upload via multipart/form-data.
  // If no file is uploaded, the runner falls back to the local filesystem.
  let override: ImportFileOverride | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Failed to parse form data." },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const fileName = file.name.toLowerCase();
      const isCsv = fileName.endsWith(".csv");
      const isExcel =
        fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      if (!isCsv && !isExcel) {
        return NextResponse.json(
          { error: "Only CSV (.csv) and Excel (.xlsx / .xls) files are accepted." },
          { status: 400 },
        );
      }
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File is too large (max 20 MB)." },
          { status: 400 },
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      override = {
        buffer: Buffer.from(arrayBuffer),
        isCsv,
        fileName: file.name,
      };
    }
  }

  try {
    const report = await runAntwerpenImport(override);
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
