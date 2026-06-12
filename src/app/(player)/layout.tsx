import PlayerShell from "@/components/player/PlayerShell";
import { requirePlayerContext } from "@/lib/player-app";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const [{ user, locale }, liveCount] = await Promise.all([
    requirePlayerContext(),
    prisma.match.count({ where: { status: "LIVE" } }),
  ]);

  return (
    <PlayerShell
      hasLiveMatch={liveCount > 0}
      user={{
        fullName: user.fullName,
        nickname: user.nickname,
        email: user.email,
        centerName: user.competitionCenter?.name ?? user.center.name,
        avatarUrl: user.avatarUrl,
      }}
      labels={{
        home: t(locale, "nav.home"),
        predictions: t(locale, "nav.predict"),
        matches: t(locale, "nav.matches"),
        leaderboard: t(locale, "nav.leaderboards"),
        profile: t(locale, "nav.profile"),
        points: t(locale, "nav.points"),
        center: t(locale, "nav.center"),
        logout: t(locale, "nav.logout"),
      }}
    >
      {children}
    </PlayerShell>
  );
}
