import { Role } from "@prisma/client";
import { ClipboardList, Gift, Medal, QrCode } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoLeaderboard, demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminPage() {
  const locale = await getLocale();
  let currentAdmin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try {
      currentAdmin = await requireAdmin();
    } catch {
      redirect("/admin/login?next=/admin");
    }
  }

  const [users, matches, predictions] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.count({ where: { role: Role.USER } }),
        prisma.match.count(),
        prisma.prediction.count(),
      ])
    : [demoLeaderboard.length, demoMatches.length, demoMatches.filter((match) => match.predictions.length > 0).length];

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "auth.adminEyebrow")}</span>
        <h1>{t(locale, "admin.campaign")}</h1>
        <p>{t(locale, "admin.campaignCopy")}</p>
      </section>
      <section className="grid three">
        <article className="card">
          <Medal aria-hidden />
          <h2>{users}</h2>
          <p className="muted">{t(locale, "admin.players")}</p>
        </article>
        <article className="card">
          <ClipboardList aria-hidden />
          <h2>{matches}</h2>
          <p className="muted">{t(locale, "admin.matches")}</p>
        </article>
        <article className="card">
          <Gift aria-hidden />
          <h2>{predictions}</h2>
          <p className="muted">{t(locale, "admin.predictions")}</p>
        </article>
      </section>
      <section className="section-title">
        <h2>{t(locale, "admin.tools")}</h2>
      </section>
      <div className="action-row">
        <Link className="button primary" href="/admin/matches">
          {t(locale, "admin.finalScores")}
        </Link>
        <Link className="button" href="/admin/bonus">{t(locale, "admin.bonus")}</Link>
        <Link className="button dark" href="/leaderboards">{t(locale, "admin.review")}</Link>
        <Link className="button" href="/admin/checkin">
          <QrCode size={16} aria-hidden /> {t(locale, "admin.checkinButton")}
        </Link>
        {currentAdmin?.role === Role.SUPER_ADMIN || !hasDatabaseConfig() ? (
          <Link className="button dark" href="/admin/users">{t(locale, "admin.ownerControls")}</Link>
        ) : null}
      </div>
    </main>
  );
}
