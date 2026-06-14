import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fetchLiveFixtures, fetchTodayFixtures, fetchFixturesByIds, type MappedFixture } from "@/lib/api-football-client";
import { prisma } from "@/lib/prisma";
import { createMatchDataWorkflowPlan } from "@/lib/match-data-workflow";
import { recalculatePredictionPoints } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { finalScoreSchema } from "@/lib/validators";

// ---------------------------------------------------------------------------
// Cron auth
// ---------------------------------------------------------------------------

function isCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// Team name normalisation for fuzzy matching
// ---------------------------------------------------------------------------

// Known discrepancies between api-football team names and FIFA/DB names
const TEAM_NAME_ALIASES: Record<string, string> = {
  "czech republic":    "czechia",
  "ir iran":           "iran",
  "korea republic":    "south korea",
  "korea dpr":         "north korea",
  "usa":               "united states",
  "cape verde":        "cabo verde",
  // Keys must use post-normalization form (& stripped, spaces collapsed)
  "trinidad tobago":   "trinidad and tobago",
  "bosnia herzegovina": "bosnia and herzegovina",
};

function normalize(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return TEAM_NAME_ALIASES[base] ?? base;
}

const KICKOFF_WINDOW_MS = 20 * 60 * 1000; // ±20 min

// ---------------------------------------------------------------------------
// Core sync logic — shared between GET (cron) and POST (manual admin)
// ---------------------------------------------------------------------------

async function runSync(): Promise<NextResponse> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY is not configured." }, { status: 503 });
  }

  const provider = process.env.FOOTBALL_DATA_PROVIDER?.trim();
  if (provider !== "api-football") {
    return NextResponse.json(
      { error: `Set FOOTBALL_DATA_PROVIDER=api-football to enable auto-sync. Current: "${provider ?? "unset"}".` },
      { status: 503 },
    );
  }

  // Guard: skip the external API call entirely when there are no LIVE matches
  // and no SCHEDULED matches kicking off today (UTC). Saves api-football quota
  // on days without fixtures.
  const todayStart = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const todayEnd   = new Date(new Date().toISOString().slice(0, 10) + "T23:59:59Z");
  const activeCount = await prisma.match.count({
    where: {
      OR: [
        { status: "LIVE" },
        { status: "SCHEDULED", kickoffAt: { gte: todayStart, lte: todayEnd } },
        // Also pick up pending_review matches that arrived via a previous sync
        { scoreSyncStatus: "pending_review" },
      ],
    },
  });
  if (activeCount === 0) {
    return NextResponse.json({ ok: true, message: "No matches today — sync skipped.", synced: 0, pending_review: 0, skipped: 0, warnings: [] });
  }

  const leagueId = process.env.FOOTBALL_DATA_COMPETITION_CODE?.trim() ?? "1";
  const season   = process.env.FOOTBALL_DATA_SEASON?.trim() ?? "2026";

  // Fetch live + today — deduplicate by externalId
  const [live, today] = await Promise.all([
    fetchLiveFixtures(apiKey, leagueId).catch((e) => {
      console.error("[sync-matches] live fetch failed:", e);
      return [] as MappedFixture[];
    }),
    fetchTodayFixtures(apiKey, leagueId, season).catch((e) => {
      console.error("[sync-matches] today fetch failed:", e);
      return [] as MappedFixture[];
    }),
  ]);

  const seen = new Set<string>();
  const fixtures: MappedFixture[] = [];
  for (const f of [...live, ...today]) {
    if (!seen.has(f.externalId)) { seen.add(f.externalId); fixtures.push(f); }
  }

  // Recover stuck LIVE matches — matches the DB thinks are LIVE but didn't appear in live/today
  // (happens when a match finishes after UTC midnight and falls off the "today" window).
  const livDbMatches = await prisma.match.findMany({
    where: { status: "LIVE", externalMatchId: { not: null } },
    select: { externalMatchId: true },
  });
  const missingLiveIds = livDbMatches
    .map((m) => m.externalMatchId as string)
    .filter((id) => !seen.has(id));
  if (missingLiveIds.length > 0) {
    const recovered = await fetchFixturesByIds(apiKey, missingLiveIds).catch((e) => {
      console.error("[sync-matches] stuck-live fetch failed:", e);
      return [] as MappedFixture[];
    });
    for (const f of recovered) {
      if (!seen.has(f.externalId)) { seen.add(f.externalId); fixtures.push(f); }
    }
  }

  if (!fixtures.length) {
    return NextResponse.json({ ok: true, message: "No fixtures today.", synced: 0, pending_review: 0, skipped: 0, warnings: [] });
  }

  // Load DB matches that are not yet FINAL
  const dbMatches = await prisma.match.findMany({
    where: { status: { not: "FINAL" } },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      _count: { select: { predictions: true } },
    },
  });

  const report = { synced: 0, pending_review: 0, skipped: 0, warnings: [] as string[] };
  const now = new Date();

  for (const fixture of fixtures) {
    // --- 1. Find matching DB match ---
    let dbMatch = dbMatches.find((m) => m.externalMatchId === fixture.externalId);

    if (!dbMatch) {
      const kickoff = fixture.kickoffAt.getTime();
      dbMatch = dbMatches.find((m) => {
        if (Math.abs(m.kickoffAt.getTime() - kickoff) > KICKOFF_WINDOW_MS) return false;
        return (
          normalize(m.homeTeam.name) === normalize(fixture.homeTeamName) &&
          normalize(m.awayTeam.name) === normalize(fixture.awayTeamName)
        );
      });

      // Store externalMatchId so future runs skip the fuzzy search
      if (dbMatch) {
        await prisma.match.update({
          where: { id: dbMatch.id },
          data: { externalMatchId: fixture.externalId, externalUpdatedAt: now },
        });
      }
    }

    if (!dbMatch) { report.skipped++; continue; }

    // --- 2. Update team logos (non-critical) ---
    if (fixture.homeTeamLogo || fixture.awayTeamLogo) {
      await Promise.all([
        fixture.homeTeamLogo
          ? prisma.team.updateMany({ where: { name: dbMatch.homeTeam.name }, data: { flagUrl: fixture.homeTeamLogo } })
          : Promise.resolve(),
        fixture.awayTeamLogo
          ? prisma.team.updateMany({ where: { name: dbMatch.awayTeam.name }, data: { flagUrl: fixture.awayTeamLogo } })
          : Promise.resolve(),
      ]).catch(() => {});
    }

    // --- 3. Build workflow plan ---
    const current = {
      id: dbMatch.id,
      fifaMatchNo: dbMatch.fifaMatchNo,
      kickoffAt: dbMatch.kickoffAt,
      status: dbMatch.status,
      homeTeamName: dbMatch.homeTeam.name,
      awayTeamName: dbMatch.awayTeam.name,
      venue: dbMatch.venue,
      homeScore: dbMatch.homeScore,
      awayScore: dbMatch.awayScore,
      predictionCount: dbMatch._count.predictions,
    };

    const plan = createMatchDataWorkflowPlan({ current, incoming: fixture });

    // --- 4. Mark LIVE ---
    if (plan.canMarkLive && dbMatch.status !== "LIVE") {
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: { status: "LIVE", externalUpdatedAt: now, lastScoreSyncAt: now },
      });
    }

    if (!plan.canStoreFinalScoreDraft || !fixture.finalScore) continue;

    // Validate API score before storing — guards against corrupt provider data.
    const scoreValidation = finalScoreSchema.safeParse(fixture.finalScore);
    if (!scoreValidation.success) {
      report.warnings.push(`[match ${dbMatch.id}] skipped — invalid score from API: ${JSON.stringify(fixture.finalScore)}`);
      continue;
    }
    const { homeScore: finalHome, awayScore: finalAway } = scoreValidation.data;

    // --- 5a. Needs admin review ---
    if (plan.requiresAdminConfirmation) {
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: {
          scoreSyncStatus: "pending_review",
          pendingHomeScore: finalHome,
          pendingAwayScore: finalAway,
          // Penalty data stored in place so approve-score can read it without extra columns.
          wentToPenalties: fixture.penaltyResult?.wentToPenalties ?? false,
          penaltyWinner: fixture.penaltyResult?.penaltyWinner ?? null,
          homePenaltyScore: fixture.penaltyResult?.homePenaltyScore ?? null,
          awayPenaltyScore: fixture.penaltyResult?.awayPenaltyScore ?? null,
          externalUpdatedAt: now,
          lastScoreSyncAt: now,
        },
      });
      report.pending_review++;
      report.warnings.push(
        `${dbMatch.homeTeam.name} ${finalHome}–${finalAway} ${dbMatch.awayTeam.name} ` +
        `[match ${dbMatch.id}] needs review: ${plan.warnings.join("; ")}`,
      );
      continue;
    }

    // --- 5b. Safe auto-apply ---

    try {
      await prisma.$transaction(async (tx) => {
        await tx.match.update({
          where: { id: dbMatch!.id },
          data: {
            homeScore: finalHome,
            awayScore: finalAway,
            status: "FINAL",
            finalizedAt: now,
            scoreSource: "api-football",
            scoreSyncStatus: "auto_applied",
            wentToPenalties: fixture.penaltyResult?.wentToPenalties ?? false,
            penaltyWinner: fixture.penaltyResult?.penaltyWinner ?? null,
            homePenaltyScore: fixture.penaltyResult?.homePenaltyScore ?? null,
            awayPenaltyScore: fixture.penaltyResult?.awayPenaltyScore ?? null,
            externalUpdatedAt: now,
            lastScoreSyncAt: now,
          },
        });

        const predictions = await tx.prediction.findMany({
          where: { matchId: dbMatch!.id },
          select: {
            id: true,
            userId: true,
            homeScore: true,
            awayScore: true,
            penaltyWinner: true,
            homePenaltyScore: true,
            awayPenaltyScore: true,
          },
        });

        if (predictions.length > 0) {
          const updates = recalculatePredictionPoints({
            predictions,
            finalScore: { homeScore: finalHome, awayScore: finalAway },
            penalty: fixture.penaltyResult ?? null,
            calculatedAt: now,
          });
          const byPoints = new Map<number, string[]>();
          for (const u of updates) {
            const list = byPoints.get(u.pointsAwarded) ?? [];
            list.push(u.id);
            byPoints.set(u.pointsAwarded, list);
          }
          await Promise.all(
            [...byPoints.entries()].map(([pts, ids]) =>
              tx.prediction.updateMany({
                where: { id: { in: ids } },
                data: { pointsAwarded: pts, calculatedAt: now },
              }),
            ),
          );
        }
      });

      report.synced++;
    } catch (err) {
      console.error("[sync-matches] finalize failed:", dbMatch.id, err);
      report.warnings.push(`Failed to finalize ${dbMatch.id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ ok: true, ...report });
}

// ---------------------------------------------------------------------------
// GET — Vercel cron trigger
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return runSync();
}

// ---------------------------------------------------------------------------
// POST — manual admin trigger
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`sync-matches:${ip}`, 10, 60 * 1000))) {
    return NextResponse.json({ error: "Too many sync requests." }, { status: 429 });
  }

  return runSync();
}
