import { redirect } from "next/navigation";
import { FinalScoreForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { TeamFlag } from "@/components/Flag";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminMatchesPage() {
  const locale = await getLocale();
  if (hasDatabaseConfig()) {
    try {
      await requireAdmin();
    } catch {
      redirect("/admin/login?next=/admin/matches");
    }
  }

  const matches = hasDatabaseConfig()
    ? await prisma.match.findMany({
        orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
        include: { homeTeam: true, awayTeam: true },
      })
    : demoMatches;

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "auth.adminEyebrow")}</span>
        <h1>{t(locale, "admin.scoreTitle")}</h1>
        <p>{t(locale, "admin.scoreCopy")}</p>
      </section>
      <div className="admin-warning">
        {t(locale, "admin.scoreWarning")}
      </div>
      <div className="match-list">
        {matches.map((match) => (
          <article className="card match-card" key={match.id}>
            <div className="match-meta">
              <span className={match.homeScore === null ? "badge gold" : "badge green"}>
                {match.homeScore === null ? t(locale, "admin.needsScore") : t(locale, "match.completed")}
              </span>
              <strong className="match-number">#{match.fifaMatchNo ?? "-"}</strong>
              <p className="muted">{match.status}</p>
            </div>
            <div className="teams">
              <div className="team-line">
                <TeamFlag team={match.homeTeam} />
                <strong>{match.homeTeam.name}</strong>
              </div>
              <div className="team-line">
                <TeamFlag team={match.awayTeam} />
                <strong>{match.awayTeam.name}</strong>
              </div>
              <p className="muted">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(match.kickoffAt)}
              </p>
              {match.homeScore !== null && match.awayScore !== null ? (
                <span className="badge green">{t(locale, "admin.currentFinal")}: {match.homeScore} - {match.awayScore}</span>
              ) : null}
            </div>
            <div className="prediction-panel">
              <span className="muted">{t(locale, "admin.finalScore")}</span>
              <FinalScoreForm matchId={match.id} homeScore={match.homeScore} awayScore={match.awayScore} locale={locale} />
            </div>
          </article>
        ))}
        {matches.length === 0 ? <div className="empty-state">{t(locale, "dashboard.empty")}</div> : null}
      </div>
    </main>
  );
}
