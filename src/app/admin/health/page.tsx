import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireSuperAdmin } from "@/lib/auth";
import { getHealthReport, type HealthCheck, type HealthStatus } from "@/lib/health";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: "var(--green)",
  warning: "var(--gold)",
  error: "var(--live)",
  unconfigured: "var(--ink-faint)",
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: "Operational",
  warning: "Degraded",
  error: "Down",
  unconfigured: "Unconfigured",
};

const CATEGORY_ORDER = ["App","Database","Email","Redis","Vercel","Render","Monitoring","Football API","Security","Other"] as const;
type Category = typeof CATEGORY_ORDER[number];

function categorise(check: HealthCheck): Category {
  const l = check.label.toLowerCase();
  if (l.includes("next") || l.includes("preview") || l.includes("app url")) return "App";
  if (l.includes("database") || l.includes("seeded") || l.includes("owner account") || l.includes("center admin") || l.includes("players reg") || l.includes("predictions")) return "Database";
  if (l.includes("resend") || l.includes("email")) return "Email";
  if (l.includes("upstash") || l.includes("redis") || l.includes("rate limit")) return "Redis";
  if (l.includes("vercel") || l.includes("main app host") || l.includes("deploy url") || l.includes("environment")) return "Vercel";
  if (l.includes("render")) return "Render";
  if (l.includes("sentry")) return "Monitoring";
  if (l.includes("football") || l.includes("provider")) return "Football API";
  if (l.includes("jwt") || l.includes("password") || l.includes("csrf") || l.includes("security")) return "Security";
  return "Other";
}

export default async function AdminHealthPage() {
  // getLocale needed for cookie context but locale not used in this server component
  if (hasDatabaseConfig()) {
    try { await requireSuperAdmin(); }
    catch { redirect("/admin/login?next=/admin/health"); }
  }

  let report = await getHealthReport();
  const isLive = hasDatabaseConfig();
  if (!isLive) {
    report = { ...report, checks: report.checks.filter((c) => categorise(c) !== "Database") };
  }

  const grouped = new Map<Category, HealthCheck[]>();
  for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
  for (const check of report.checks) grouped.get(categorise(check))!.push(check);
  for (const [cat, items] of grouped) if (items.length === 0) grouped.delete(cat);

  const allOk = report.checks.every((c) => c.status === "healthy");
  const okCount = report.checks.filter((c) => c.status === "healthy").length;

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      {/* sidebar */}
      <aside className="admin-side">
        <div className="admin-side-top">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
          <span className="admin-side-tag">ADMIN</span>
        </div>
        <nav className="admin-side-nav">
          <Link href="/admin" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">▦</span>Overview</Link>
          <Link href="/admin/health" className="admin-nav-link active" style={{ textDecoration: "none" }}><span className="admin-nav-ic">🩺</span>System Health</Link>
        </nav>
        <div className="admin-side-foot">
          <Link href="/admin" style={{ fontSize: 13, color: "var(--ink-dim)", textDecoration: "none" }}>← Back to Admin</Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">Super Admin only</div>
            <h1 className="admin-topbar-title">System Health</h1>
          </div>
          <div className="admin-topbar-right">
            <Link href="/admin/health" className="abtn abtn-ghost" style={{ textDecoration: "none" }}>Refresh</Link>
            <span className="admin-date-pill">{new Date(report.generatedAt).toLocaleString("en-GB", { timeStyle: "short", dateStyle: "short" })}</span>
          </div>
        </header>

        <div className="admin-content">
          {/* banner */}
          <div className="acard health-banner" style={{ borderColor: allOk ? "rgba(95,224,144,.3)" : "rgba(245,194,66,.3)", background: allOk ? "rgba(95,224,144,.06)" : "rgba(245,194,66,.06)" }}>
            <div className="health-icon" style={{ background: allOk ? "var(--green)" : "var(--gold)" }}>
              {allOk ? "✓" : "!"}
            </div>
            <div style={{ flex: 1 }}>
              <div className="disp" style={{ fontSize: 24, color: "var(--ink)" }}>{allOk ? "All systems operational" : "Minor issue detected"}</div>
              <div className="muted">{okCount}/{report.checks.length} services healthy · auto-checked every 60s</div>
            </div>
            <Link href="/admin/health" className="abtn abtn-ghost" style={{ textDecoration: "none" }}>Refresh</Link>
          </div>

          {/* service grid */}
          {Array.from(grouped.entries()).map(([category, checks]) => (
            <div key={category}>
              <div className="label" style={{ fontSize: 9.5, color: "var(--ink-dim)", margin: "4px 0 10px" }}>{category}</div>
              <div className="health-grid">
                {checks.map((svc) => {
                  const col = STATUS_COLOR[svc.status];
                  return (
                    <div key={svc.label} className="acard" style={{ padding: 14 }}>
                      <div className="svc-top">
                        <span className="svc-dot" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
                        <span className="svc-name">{svc.label}</span>
                        <span className="apill svc-pill" style={{ background: `${col}1f`, color: col, fontSize: 10, padding: "4px 9px" }}>
                          {STATUS_LABEL[svc.status]}
                        </span>
                      </div>
                      <div className="svc-desc">{svc.detail ?? ""}</div>
                      <div className="svc-foot">
                        <span className="muted">Status</span>
                        <span className="num" style={{ fontSize: 13, color: col }}>{STATUS_LABEL[svc.status]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="muted" style={{ textAlign: "center", fontSize: 12.5 }}>
            🔒 Safe status labels only — no secrets, keys or credentials are ever shown.
          </div>
        </div>
      </main>
    </div>
  );
}
