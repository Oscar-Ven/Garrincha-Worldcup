/**
 * Syncs kickoff times from api-football into the database.
 * Matches fixtures by home+away team name (normalized).
 * Prints a diff and applies updates.
 *
 * Run: npx tsx --env-file=.env scripts/sync-kickoff-times.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// ── Name normalization map (API name → DB name) ──────────────────────────────
const NAME_MAP: Record<string, string> = {
  "Czech Republic": "Czechia",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",
  "Congo DR": "DR Congo",
  "DR Congo": "DR Congo",
  "USA": "United States",
  "United States": "United States",
  "Türkiye": "Turkiye",
  "Turkey": "Turkiye",
  "South Korea": "South Korea",
  "Korea Republic": "South Korea",
  "Scotland": "Scotland",
  "England": "England",
  "Morocco": "Morocco",
  "Cape Verde": "Cape Verde",
};

function normalizeName(name: string): string {
  return NAME_MAP[name] ?? name;
}

// ── API fetch ─────────────────────────────────────────────────────────────────

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
}

async function fetchAllFixtures(apiKey: string): Promise<ApiFixture[]> {
  const url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";
  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { response: ApiFixture[] };
  return json.response;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const THRESHOLD_MS = 60_000; // only report if diff > 1 minute

async function main() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not set");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  console.log("Fetching fixtures from api-football…");
  const apiFixtures = await fetchAllFixtures(apiKey);
  console.log(`  Got ${apiFixtures.length} fixtures from API`);

  // Build lookup: "HomeTeam|AwayTeam" → API kickoff
  const apiMap = new Map<string, { fixtureId: number; kickoffAt: Date; homeRaw: string; awayRaw: string }>();
  for (const f of apiFixtures) {
    const home = normalizeName(f.teams.home.name);
    const away = normalizeName(f.teams.away.name);
    apiMap.set(`${home}|${away}`, {
      fixtureId: f.fixture.id,
      kickoffAt: new Date(f.fixture.date),
      homeRaw: f.teams.home.name,
      awayRaw: f.teams.away.name,
    });
  }

  console.log("\nFetching matches from database…");
  const dbMatches = await prisma.match.findMany({
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: { kickoffAt: "asc" },
  });
  console.log(`  Got ${dbMatches.length} matches in DB`);

  const mismatches: Array<{
    matchId: string;
    fifaMatchNo: number | null;
    homeTeam: string;
    awayTeam: string;
    dbTime: Date;
    apiTime: Date;
    diffMinutes: number;
    fixtureId: number;
  }> = [];

  const unmatched: string[] = [];

  for (const match of dbMatches) {
    const home = match.homeTeam.name;
    const away = match.awayTeam.name;
    const key = `${home}|${away}`;
    const api = apiMap.get(key);

    if (!api) {
      unmatched.push(`Match #${match.fifaMatchNo ?? "?"}: ${home} vs ${away}`);
      continue;
    }

    const diffMs = Math.abs(match.kickoffAt.getTime() - api.kickoffAt.getTime());
    const diffMinutes = Math.round(diffMs / 60_000);

    if (diffMs > THRESHOLD_MS) {
      mismatches.push({
        matchId: match.id,
        fifaMatchNo: match.fifaMatchNo,
        homeTeam: home,
        awayTeam: away,
        dbTime: match.kickoffAt,
        apiTime: api.kickoffAt,
        diffMinutes,
        fixtureId: api.fixtureId,
      });
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────

  if (unmatched.length > 0) {
    console.log(`\n⚠️  ${unmatched.length} DB matches not found in API (probably knockouts/TBD):`);
    unmatched.forEach((m) => console.log(`  - ${m}`));
  }

  if (mismatches.length === 0) {
    console.log("\n✅ All matched fixtures have correct kickoff times — nothing to update.");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log(`\n❌ Found ${mismatches.length} kickoff time mismatch(es):\n`);
  for (const m of mismatches) {
    const dbBrussels = m.dbTime.toLocaleString("en-GB", { timeZone: "Europe/Brussels" });
    const apiBrussels = m.apiTime.toLocaleString("en-GB", { timeZone: "Europe/Brussels" });
    console.log(`  Match #${m.fifaMatchNo ?? "?"}: ${m.homeTeam} vs ${m.awayTeam}`);
    console.log(`    DB  : ${m.dbTime.toISOString()}  (${dbBrussels} Brussels)`);
    console.log(`    API : ${m.apiTime.toISOString()}  (${apiBrussels} Brussels)`);
    console.log(`    Diff: ${m.diffMinutes} minutes`);
    console.log();
  }

  // ── Apply updates ──────────────────────────────────────────────────────────

  console.log("Applying updates…");
  let updated = 0;
  for (const m of mismatches) {
    await prisma.match.update({
      where: { id: m.matchId },
      data: {
        kickoffAt: m.apiTime,
        externalMatchId: String(m.fixtureId),
      },
    });
    console.log(`  ✅ Updated #${m.fifaMatchNo ?? "?"}: ${m.homeTeam} vs ${m.awayTeam} → ${m.apiTime.toISOString()}`);
    updated++;
  }

  console.log(`\nDone — ${updated} match(es) updated.`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
