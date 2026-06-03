import { ArrowRight, CalendarClock, Gift, Medal, QrCode, ShieldCheck, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { DataModeNotice } from "@/components/DataModeNotice";
import { NationalityFlag } from "@/components/Flag";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";

type LeaderboardRow = Awaited<ReturnType<typeof getLeaderboardWithMeta>>["rows"][number];
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function HomePage() {
  const locale = await getLocale();
  const [matchCount, centerCount, leaders] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.match.count(),
        prisma.garrinchaCenter.count(),
        getLeaderboardWithMeta().then((m) => m.rows),
      ])
    : ([demoMatches.length, demoCenters.length, demoLeaderboard] as [number, number, LeaderboardRow[]]);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="eyebrow">{t(locale, "hero.eyebrow")}</span>
            <GarrinchaLogo />
            <h1>{t(locale, "hero.title")}</h1>
            <p>{t(locale, "hero.copy")}</p>
            <div className="hero-actions">
              <Link className="button primary" href="/register">
                {t(locale, "hero.register")} <ArrowRight size={16} aria-hidden />
              </Link>
              <Link className="button" href="/login">{t(locale, "hero.login")}</Link>
              <Link className="button dark" href="/leaderboards">{t(locale, "hero.leaderboard")}</Link>
            </div>
            <div className="hero-panel">
              <span className="badge gold">{matchCount} {t(locale, "hero.matches")}</span>
              <span className="badge gold">{centerCount} {t(locale, "hero.centers")}</span>
              <span className="badge gold">{t(locale, "hero.lock")}</span>
            </div>
          </div>
          <aside className="poster-card" aria-label="Campaign poster preview">
            <span className="poster-kicker">{t(locale, "poster.kicker")}</span>
            <strong>{t(locale, "poster.title")}</strong>
            <div className="poster-scoreline">
              <span>🇧🇪</span>
              <b>2</b>
              <em>-</em>
              <b>1</b>
              <span>🇧🇷</span>
            </div>
            <p>{t(locale, "poster.subtitle")}</p>
          </aside>
        </div>
      </section>
      <main className="page">
        <DataModeNotice locale={locale} />
        <section className="campaign-strip">
          <div className="campaign-logo-slot">
            <div className="campaign-monogram" aria-hidden>G</div>
            <GarrinchaLogo compact />
            <strong>World Cup Pronostiek</strong>
            <span className="badge dark">2026</span>
          </div>
          <div className="campaign-copy">
            <span className="eyebrow">{t(locale, "hero.eyebrow")} · {t(locale, "campaign.challenge")}</span>
            <h2>{t(locale, "campaign.title")}</h2>
            <p className="muted">{t(locale, "campaign.copy")}</p>
          </div>
        </section>
        <section className="grid two campaign-info-grid">
          <article className="card prize-card">
            <Gift aria-hidden />
            <span className="eyebrow">{t(locale, "campaign.prizes")}</span>
            <h2>{t(locale, "campaign.prizeTitle")}</h2>
            <p className="muted">{t(locale, "campaign.prizeCopy")}</p>
            <p className="muted" style={{ fontWeight: 700 }}>{t(locale, "campaign.freeParticipation")}</p>
            <div className="prize-tiers">
              <div className="prize-tier">
                <span className="prize-medal" style={{ background: "var(--gold)", color: "var(--black)" }}>1</span>
                <span className="prize-tier-label">{t(locale, "campaign.prize1")}</span>
                <span className="prize-tier-value">{t(locale, "campaign.prizeValue")}</span>
              </div>
              <div className="prize-tier">
                <span className="prize-medal" style={{ background: "var(--silver)", color: "var(--black)" }}>2</span>
                <span className="prize-tier-label">{t(locale, "campaign.prize2")}</span>
                <span className="prize-tier-value">{t(locale, "campaign.prizeValue")}</span>
              </div>
              <div className="prize-tier">
                <span className="prize-medal" style={{ background: "var(--bronze)", color: "white" }}>3</span>
                <span className="prize-tier-label">{t(locale, "campaign.prize3")}</span>
                <span className="prize-tier-value">{t(locale, "campaign.prizeValue")}</span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
              📅 {t(locale, "campaign.prizeDeadline")}
            </p>
          </article>
          <article className="card qr-card">
            <div className="qr-placeholder" aria-label="QR code — coming soon">
              <div className="qr-grid" aria-hidden>
                {Array.from({ length: 49 }).map((_, i) => (
                  <span key={i} className={`qr-cell ${[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,22,29,36].includes(i) ? "on" : ""}`} />
                ))}
              </div>
              <span className="qr-label">Scan to join</span>
            </div>
            <div>
              <span className="eyebrow">{t(locale, "campaign.qr")}</span>
              <h2>{t(locale, "campaign.qrTitle")}</h2>
              <p className="muted">{t(locale, "campaign.qrCopy")}</p>
              <Link className="button primary" href="/register">{t(locale, "campaign.start")}</Link>
            </div>
          </article>
        </section>
        <section className="grid four">
          <article className="card feature-card">
            <Trophy aria-hidden />
            <h2>{t(locale, "feature.predict")}</h2>
            <p className="muted">{t(locale, "feature.predictCopy")}</p>
          </article>
          <article className="card feature-card">
            <ShieldCheck aria-hidden />
            <h2>{t(locale, "feature.earn")}</h2>
            <p className="muted">{t(locale, "feature.earnCopy")}</p>
          </article>
          <article className="card feature-card">
            <Medal aria-hidden />
            <h2>{t(locale, "feature.leaderboards")}</h2>
            <p className="muted">{t(locale, "feature.leaderboardsCopy")}</p>
          </article>
          <article className="card feature-card">
            <Users aria-hidden />
            <h2>{t(locale, "feature.represent")}</h2>
            <p className="muted">{t(locale, "feature.representCopy")}</p>
          </article>
        </section>
        <section className="campaign-flow">
          <div>
            <span className="eyebrow">{t(locale, "flow.eyebrow")}</span>
            <h2>{t(locale, "flow.title")}</h2>
          </div>
          <div className="flow-steps">
            <article>
              <QrCode aria-hidden />
              <strong>{t(locale, "flow.step1")}</strong>
              <span>{t(locale, "flow.step1Copy")}</span>
            </article>
            <article>
              <Users aria-hidden />
              <strong>{t(locale, "flow.step2")}</strong>
              <span>{t(locale, "flow.step2Copy")}</span>
            </article>
            <article>
              <CalendarClock aria-hidden />
              <strong>{t(locale, "flow.step3")}</strong>
              <span>{t(locale, "flow.step3Copy")}</span>
            </article>
          </div>
        </section>
        <section className="section-title">
          <h2>{t(locale, "leaders.current")}</h2>
          <Link href="/leaderboards">{t(locale, "leaders.viewAll")}</Link>
        </section>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t(locale, "table.player")}</th>
                <th>{t(locale, "table.center")}</th>
                <th>{t(locale, "table.points")}</th>
              </tr>
            </thead>
            <tbody>
              {leaders.slice(0, 5).map((leader, index) => (
                <tr key={leader.id}>
                  <td><span className="rank-cell"><span className={`rank-medal top-${index + 1}`}>{index + 1}</span>{leader.name}</span></td>
                  <td><span className="flag-label"><NationalityFlag nationality={leader.nationality} />{leader.center}</span></td>
                  <td>{leader.points}</td>
                </tr>
              ))}
              {leaders.length === 0 ? (
                <tr>
                  <td colSpan={3}>{t(locale, "leaders.none")}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
