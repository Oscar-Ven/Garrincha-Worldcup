import { DataModeNotice } from "@/components/DataModeNotice";
import { NationalityFlag } from "@/components/Flag";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { prisma } from "@/lib/prisma";
import { t, type Locale } from "@/lib/translations";
import { demoCenters, demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";

type LeaderboardRow = Awaited<ReturnType<typeof getLeaderboardWithMeta>>["rows"][number];

export default async function LeaderboardsPage() {
  const locale = await getLocale();
  const hasDb = hasDatabaseConfig();
  const [leaderboardMeta, centers, nationalities] = hasDb
    ? await Promise.all([
        getLeaderboardWithMeta(),
        prisma.garrinchaCenter.findMany({ orderBy: { name: "asc" } }),
        prisma.user.findMany({
          distinct: ["nationality"],
          where: { nationality: { not: null } },
          select: { nationality: true },
          orderBy: { nationality: "asc" },
        }),
      ])
    : [
        { rows: demoLeaderboard, total: demoLeaderboard.length, limited: false, limit: 200 },
        demoCenters,
        Array.from(new Set(demoLeaderboard.map((r) => r.nationality))).map((nationality) => ({ nationality })),
      ];

  const global = leaderboardMeta.rows as LeaderboardRow[];
  const nationalSections = hasDb
    ? await Promise.all(
        nationalities.map(async (item) => ({
          nationality: item.nationality,
          meta: item.nationality
            ? await getLeaderboardWithMeta({ nationality: item.nationality })
            : { rows: [], total: 0, limited: false, limit: 200 },
        })),
      )
    : nationalities.map((item) => ({
        nationality: item.nationality,
        meta: {
          rows: demoLeaderboard.filter((row) => row.nationality === item.nationality),
          total: demoLeaderboard.filter((row) => row.nationality === item.nationality).length,
          limited: false,
          limit: 200,
        },
      }));
  const centerSections = hasDb
    ? await Promise.all(
        centers.map(async (center) => ({
          center,
          meta: await getLeaderboardWithMeta({ competitionCenterId: center.id }),
        })),
      )
    : centers.map((center) => ({
        center,
        meta: {
          rows: demoLeaderboard.filter((row) => row.center === center.name),
          total: demoLeaderboard.filter((row) => row.center === center.name).length,
          limited: false,
          limit: 200,
        },
      }));

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "leaderboard.eyebrow")}</span>
        <h1>{t(locale, "leaderboard.title")}</h1>
        <p>{t(locale, "leaderboard.copy")}</p>
      </section>
      <section className="section-title">
        <h2>{t(locale, "leaderboard.global")}</h2>
      </section>
      <Leaderboard rows={global} locale={locale} />
      <section className="section-title">
        <h2>{t(locale, "leaderboard.national")}</h2>
      </section>
      <div className="grid two">
        {nationalSections.map((item) =>
          item.nationality ? (
            <section className="card" key={item.nationality}>
              <h3>{item.nationality}</h3>
              <Leaderboard rows={item.meta.rows as LeaderboardRow[]} compact locale={locale} />
            </section>
          ) : null,
        )}
      </div>
      <section className="section-title">
        <h2>{t(locale, "leaderboard.centers")}</h2>
      </section>
      <div className="grid two">
        {centerSections.map(({ center, meta }) => (
          <section className="card" key={center.id}>
            <h3>{center.name}</h3>
            <p className="muted">
              {center.city}, {center.country}
            </p>
            <Leaderboard rows={meta.rows as LeaderboardRow[]} compact locale={locale} />
          </section>
        ))}
      </div>
      {leaderboardMeta.limited ? (
        <p className="muted" style={{ textAlign: "center", padding: "1rem" }}>
          Showing top {leaderboardMeta.limit} of {leaderboardMeta.total} players.
        </p>
      ) : null}
    </main>
  );
}

function Leaderboard({
  rows,
  compact = false,
  locale,
}: {
  rows: LeaderboardRow[];
  compact?: boolean;
  locale: Locale;
}) {
  return (
    <div className={compact ? "" : "card"}>
      {rows.length === 0 ? <div className="empty-state">{t(locale, "leaderboard.noPlayers")}</div> : null}
      <div className="table-wrap mobile-cards">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t(locale, "table.player")}</th>
              {!compact ? <th>{t(locale, "table.center")}</th> : null}
              {!compact ? <th>{t(locale, "form.nationality")}</th> : null}
              <th>{t(locale, "table.points")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>
                  <span className="rank-cell">
                    <span className={`rank-medal top-${index + 1}`}>{index + 1}</span>
                  </span>
                </td>
                <td><strong>{row.name}</strong></td>
                {!compact ? <td>{row.center}</td> : null}
                {!compact ? <td><span className="flag-label"><NationalityFlag nationality={row.nationality} />{row.nationality}</span></td> : null}
                <td><strong>{row.points}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="leaderboard-cards">
        {rows.map((row, index) => (
          <article className="card" key={row.id}>
            <span className="rank-cell">
              <span className={`rank-medal top-${index + 1}`}>{index + 1}</span>
              <strong>{row.name}</strong>
            </span>
            <p className="muted flag-label"><NationalityFlag nationality={row.nationality} />{row.center} - {row.nationality}</p>
            <span className="badge gold">{row.points} pts</span>
          </article>
        ))}
      </div>
    </div>
  );
}
