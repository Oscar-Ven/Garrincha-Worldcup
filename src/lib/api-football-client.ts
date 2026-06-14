import "server-only";

import type { ExternalMatchStatus, IncomingMatchData, MatchDataProvider } from "@/lib/match-data-workflow";

const BASE_URL = "https://v3.football.api-sports.io";

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE", "SUSP"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

function mapStatus(short: string): ExternalMatchStatus {
  if (LIVE_STATUSES.has(short)) return "LIVE";
  if (FINISHED_STATUSES.has(short)) return "FINISHED";
  if (short === "PST") return "POSTPONED";
  if (short === "CANC" || short === "ABD") return "CANCELLED";
  return "SCHEDULED";
}

// ---------------------------------------------------------------------------
// Raw API response types
// ---------------------------------------------------------------------------

interface ApiTeam {
  id: number;
  name: string;
  logo: string;
}

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  teams: {
    home: ApiTeam;
    away: ApiTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type MappedFixture = IncomingMatchData & {
  externalId: string;
  kickoffAt: Date;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamName: string;
  awayTeamLogo: string;
};

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapFixture(f: ApiFixture): MappedFixture {
  const statusShort = f.fixture.status.short;
  const status = mapStatus(statusShort);
  const isFinished = status === "FINISHED";
  const hasGoals = f.goals.home !== null && f.goals.away !== null;
  const wentToPenalties = statusShort === "PEN";
  const hasPenaltyScores = f.score?.penalty?.home != null && f.score?.penalty?.away != null;

  let penaltyResult: MappedFixture["penaltyResult"] | undefined;
  if (wentToPenalties && hasPenaltyScores) {
    const ph = f.score.penalty.home as number;
    const pa = f.score.penalty.away as number;
    penaltyResult = {
      wentToPenalties: true,
      penaltyWinner: ph > pa ? "home" : "away",
      homePenaltyScore: ph,
      awayPenaltyScore: pa,
    };
  } else if (wentToPenalties) {
    penaltyResult = {
      wentToPenalties: true,
      penaltyWinner: null,
      homePenaltyScore: null,
      awayPenaltyScore: null,
    };
  }

  return {
    provider: "api-football" as MatchDataProvider,
    fifaMatchNo: null,
    externalId: String(f.fixture.id),
    kickoffAt: new Date(f.fixture.date),
    homeTeamName: f.teams.home.name,
    homeTeamLogo: f.teams.home.logo,
    awayTeamName: f.teams.away.name,
    awayTeamLogo: f.teams.away.logo,
    status,
    finalScore:
      isFinished && hasGoals
        ? { homeScore: f.goals.home as number, awayScore: f.goals.away as number }
        : undefined,
    penaltyResult,
  };
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function apiFetch(apiKey: string, path: string): Promise<ApiFixture[]> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`api-football ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { response: ApiFixture[] };
  return Array.isArray(json.response) ? json.response : [];
}

// ---------------------------------------------------------------------------
// Public fetchers
// ---------------------------------------------------------------------------

export async function fetchLiveFixtures(
  apiKey: string,
  leagueId: string,
): Promise<MappedFixture[]> {
  const raw = await apiFetch(apiKey, `/fixtures?league=${leagueId}&live=all`);
  return raw.map(mapFixture);
}

export async function fetchTodayFixtures(
  apiKey: string,
  leagueId: string,
  season: string,
): Promise<MappedFixture[]> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await apiFetch(apiKey, `/fixtures?league=${leagueId}&season=${season}&date=${today}`);
  return raw.map(mapFixture);
}

/** Fetch specific fixtures by their api-football IDs (for recovering stuck LIVE matches). */
export async function fetchFixturesByIds(
  apiKey: string,
  ids: string[],
): Promise<MappedFixture[]> {
  if (ids.length === 0) return [];
  const results = await Promise.all(
    ids.map((id) => apiFetch(apiKey, `/fixtures?id=${id}`).catch(() => [] as ApiFixture[])),
  );
  return results.flat().map(mapFixture);
}
