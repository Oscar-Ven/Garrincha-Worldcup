import { NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireSuperAdmin } from "@/lib/auth";
import { getHealthReport } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
    const report = await getHealthReport();
    return NextResponse.json({ report }, { status: 200 });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (
      error instanceof Error &&
      (error.message?.toLowerCase().includes("unauthorized") ||
        error.message?.toLowerCase().includes("forbidden") ||
        error.message?.toLowerCase().includes("super_admin") ||
        error.message?.toLowerCase().includes("superadmin"))
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Health check failed." },
      { status: 500 }
    );
  }
}
