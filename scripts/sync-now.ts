/**
 * Standalone sync script — calls api-football directly and applies results.
 * Mirrors the logic in src/app/api/admin/sync-matches/route.ts without server-only.
 *
 * Run: node --env-file=.env --import tsx/esm scripts/sync-now.ts [--dry-run]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ---------------------------------------------------------------------------
// Scoring (inlined — no server-only)
// ---------------------------------------------------------------------------
type Score = { homeScore: number; awayScore: number };
type PenaltyResult = {
  wentToPenalties: boolean;
  penaltyWinner: string | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

function outcome(s: Score) {
  if (s.homeScore > s.awayScore) return "HOME";
  if (s.homeScore < s.awayScore) return "AWAY";
  return "DRAW";
}

function calcPoints(
  pred: Score & { penaltyWinner?: string | null; homePenaltyScore?: number | null; awayPenaltyScore?: number | null },
  final: Score,
  penalty?: PenaltyResult | null,
): number {
  let pts = 0;
  if (pred.homeScore === final.homeScore && pred.awayScore === final.awayScore) {
    pts = 5;
  } else if (outcome(pred) === outcome(final)) {
    pts = (pred.homeScore - pred.awayScore) === (final.homeScore - final.awayScore) ? 3 : 2;
  }
  if (penalty?.wentToPenalties && penalty.penaltyWinner && pred.penaltyWinner && pred.homeScore === pred.awayScore) {
    if (pred.penaltyWinner === penalty.penaltyWinner) {
      pts += 2;
      if (pred.homePenaltyScore != null && pred.awayPenaltyScore != null &&
          pred.homePenaltyScore === penalty.homePenaltyScore && pred.awayPenaltyScore === penalty.awayPenaltyScore) {
        pts += 1;
      }
    }
  }
  return pts;
}

// ---------------------------------------------------------------------------
// api-football
// ---------------------------------------------------------------------------
const BASE = "https://v3.football.api-sports.io";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY?.trim() ?? "";
const LEAGUE  = process.env.FOOTBALL_DATA_COMPETITION_CODE?.trim() ?? "1";
const SEASON  = process.env.FOOTBALL_DATA_SEASON?.trim() ?? "2026";

if (!API_KEY) { console.error("FOOTBALL_DATA_API_KEY is not set"); process.exit(1); }

const LIVE_STATUSES   = new Set(["1H","HT","2H","ET","BT","P","INT","LIVE","SUSP"]);
const FINISH_STATUSES = new Set(["FT","AET","PEN","AWD","WO"]);

// Known discrepancies between api-football names and FIFA/DB names
const TEAM_NAME_ALIASES: Record<string, string> = {
  "czech republic":  "czechia",
  "ir iran":         "iran",
  "korea republic":  "south korea",
  "korea dpr":       "north korea",
  "usa":             "united states",
  "cape verde":      "cabo verde",
  // Keys must use post-normalization form (& stripped, spaces collapsed)
  "trinidad tobago": "trinidad and tobago",
  "bosnia herzegovina": "bosnia and herzegovina",
};

function normalize(n: string) {
  const base = n.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ").trim();
  return TEAM_NAME_ALIASES[base] ?? base;
}

async function fetchFixtures(path: string) {
  console.log(`  GET ${BASE}${path}`);
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": API_KEY },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`api-football HTTP ${res.status}`);
  const json = await res.json() as { response: unknown[] };
  return Array.isArray(json.response) ? json.response : [];
}

interface RawFixture {
  fixture: { id: number; date: string; status: { short: string } };
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
  goals: { home: number | null; away: number | null };
  score: { penalty: { home: number | null; away: number | null } };
}

function mapFixture(f: RawFixture) {
  const ss = f.fixture.status.short;
  const isLive     = LIVE_STATUSES.has(ss);
  const isFinished = FINISH_STATUSES.has(ss);
  const isPen      = ss === "PEN";
  const hasGoals   = f.goals.home !== null && f.goals.away !== null;
  const hasPen     = f.score?.penalty?.home != null && f.score?.penalty?.away != null;
  return {
    externalId: String(f.fixture.id),
    kickoffAt: new Date(f.fixture.date),
    homeTeamName: f.teams.home.name,
    awayTeamName: f.teams.away.name,
    homeTeamLogo: f.teams.home.logo,
    awayTeamLogo: f.teams.away.logo,
    statusShort: ss,
    isLive,
    isFinished,
    finalScore: isFinished && hasGoals
      ? { homeScore: f.goals.home as number, awayScore: f.goals.away as number }
      : undefined,
    penaltyResult: isPen && hasPen
      ? {
          wentToPenalties: true,
          penaltyWinner: (f.score.penalty.home as number) > (f.score.penalty.away as number) ? "home" : "away",
          homePenaltyScore: f.score.penalty.home as number,
          awayPenaltyScore: f.score.penalty.away as number,
        }
      : isPen
        ? { wentToPenalties: true, penaltyWinner: null, homePenaltyScore: null, awayPenaltyScore: null }
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== Garrincha Sync (${DRY_RUN ? "DRY RUN" : "LIVE"}) ===`);
  console.log(`League: ${LEAGUE}  Season: ${SEASON}\n`);

  // Guard: skip api-football call when no matches need syncing today
  const todayStart = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const todayEnd   = new Date(new Date().toISOString().slice(0, 10) + "T23:59:59Z");
  const activeCount = await prisma.match.count({
    where: {
      OR: [
        { status: "LIVE" },
        { status: "SCHEDULED", kickoffAt: { gte: todayStart, lte: todayEnd } },
        { scoreSyncStatus: "pending_review" },
      ],
    },
  });
  if (activeCount === 0) {
    console.log("No matches today — sync skipped (0 api-football calls made).");
    await prisma.$disconnect(); await pool.end();
    return;
  }

  // Fetch live + today
  console.log("Fetching fixtures...");
  const [rawLive, rawToday] = await Promise.all([
    fetchFixtures(`/fixtures?league=${LEAGUE}&live=all`).catch(e => { console.error("live fetch failed:", e.message); return []; }),
    fetchFixtures(`/fixtures?league=${LEAGUE}&season=${SEASON}&date=${new Date().toISOString().slice(0,10)}`).catch(e => { console.error("today fetch failed:", e.message); return []; }),
  ]);

  const seen = new Set<string>();
  const fixtures: ReturnType<typeof mapFixture>[] = [];
  for (const f of [...rawLive, ...rawToday] as RawFixture[]) {
    const m = mapFixture(f);
    if (!seen.has(m.externalId)) { seen.add(m.externalId); fixtures.push(m); }
  }

  console.log(`Fetched ${fixtures.length} unique fixture(s) from api-football:`);
  for (const f of fixtures) {
    console.log(`  [${f.externalId}] ${f.homeTeamName} vs ${f.awayTeamName}  status=${f.statusShort}  score=${f.finalScore ? `${f.finalScore.homeScore}-${f.finalScore.awayScore}` : "N/A"}`);
  }

  if (!fixtures.length) {
    console.log("\nNothing to sync.");
    await prisma.$disconnect(); await pool.end();
    return;
  }

  // Load all non-FINAL DB matches
  const dbMatches = await prisma.match.findMany({
    where: { status: { not: "FINAL" } },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      _count: { select: { predictions: true } },
    },
  });

  console.log(`\nNon-FINAL matches in DB: ${dbMatches.length}`);

  const KICKOFF_WINDOW_MS = 20 * 60 * 1000;
  const now = new Date();
  const report = { synced: 0, pending_review: 0, skipped: 0, warnings: [] as string[], live_updated: 0 };

  for (const fixture of fixtures) {
    // Match by externalId or fuzzy (name + kickoff)
    let dbMatch = dbMatches.find(m => m.externalMatchId === fixture.externalId);
    if (!dbMatch) {
      const kick = fixture.kickoffAt.getTime();
      dbMatch = dbMatches.find(m =>
        Math.abs(m.kickoffAt.getTime() - kick) <= KICKOFF_WINDOW_MS &&
        normalize(m.homeTeam.name) === normalize(fixture.homeTeamName) &&
        normalize(m.awayTeam.name) === normalize(fixture.awayTeamName),
      );
      if (dbMatch) {
        console.log(`  Fuzzy-matched: "${fixture.homeTeamName}" vs "${fixture.awayTeamName}" → DB match ${dbMatch.id}`);
        if (!DRY_RUN) {
          await prisma.match.update({ where: { id: dbMatch.id }, data: { externalMatchId: fixture.externalId, externalUpdatedAt: now } });
        }
      }
    }

    if (!dbMatch) {
      console.log(`  No DB match found for [${fixture.externalId}] ${fixture.homeTeamName} vs ${fixture.awayTeamName} — skipping`);
      report.skipped++;
      continue;
    }

    // Mark LIVE
    if (fixture.isLive && dbMatch.status !== "LIVE") {
      console.log(`  → Mark LIVE: ${dbMatch.homeTeam.name} vs ${dbMatch.awayTeam.name}`);
      if (!DRY_RUN) await prisma.match.update({ where: { id: dbMatch.id }, data: { status: "LIVE", lastScoreSyncAt: now } });
      report.live_updated++;
    }

    if (!fixture.isFinished || !fixture.finalScore) continue;

    const { homeScore: fh, awayScore: fa } = fixture.finalScore;
    console.log(`\n  FINISHED: ${dbMatch.homeTeam.name} ${fh}–${fa} ${dbMatch.awayTeam.name}`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would set FINAL + recalculate ${dbMatch._count.predictions} predictions`);
      report.synced++;
      continue;
    }

    // Apply final score + recalculate predictions
    try {
      await prisma.$transaction(async (tx) => {
        await tx.match.update({
          where: { id: dbMatch!.id },
          data: {
            homeScore: fh, awayScore: fa, status: "FINAL", finalizedAt: now,
            scoreSource: "api-football", scoreSyncStatus: "auto_applied",
            wentToPenalties: fixture.penaltyResult?.wentToPenalties ?? false,
            penaltyWinner: fixture.penaltyResult?.penaltyWinner ?? null,
            homePenaltyScore: fixture.penaltyResult?.homePenaltyScore ?? null,
            awayPenaltyScore: fixture.penaltyResult?.awayPenaltyScore ?? null,
            externalUpdatedAt: now, lastScoreSyncAt: now,
          },
        });

        const predictions = await tx.prediction.findMany({
          where: { matchId: dbMatch!.id },
          select: { id: true, userId: true, homeScore: true, awayScore: true, penaltyWinner: true, homePenaltyScore: true, awayPenaltyScore: true },
        });

        console.log(`  Recalculating ${predictions.length} prediction(s)...`);
        const byPoints = new Map<number, string[]>();
        for (const p of predictions) {
          const pts = calcPoints(p, fixture.finalScore!, fixture.penaltyResult);
          const list = byPoints.get(pts) ?? [];
          list.push(p.id);
          byPoints.set(pts, list);
          console.log(`    user=${p.userId.slice(-6)} predicted ${p.homeScore}-${p.awayScore} → ${pts} pts`);
        }
        await Promise.all(
          [...byPoints.entries()].map(([pts, ids]) =>
            tx.prediction.updateMany({ where: { id: { in: ids } }, data: { pointsAwarded: pts, calculatedAt: now } }),
          ),
        );
      });
      console.log(`  ✓ Finalized`);
      report.synced++;
    } catch (err) {
      console.error(`  ✗ Failed:`, err);
      report.warnings.push(`Failed to finalize ${dbMatch.id}: ${(err as Error).message}`);
    }
  }

  console.log(`\n=== RESULT ===`);
  console.log(`  Synced:         ${report.synced}`);
  console.log(`  Live updated:   ${report.live_updated}`);
  console.log(`  Pending review: ${report.pending_review}`);
  console.log(`  Skipped:        ${report.skipped}`);
  if (report.warnings.length) console.log(`  Warnings:`, report.warnings);

  await prisma.$disconnect(); await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
