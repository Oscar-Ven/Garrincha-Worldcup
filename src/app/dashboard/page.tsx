import { redirect } from "next/navigation";
import CompetitionCenterSelect from "@/components/CompetitionCenterSelect";
import { DataModeNotice } from "@/components/DataModeNotice";
import { MatchFilter } from "@/components/MatchFilter";
import type { FilterableMatch } from "@/components/MatchFilter";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getLeaderboard } from "@/lib/leaderboards";
import { getMatchesForUser } from "@/lib/matches";
import { isPredictionLocked } from "@/lib/scoring";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, demoUser, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const isDemo = !hasDatabaseConfig();

  const [matches, leaderboard, centers] = isDemo
    ? [demoMatches, demoLeaderboard, demoCenters]
    : await Promise.all([
        getMatchesForUser(user.id),
        getLeaderboard(),
        prisma.garrinchaCenter.findMany({
          orderBy: [{ country: "asc" }, { city: "asc" }],
          select: { id: true, name: true, city: true, country: true },
        }),
      ]);

  const now = new Date();
  const nowISO = now.toISOString();

  const serializedMatches: FilterableMatch[] = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    fifaMatchNo: m.fifaMatchNo ?? null,
    venue: m.venue,
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      fifaCode: m.homeTeam.fifaCode ?? null,
      flagUrl: m.homeTeam.flagUrl ?? null,
      groupName: m.homeTeam.groupName ?? null,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      fifaCode: m.awayTeam.fifaCode ?? null,
      flagUrl: m.awayTeam.flagUrl ?? null,
      groupName: m.awayTeam.groupName ?? null,
    },
    predictions: (m.predictions ?? []).map((p) => ({
      id: p.id,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      pointsAwarded: p.pointsAwarded,
    })),
  }));

  const predictedMatches = matches.filter((m) => (m.predictions?.length ?? 0) > 0);
  const lockedMatches = matches.filter((m) => isPredictionLocked(m.kickoffAt, now));
  const userRank = leaderboard.findIndex((row) => row.id === user.id) + 1;
  const userPoints = leaderboard.find((row) => row.id === user.id)?.points ?? 0;

  const hasCompetitionCenter = isDemo || !!user.competitionCenterId;
  const competitionCenterName = isDemo
    ? user.center.name
    : user.competitionCenter?.name ?? null;
  const competitionCenterLocked = isDemo ? false : !!user.competitionCenterLockedAt;

  const activationCenterName = user.center.name;

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "dashboard.eyebrow")}</span>
        <h1>{t(locale, "dashboard.title")}</h1>
        <p>{t(locale, "dashboard.copy", { center: activationCenterName })}</p>
      </section>

      {/* Activation status notice */}
      <section className="dashboard-notice dashboard-notice--activation">
        <span>First activation at <strong>{activationCenterName}</strong></span>
      </section>

      {/* Remote access notice */}
      <section className="dashboard-notice dashboard-notice--remote">
        <span>Remote access enabled. Use your personal email link anytime.</span>
      </section>

      {/* Competition center selection or status */}
      {!hasCompetitionCenter ? (
        <section className="dashboard-competition-center-select">
          <CompetitionCenterSelect
            centers={centers}
            activationCenterName={activationCenterName}
          />
        </section>
      ) : (
        <section className="dashboard-notice dashboard-notice--competition-center">
          <span>
            You are representing <strong>{competitionCenterName}</strong>.
          </span>
          {competitionCenterLocked && (
            <span className="dashboard-notice__lock">
              {" "}Your center is locked after your first prediction.
            </span>
          )}
        </section>
      )}

      <section className="dashboard-callout">
        <strong>{t(locale, "dashboard.ruleStrong")}</strong>
        <span>{t(locale, "dashboard.rule")}</span>
      </section>
      <section className="grid four">
        <article className="stat-card">
          <span className="muted">{t(locale, "dashboard.totalPoints")}</span>
          <strong className="stat-value">{userPoints}</strong>
        </article>
        <article className="stat-card">
          <span className="muted">{t(locale, "dashboard.globalRank")}</span>
          <strong className="stat-value">{userRank || "–"}</strong>
        </article>
        <article className="stat-card">
          <span className="muted">{t(locale, "dashboard.myPredictions")}</span>
          <strong className="stat-value">{predictedMatches.length}</strong>
        </article>
        <article className="stat-card">
          <span className="muted">{t(locale, "dashboard.lockedMatches")}</span>
          <strong className="stat-value">{lockedMatches.length}</strong>
        </article>
      </section>
      <section className="section-title compact-title">
        <div>
          <h2>{t(locale, "dashboard.section")}</h2>
          <p className="muted">{t(locale, "dashboard.sectionCopy")}</p>
        </div>
      </section>
      <MatchFilter matches={serializedMatches} locale={locale} nowISO={nowISO} />
    </main>
  );
}
