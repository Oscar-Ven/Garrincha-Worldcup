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
    <div className="manager-shell">
      <AdminSidebar
        active="/admin/matches"
        isSuperAdmin={isSuperAdmin}
        centerName={admin?.center?.name}
        adminName={admin?.fullName ?? admin?.displayName ?? undefined}
      />

      <main className="manager-main">
        <header className="manager-topbar">
          <div>
            <div className="manager-topbar-crumb">
              {isSuperAdmin ? "Platform Owner" : `Center Manager · ${admin?.center?.name}`}
            </div>
            <h1 className="manager-topbar-title">{t(locale, "admin.scoreTitle")}</h1>
          </div>
        </header>

        <div className="manager-content">
          <DataModeNotice locale={locale} />

          <div className="manager-notice manager-notice--amber">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10 3L2 17h16L10 3z" strokeLinejoin="round" />
              <path d="M10 9v4M10 14.5v.5" strokeLinecap="round" />
            </svg>
            <span>{t(locale, "admin.scoreWarning")}</span>
          </div>

          {matches.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-4)" }}>
              {t(locale, "dashboard.empty")}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {matches.map((match) => {
              const hasScore = match.homeScore !== null && match.awayScore !== null;
              const kickoff = new Intl.DateTimeFormat("en-GB", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "Europe/Brussels",
              }).format(match.kickoffAt instanceof Date ? match.kickoffAt : new Date(String(match.kickoffAt)));
              const homeTeam = "homeTeam" in match
                ? (match as { homeTeam: { name: string }; awayTeam: { name: string } }).homeTeam.name
                : "Home";
              const awayTeam = "awayTeam" in match
                ? (match as { homeTeam: { name: string }; awayTeam: { name: string } }).awayTeam.name
                : "Away";

              return (
                <div key={match.id} className="mcard">
                  {/* Match header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>
                      {match.stage} · #{match.fifaMatchNo ?? "–"}
                    </span>
                    <span className={`mbadge ${hasScore ? "mbadge-green" : "mbadge-amber"}`}>
                      {hasScore ? t(locale, "match.completed") : t(locale, "admin.needsScore")}
                    </span>
                  </div>

                  {/* Teams + score */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "normal", fontWeight: 800, fontSize: 18, color: "var(--green-deep)" }}>
                      {homeTeam}
                    </span>
                    <div style={{ textAlign: "center" }}>
                      {hasScore ? (
                        <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 22, fontWeight: 800, color: "var(--gold)" }}>
                          {match.homeScore} : {match.awayScore}
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--text-3)" }}>{kickoff}</span>
                      )}
                    </div>
                    <span style={{ fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "normal", fontWeight: 800, fontSize: 18, color: "var(--green-deep)" }}>
                      {awayTeam}
                    </span>
                  </div>

                  {/* Score entry */}
                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--green)", marginBottom: 10 }}>
                      {t(locale, "admin.finalScore")}
                    </div>
                    <FinalScoreForm
                      matchId={match.id}
                      homeScore={match.homeScore}
                      awayScore={match.awayScore}
                      locale={locale}
                    />
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
