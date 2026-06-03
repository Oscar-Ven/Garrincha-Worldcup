import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { OwnerDashboard, type PrizeCenterGroup } from "@/components/OwnerDashboard";
import { requireSuperAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { hasDatabaseConfig, demoCenters, demoLeaderboard, demoMatches, demoBonusEvents } from "@/lib/ui-demo-data";

export const metadata = { title: "Owner Dashboard" };

export default async function OwnerPage() {
  const locale = await getLocale();

  let ownerId = "demo-owner";
  let ownerEmail = "owner@garrincha.local";

  if (hasDatabaseConfig()) {
    try {
      const owner = await requireSuperAdmin();
      ownerId = owner.id;
      ownerEmail = owner.email;
    } catch {
      redirect("/admin/login?next=/owner");
    }
  }

  if (!hasDatabaseConfig()) {
    // Demo mode — assemble demo props
    const demoStats = {
      playerCount: demoLeaderboard.length,
      adminCount: 1,
      predictionCount: demoMatches.reduce((s, m) => s + m.predictions.length, 0),
      totalPointsAwarded: demoLeaderboard.reduce((s, r) => s + r.points, 0),
      finalizedMatchCount: demoMatches.filter((m) => m.status === "FINAL").length,
      pendingMatchCount: demoMatches.filter((m) => m.status !== "FINAL").length,
      bonusEventCount: demoBonusEvents.length,
    };

    const demoUsers = [
      { id: "demo-owner", email: "owner@garrincha.local", displayName: "GARRINCHA Owner", nationality: "Belgium", role: Role.SUPER_ADMIN, center: { id: "demo-gent", name: "GARRINCHA Gent Arsenaal" }, totalPoints: 0, predictionCount: 0, createdAt: new Date().toISOString() },
      { id: "demo-admin", email: "admin@garrincha.local", displayName: "GARRINCHA Admin", nationality: "Belgium", role: Role.ADMIN, center: { id: "demo-gent", name: "GARRINCHA Gent Arsenaal" }, totalPoints: 0, predictionCount: 0, createdAt: new Date().toISOString() },
      ...demoLeaderboard.map((row) => ({ id: row.id, email: `${row.name.toLowerCase().replace(/ /g, ".")}@example.com`, displayName: row.name, nationality: row.nationality, role: Role.USER, center: { id: "demo", name: row.center }, totalPoints: row.points, predictionCount: 3, createdAt: new Date().toISOString() })),
    ];

    const demoCenterStats = demoCenters.map((c) => ({
      id: c.id, name: c.name, city: c.city, country: c.country,
      playerCount: 1, predictionCount: 3, totalPoints: demoLeaderboard.find((r) => r.center === c.name)?.points ?? 0,
      topPlayer: demoLeaderboard.find((r) => r.center === c.name)?.name ?? null,
    }));

    const demoMatchesSerialized = demoMatches.map((m) => ({
      id: m.id, fifaMatchNo: m.fifaMatchNo, stage: m.stage, venue: m.venue,
      kickoffAt: new Date(m.kickoffAt).toISOString(),
      homeTeam: { name: m.homeTeam.name, fifaCode: m.homeTeam.fifaCode, flagUrl: m.homeTeam.flagUrl, groupName: m.homeTeam.groupName ?? null },
      awayTeam: { name: m.awayTeam.name, fifaCode: m.awayTeam.fifaCode, flagUrl: m.awayTeam.flagUrl, groupName: m.awayTeam.groupName ?? null },
      homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, predictionCount: m.predictions.length,
    }));

    const demoBonusSerialized = demoBonusEvents.map((e) => ({
      id: e.id, points: e.points, reason: e.reason, awardedBy: "admin@garrincha.local",
      createdAt: new Date().toISOString(),
      user: { email: e.user.email, displayName: e.user.displayName },
    }));

    const demoBoard = demoLeaderboard.map((r, i) => ({ id: r.id, name: r.name, center: r.center, nationality: r.nationality, points: r.points, predictionCount: 3, rank: i + 1 }));

    const demoPrizes: PrizeCenterGroup[] = demoCenters.map((c) => ({
      centerId: c.id,
      centerName: c.name,
      players: demoLeaderboard
        .filter((r) => r.center === c.name)
        .slice(0, 10)
        .map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, points: r.points })),
    }));

    return (
      <OwnerDashboard
        ownerId={ownerId}
        ownerEmail={ownerEmail}
        stats={demoStats}
        users={demoUsers}
        matches={demoMatchesSerialized}
        centerStats={demoCenterStats}
        bonusEvents={demoBonusSerialized}
        leaderboard={demoBoard}
        prizeWinners={demoPrizes}
        locale={locale}
      />
    );
  }

  // Live mode — fetch all data in parallel
  const [
    playerCount,
    adminCount,
    predictionCount,
    pointsAggregate,
    bonusAggregate,
    finalizedMatchCount,
    pendingMatchCount,
    bonusEventCount,
    rawUsers,
    rawMatches,
    rawBonusEvents,
    rawCenters,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } } }),
    prisma.prediction.count(),
    prisma.prediction.aggregate({ _sum: { pointsAwarded: true } }),
    prisma.pointEvent.aggregate({ _sum: { points: true } }),
    prisma.match.count({ where: { status: "FINAL" } }),
    prisma.match.count({ where: { status: { not: "FINAL" } } }),
    prisma.pointEvent.count(),
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        displayName: true,
        nationality: true,
        role: true,
        createdAt: true,
        center: { select: { id: true, name: true } },
        competitionCenter: { select: { id: true, name: true } },
        predictions: { select: { pointsAwarded: true } },
        pointEvents: { select: { points: true } },
      },
    }),
    prisma.match.findMany({
      orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
      include: {
        homeTeam: true,
        awayTeam: true,
        _count: { select: { predictions: true } },
      },
    }),
    prisma.pointEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, displayName: true } } },
    }),
    prisma.garrinchaCenter.findMany({
      orderBy: { name: "asc" },
      include: {
        competingUsers: {
          select: {
            predictions: { select: { pointsAwarded: true } },
            pointEvents: { select: { points: true } },
            displayName: true,
            email: true,
          },
        },
        _count: { select: { competingUsers: true } },
      },
    }),
  ]);

  const totalPointsAwarded =
    (pointsAggregate._sum.pointsAwarded ?? 0) + (bonusAggregate._sum.points ?? 0);

  const stats = { playerCount, adminCount, predictionCount, totalPointsAwarded, finalizedMatchCount, pendingMatchCount, bonusEventCount };

  const users = rawUsers.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    nationality: u.nationality,
    role: u.role,
    center: { id: u.center.id, name: u.center.name },
    competitionCenter: u.competitionCenter ? { id: u.competitionCenter.id, name: u.competitionCenter.name } : null,
    totalPoints: u.predictions.reduce((s, p) => s + p.pointsAwarded, 0) + u.pointEvents.reduce((s, e) => s + e.points, 0),
    predictionCount: u.predictions.length,
    createdAt: u.createdAt.toISOString(),
  }));

  const matches = rawMatches.map((m) => ({
    id: m.id,
    fifaMatchNo: m.fifaMatchNo,
    stage: m.stage,
    venue: m.venue,
    kickoffAt: m.kickoffAt.toISOString(),
    homeTeam: { name: m.homeTeam.name, fifaCode: m.homeTeam.fifaCode, flagUrl: m.homeTeam.flagUrl, groupName: m.homeTeam.groupName },
    awayTeam: { name: m.awayTeam.name, fifaCode: m.awayTeam.fifaCode, flagUrl: m.awayTeam.flagUrl, groupName: m.awayTeam.groupName },
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    predictionCount: m._count.predictions,
  }));

  const bonusEvents = rawBonusEvents.map((e) => ({
    id: e.id,
    points: e.points,
    reason: e.reason,
    awardedBy: e.awardedBy,
    createdAt: e.createdAt.toISOString(),
    user: { email: e.user.email, displayName: e.user.displayName },
  }));

  const centerStats = rawCenters.map((c) => {
    const allUsers = c.competingUsers;
    const totalPoints = allUsers.reduce((sum, u) => {
      return sum + u.predictions.reduce((s, p) => s + p.pointsAwarded, 0) + u.pointEvents.reduce((s, e) => s + e.points, 0);
    }, 0);
    const topUser = allUsers.reduce<{ name: string; pts: number } | null>((best, u) => {
      const pts = u.predictions.reduce((s, p) => s + p.pointsAwarded, 0) + u.pointEvents.reduce((s, e) => s + e.points, 0);
      if (!best || pts > best.pts) return { name: u.displayName ?? u.email, pts };
      return best;
    }, null);
    return {
      id: c.id, name: c.name, city: c.city, country: c.country,
      playerCount: c._count.competingUsers,
      predictionCount: allUsers.reduce((s, u) => s + u.predictions.length, 0),
      totalPoints,
      topPlayer: topUser?.name ?? null,
    };
  });

  const leaderboard = users
    .filter((u) => u.role === Role.USER && u.competitionCenter !== null)
    .sort((a, b) => b.totalPoints - a.totalPoints || a.email.localeCompare(b.email))
    .map((u, i) => ({ id: u.id, name: u.displayName ?? u.email, center: u.competitionCenter!.name, nationality: u.nationality, points: u.totalPoints, predictionCount: u.predictionCount, rank: i + 1 }));

  const prizeWinners: PrizeCenterGroup[] = rawCenters.map((c) => ({
    centerId: c.id,
    centerName: c.name,
    players: users
      .filter((u) => u.competitionCenter?.id === c.id && u.role === Role.USER)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .map((u, i) => ({ rank: i + 1, id: u.id, name: u.displayName ?? u.email, points: u.totalPoints })),
  }));

  return (
    <OwnerDashboard
      ownerId={ownerId}
      ownerEmail={ownerEmail}
      stats={stats}
      users={users}
      matches={matches}
      centerStats={centerStats}
      bonusEvents={bonusEvents}
      leaderboard={leaderboard}
      prizeWinners={prizeWinners}
      locale={locale}
    />
  );
}
