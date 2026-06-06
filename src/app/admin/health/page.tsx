import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { getHealthReport } from "@/lib/health";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminHealthPage() {
  let ownerName: string | null = null;
  if (hasDatabaseConfig()) {
    try { const owner = await requireSuperAdmin(); ownerName = owner.fullName ?? owner.displayName; }
    catch { redirect("/admin/login?next=/admin/health"); }
  }

  const report = await getHealthReport();
  const okCount = report.checks.filter((c) => c.status === "healthy").length;

  return (
    <main>
      <p>TODO: health page — {okCount}/{report.checks.length} healthy (owner: {ownerName ?? "demo"})</p>
    </main>
  );
}
