import { redirect } from "next/navigation";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireSuperAdmin } from "@/lib/auth";
import { getHealthReport, type HealthCheck, type HealthStatus } from "@/lib/health";
import { getLocale } from "@/lib/i18n";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "badge green";
    case "warning":
      return "badge points";
    case "error":
      return "badge red";
    case "unconfigured":
    default:
      return "badge locked";
  }
}

function statusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    case "unconfigured":
      return "Unconfigured";
  }
}

// Derive a rough category from the check label so we can group checks visually.
const CATEGORY_ORDER = [
  "App",
  "Database",
  "Email",
  "Redis",
  "Vercel",
  "Monitoring",
  "Football API",
  "Security",
  "Other",
] as const;

type Category = (typeof CATEGORY_ORDER)[number];

function categorise(check: HealthCheck): Category {
  const l = check.label.toLowerCase();
  if (
    l.includes("next.js") ||
    l.includes("preview") ||
    l.includes("app url")
  )
    return "App";
  if (
    l.includes("database") ||
    l.includes("centers seeded") ||
    l.includes("matches seeded") ||
    l.includes("owner account") ||
    l.includes("center admin") ||
    l.includes("players registered") ||
    l.includes("predictions submitted")
  )
    return "Database";
  if (
    l.includes("resend") ||
    l.includes("email")
  )
    return "Email";
  if (l.includes("upstash") || l.includes("redis") || l.includes("rate limit"))
    return "Redis";
  if (l.includes("vercel") || l.includes("deployment") || l.includes("deploy url") || l.includes("environment"))
    return "Vercel";
  if (l.includes("sentry"))
    return "Monitoring";
  if (l.includes("football") || l.includes("provider"))
    return "Football API";
  if (
    l.includes("jwt") ||
    l.includes("owner password") ||
    l.includes("center admin password") ||
    l.includes("csrf") ||
    l.includes("security")
  )
    return "Security";
  return "Other";
}

function groupChecks(checks: HealthCheck[]): Map<Category, HealthCheck[]> {
  const map = new Map<Category, HealthCheck[]>();
  for (const cat of CATEGORY_ORDER) {
    map.set(cat, []);
  }
  for (const check of checks) {
    const cat = categorise(check);
    map.get(cat)!.push(check);
  }
  // Remove empty categories
  for (const [cat, items] of map) {
    if (items.length === 0) map.delete(cat);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminHealthPage() {
  const locale = await getLocale();

  // Access control — super admin only.
  if (hasDatabaseConfig()) {
    try {
      await requireSuperAdmin();
    } catch {
      redirect("/admin/login?next=/admin/health");
    }
  }

  // In preview/demo mode we cannot run most DB checks, so we show a notice
  // and only run the env-var checks (the ones that don't touch the DB).
  const isLive = hasDatabaseConfig();

  let report = await getHealthReport();

  // In demo mode, filter out DB-dependent checks so the page stays useful
  // without a real database.
  if (!isLive) {
    report = {
      ...report,
      checks: report.checks.filter(
        (c) => categorise(c) !== "Database"
      ),
    };
  }

  const grouped = groupChecks(report.checks);

  const formattedAt = new Date(report.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (
    <main className="page">
      <DataModeNotice locale={locale} />

      {!isLive && (
        <div className="notice" role="status">
          Health dashboard requires a live database. Database checks are hidden
          in preview/demo mode. Environment variable checks are still shown.
        </div>
      )}

      <section className="page-header">
        <span className="eyebrow">Super Admin only</span>
        <h1>System Health Dashboard</h1>
        <p className="muted">Generated at {formattedAt}</p>
      </section>

      <div className="action-row" style={{ marginBottom: "1.5rem" }}>
        <a className="button" href="/admin/health">
          Refresh
        </a>
        <a className="button" href="/admin">
          Back to Admin
        </a>
      </div>

      {Array.from(grouped.entries()).map(([category, checks]) => (
        <section key={category} style={{ marginBottom: "2rem" }}>
          <div className="section-title">
            <h2>{category}</h2>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "120px" }}>Status</th>
                    <th>Check</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((check) => (
                    <tr key={check.label}>
                      <td>
                        <span className={statusBadgeClass(check.status)}>
                          {statusLabel(check.status)}
                        </span>
                      </td>
                      <td>
                        <strong>{check.label}</strong>
                      </td>
                      <td className="muted">
                        {check.detail ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
