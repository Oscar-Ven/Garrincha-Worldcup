import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { FinalScoreForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminMatchesPage() {
  const locale = await getLocale();
  let admin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try { admin = await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin/matches"); }
  }

  const matches = hasDatabaseConfig()
    ? await prisma.match.findMany({
        orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
        include: { homeTeam: true, awayTeam: true },
      })
    : demoMatches;

  const isSuperAdmin = !admin || admin.role === "SUPER_ADMIN" || !hasDatabaseConfig();

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <AdminSidebar
        active="/admin/matches"
        isSuperAdmin={isSuperAdmin}
        centerName={admin?.center?.name}
        adminName={admin?.fullName ?? admin?.displayName ?? undefined}
      />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">{isSuperAdmin ? "Super Admin" : `Center Admin · ${admin?.center?.name}`}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.scoreTitle")}</h1>
          </div>
        </header>
        <div className="admin-content">
          <DataModeNotice locale={locale} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(245,194,66,0.07)", border: "1px solid rgba(245,194,66,0.25)", fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            {t(locale, "admin.scoreWarning")}
          </div>

          {matches.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-faint)" }}>{t(locale, "dashboard.empty")}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matches.map((match) => {
              const hasScore = match.homeScore !== null && match.awayScore !== null;
              const kickoff = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(match.kickoffAt instanceof Date ? match.kickoffAt : new Date(String(match.kickoffAt)));
              const homeTeam = "homeTeam" in match ? (match as { homeTeam: { name: string }; awayTeam: { name: string } }).homeTeam.name : "Home";
              const awayTeam = "awayTeam" in match ? (match as { homeTeam: { name: string }; awayTeam: { name: string } }).awayTeam.name : "Away";
              return (
                <div key={match.id} className="acard">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <span className="label" style={{ fontSize: 9.5, color: "var(--ink-faint)" }}>{match.stage} · #{match.fifaMatchNo ?? "–"}</span>
                    <span className="apill" style={{ background: hasScore ? "rgba(95,224,144,0.14)" : "rgba(245,194,66,0.15)", color: hasScore ? "var(--green)" : "var(--gold)", fontSize: 10, padding: "4px 10px" }}>
                      {hasScore ? t(locale, "match.completed") : t(locale, "admin.needsScore")}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span className="disp" style={{ fontSize: 18, color: "var(--ink)" }}>{homeTeam}</span>
                    <div style={{ textAlign: "center" }}>
                      {hasScore ? (
                        <span className="num" style={{ fontSize: 24, color: "var(--gold)" }}>{match.homeScore} : {match.awayScore}</span>
                      ) : (
                        <span className="num" style={{ fontSize: 14, color: "var(--ink-faint)" }}>{kickoff}</span>
                      )}
                    </div>
                    <span className="disp" style={{ fontSize: 18, color: "var(--ink)" }}>{awayTeam}</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                    <div className="label" style={{ fontSize: 9, color: "var(--green)", marginBottom: 10 }}>{t(locale, "admin.finalScore")}</div>
                    <FinalScoreForm matchId={match.id} homeScore={match.homeScore} awayScore={match.awayScore} locale={locale} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
