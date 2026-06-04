import Link from "next/link";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

const SCORING = [
  { pts: 5, key: "sc_exact" as const },
  { pts: 3, key: "sc_diff" as const },
  { pts: 2, key: "sc_out" as const },
  { pts: 0, key: "sc_wrong" as const },
];

function HowStep({ n, title, body, last = false }: { n: number; title: string; body: string; last?: boolean }) {
  return (
    <div className="how-step">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="how-step-num">{n}</div>
        {!last && <div className="how-step-line" />}
      </div>
      <div className="how-step-content" style={{ paddingBottom: last ? 0 : 22 }}>
        <div className="how-step-title">{title}</div>
        <div className="how-step-body">{body}</div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const locale = await getLocale();

  const fallback = [demoMatches.length, demoCenters.length, demoLeaderboard] as const;
  const [, centerCount, leaders] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.match.count(),
        prisma.garrinchaCenter.count(),
        getLeaderboardWithMeta().then((m) => m.rows),
      ]).catch(() => fallback)
    : fallback;

  const top5 = (leaders as { id: string; name: string; points: number; center: string }[]).slice(0, 5);

  return (
    <div className="g-scroll" style={{ overflowY: "auto", background: "var(--bg)" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero-section pitch-lines">
        {/* glow */}
        <div className="hero-glow" />

        {/* nav row */}
        <div className="hero-nav">
          <GarrinchaLogo height={22} />
          <LanguageSwitcher locale={locale} />
        </div>

        {/* tagline + headline */}
        <div className="hero-tagline-wrap">
          <span className="chip chip-green">⚽ {t(locale, "tagline")}</span>
          <h1 className="hero-title" style={{ WebkitTextFillColor: "transparent", backgroundImage: "linear-gradient(180deg, var(--ink) 30%, var(--green))", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
            {t(locale, "hero_title").split("\n").map((ln, i, arr) => (
              <span key={i} style={{ color: i >= arr.length - 2 ? "var(--green)" : "var(--ink)", WebkitTextFillColor: "initial", backgroundImage: "none" }}>
                {ln}{i < arr.length - 1 ? "\n" : ""}
              </span>
            ))}
          </h1>
          <p className="hero-sub">{t(locale, "hero_sub")}</p>
        </div>

        {/* CTAs */}
        <div className="hero-ctas" style={{ position: "relative", zIndex: 2 }}>
          <Link href="/register" className="btn btn-green btn-lg" style={{ position: "relative", overflow: "hidden", textDecoration: "none" }}>
            {t(locale, "cta_register")}
            <div style={{ position: "absolute", top: 0, bottom: 0, width: 60, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)", animation: "sweep 3.4s infinite" }} />
          </Link>
          <Link href="/login" className="btn btn-ghost btn-md" style={{ textDecoration: "none" }}>{t(locale, "cta_have_link")}</Link>
        </div>

        {/* stats strip */}
        <div className="hero-stats" style={{ position: "relative", zIndex: 2 }}>
          {[
            [String(centerCount), t(locale, "hero.centers")],
            ["€0", "free"],
            ["∞", t(locale, "hero.lock")],
          ].map(([val, lbl], i) => (
            <div key={i} className="hero-stat">
              <div className="hero-stat-value" style={{ color: i === 2 ? "var(--green)" : "var(--ink)" }}>{val}</div>
              <div className="hero-stat-label">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ padding: "30px 22px 8px" }}>
        <div className="kick" style={{ fontSize: 13, color: "var(--green)", marginBottom: 14 }}>
          {t(locale, "how_title")}
        </div>
        <HowStep n={1} title={t(locale, "how_1_t")} body={t(locale, "how_1_d")} />
        <HowStep n={2} title={t(locale, "how_2_t")} body={t(locale, "how_2_d")} />
        <HowStep n={3} title={t(locale, "how_3_t")} body={t(locale, "how_3_d")} />
        <HowStep n={4} title={t(locale, "how_4_t")} body={t(locale, "how_4_d")} />
        <HowStep n={5} title={t(locale, "how_5_t")} body={t(locale, "how_5_d")} last />
      </section>

      {/* ── SCORING ──────────────────────────────────────────────── */}
      <section style={{ padding: "18px 22px" }}>
        <div className="card scoring-card">
          <div className="kick" style={{ fontSize: 13, color: "var(--green)", marginBottom: 8 }}>{t(locale, "scoring_title")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {SCORING.map((s, i) => (
              <div key={i} className="scoring-row">
                <span className="scoring-label">{t(locale, s.key)}</span>
                <span className="scoring-pts" style={{ color: s.pts === 5 ? "var(--gold)" : s.pts === 0 ? "var(--ink-faint)" : "var(--green)" }}>
                  +{s.pts}<span className="scoring-pts-unit">{t(locale, "pts")}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP 5 LEADERBOARD ────────────────────────────────────── */}
      {top5.length > 0 && (
        <section style={{ padding: "8px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 className="disp" style={{ fontSize: 23, color: "var(--ink)", margin: 0 }}>{t(locale, "leaders.current")}</h3>
            <Link href="/leaderboards" className="label" style={{ fontSize: 11.5, color: "var(--green)", letterSpacing: "0.08em" }}>
              {t(locale, "leaders.viewAll")}
            </Link>
          </div>
          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", t(locale, "table.player"), t(locale, "table.center"), t(locale, "table.points")].map((h, i) => (
                      <th key={i} style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", fontFamily: "var(--f-body)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10, color: "var(--ink-faint)", textAlign: i === 3 ? "right" : "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top5.map((row, i) => {
                    const medal = ["var(--gold)", "#C8CDD4", "#CD8B5B"][i] ?? null;
                    return (
                      <tr key={row.id} style={{ borderBottom: i < top5.length - 1 ? "1px solid var(--line)" : "none" }}>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, fontSize: 18, color: medal ?? "var(--ink-faint)", width: 36 }}>{i + 1}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, fontSize: 15, color: "var(--ink)" }}>{row.name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--ink-faint)" }}>{row.center}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--f-num)", fontWeight: 800, fontSize: 18, color: medal ?? "var(--green)", textAlign: "right" }}>{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {top5.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center", padding: "24px 0" }}>{t(locale, "leaders.none")}</p>
          )}
        </section>
      )}

      {/* ── PRIZE TEASER ─────────────────────────────────────────── */}
      <section style={{ padding: "8px 22px 40px" }}>
        <div className="prize-teaser">
          <div className="prize-teaser-glow" />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>🏆</div>
            <div className="disp" style={{ fontSize: 24, color: "var(--gold)" }}>{t(locale, "prize_teaser")}</div>
            <Link href="/register" className="btn btn-gold btn-md" style={{ marginTop: 18, textDecoration: "none" }}>
              {t(locale, "cta_register")}
            </Link>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 28, opacity: 0.5 }}>
          <GarrinchaLogo height={16} />
          <div className="label" style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 8 }}>
            World Cup Prediction · Belgium
          </div>
        </div>
      </section>
    </div>
  );
}
