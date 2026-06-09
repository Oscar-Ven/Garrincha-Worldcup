import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MatchesClient from "./MatchesClient";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/admin/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  const isManager = admin.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/");
  }

  // Load matches
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: { select: { name: true, flagUrl: true, fifaCode: true } },
      awayTeam: { select: { name: true, flagUrl: true, fifaCode: true } },
    },
    orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
  });

  const serializedMatches = matches.map((m) => ({
    id: m.id,
    fifaMatchNo: m.fifaMatchNo ?? 0,
    stage: m.stage,
    venue: m.venue,
    kickoffAt: m.kickoffAt.toISOString(),
    status: m.status,
    homeTeamName: m.homeTeam.name,
    homeTeamFifa: m.homeTeam.fifaCode,
    homeTeamFlag: m.homeTeam.flagUrl,
    awayTeamName: m.awayTeam.name,
    awayTeamFifa: m.awayTeam.fifaCode,
    awayTeamFlag: m.awayTeam.flagUrl,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    finalizedAt: m.finalizedAt ? m.finalizedAt.toISOString() : null,
    scoreSource: m.scoreSource ?? null,
    scoreSyncStatus: m.scoreSyncStatus ?? null,
    lastScoreSyncAt: m.lastScoreSyncAt ? m.lastScoreSyncAt.toISOString() : null,
    pendingHomeScore: m.pendingHomeScore ?? null,
    pendingAwayScore: m.pendingAwayScore ?? null,
    wentToPenalties: m.wentToPenalties,
    penaltyWinner: m.penaltyWinner ?? null,
    homePenaltyScore: m.homePenaltyScore ?? null,
    awayPenaltyScore: m.awayPenaltyScore ?? null,
  }));

  return (
    <MatchesClient
      currentUserRole={admin.role}
      initialMatches={serializedMatches}
    />
  );
}
