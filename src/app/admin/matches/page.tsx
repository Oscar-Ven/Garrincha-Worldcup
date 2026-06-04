import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FinalScoreForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminMatchesPage() {
  const locale = await getLocale();
  if (hasDatabaseConfig()) {
    try { await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin/matches"); }
  }

  const matches = hasDatabaseConfig()
    ? await prisma.match.findMany({
        orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
        include: { homeTeam: true, awayTeam: true },
      })
    : demoMatches;

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <aside className="admin-side">
        <div className="admin-side-top">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
          <span className="admin-side-tag">ADMIN</span>
        </div>
        <nav className="admin-side-nav">
          <Link href="/admin" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">▦</span>Overview</Link>
          <Link href="/admin/matches" className="admin-nav-link active" style={{ textDecoration: "none" }}><span className="admin-nav-ic">✏️</span>{t(locale, "admin.scoreTitle")}</Link>
          <Link href="/admin/bonus" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">🎁</span>{t(locale, "admin.bonusTitle")}</Link>
          <Link href="/admin/checkin" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">📱</span>{t(locale, "admin.checkinTitle")}</Link>
        </nav>
        <div className="admin-side-foot">
          <Link href="/admin" style={{ fontSize: 13, color: "var(--ink-dim)", textDecoration: "none" }}>← Back</Link>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">{t(locale, "auth.adminEyebrow")}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.scoreTitle")}</h1>
          </div>
        </header>
        <div className="admin-content">
          <DataModeNotice locale={locale} />
          {/* Warning */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(245,194,66,0.07)", border: "1px solid rgba(245,194,66,0.25)", fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            {t(locale, "admin.scoreWarning")}
          </div>

          {/* Match list */}
          {matches.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-faint)" }}>{t(locale, "dashboard.empty")}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matches.map((match) => {
              const hasScore = match.homeScore !== null && match.awayScore !== null;
              const kickoff = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(match.kickoffAt);
              const homeTeam = "homeTeam" in match ? (match as { homeTeam: { name: string }; awayTeam: { name: string } }).homeTeam.name : "Home";
              const awayTeam = "awayTeam" in match ? (match as { homeTeam: { name: string }; awayTeam: { name: string } }).awayTeam.name : "Away";
              return (
                <div key={match.id} className="acard">
                  {/* stage + status */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span className="label" style={{ fontSize: 9.5, color: "var(--ink-faint)" }}>{match.stage} · #{match.fifaMatchNo ?? "–"}</span>
                    <span className="apill" style={{ background: hasScore ? "rgba(95,224,144,0.14)" : "rgba(245,194,66,0.15)", color: hasScore ? "var(--green)" : "var(--gold)", fontSize: 10, padding: "4px 10px" }}>
                      {hasScore ? t(locale, "match.completed") : t(locale, "admin.needsScore")}
                    </span>
                  </div>
                  {/* teams */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span className="disp" style={{ fontSize: 18, color: "var(--ink)" }}>{homeTeam}</span>
                    <div style={{ textAlign: "center" }}>
                      {hasScore ? (
                        <span className="num" style={{ fontSize: 24, color: "var(--gold)" }}>{match.homeScore} : {match.awayScore}</span>
                      ) : (
                        <span className="num" style={{ fontSize: 18, color: "var(--ink-faint)" }}>{kickoff}</span>
                      )}
                    </div>
                    <span className="disp" style={{ fontSize: 18, color: "var(--ink)" }}>{awayTeam}</span>
                  </div>
                  {/* score entry */}
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
