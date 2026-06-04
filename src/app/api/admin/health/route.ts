import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { getHealthReport } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
    const report = await getHealthReport();
    return NextResponse.json({ report }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Health check failed." }, { status: 500 });
  }
}
