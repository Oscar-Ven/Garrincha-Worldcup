import { MatchStatus, Stage } from "@prisma/client";
export { hasDatabaseConfig, isPreviewMode } from "@/lib/app-mode";

// ─────────────────────────────────────────────────────────────────────────────
// Centers
// ─────────────────────────────────────────────────────────────────────────────

export const demoCenters = [
  { id: "demo-antwerpen-noord",      name: "GARRINCHA Antwerpen Noord",      city: "Antwerpen", country: "Belgium" },
  { id: "demo-antwerpen-zuid",       name: "GARRINCHA Antwerpen Zuid",       city: "Antwerpen", country: "Belgium" },
  { id: "demo-charleroi-dampremy",   name: "GARRINCHA Charleroi Dampremy",   city: "Charleroi", country: "Belgium" },
  { id: "demo-charleroi-montignies", name: "GARRINCHA Charleroi Montignies", city: "Charleroi", country: "Belgium" },
  { id: "demo-diegem",               name: "GARRINCHA Diegem",               city: "Diegem",    country: "Belgium" },
  { id: "demo-gent-arsenaal",        name: "GARRINCHA Gent Arsenaal",        city: "Gent",      country: "Belgium" },
  { id: "demo-gent-theloop",         name: "GARRINCHA Gent The Loop",        city: "Gent",      country: "Belgium" },
  { id: "demo-kortrijk",             name: "GARRINCHA Kortrijk",             city: "Kortrijk",  country: "Belgium" },
  { id: "demo-luik",                 name: "GARRINCHA Luik",                 city: "Luik",      country: "Belgium" },
  { id: "demo-westgate-dilbeek",     name: "GARRINCHA Westgate Dilbeek",     city: "Dilbeek",   country: "Belgium" },
];

// ─────────────────────────────────────────────────────────────────────────────
// All 104 World Cup 2026 demo matches
// Mirror of prisma/seed.ts — same groups, same kickoff schedule
// ─────────────────────────────────────────────────────────────────────────────

/** FIFA codes for all 48 seeded national teams (matches seedFifaCodes in flags.ts) */
const FIFA_CODES: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czechia": "CZE",
  "Canada": "CAN", "Switzerland": "SUI", "Qatar": "QAT", "Bosnia and Herzegovina": "BIH",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Tunisia": "TUN", "Sweden": "SWE",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Norway": "NOR", "Iraq": "IRQ",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "Uzbekistan": "UZB", "Colombia": "COL", "DR Congo": "COD",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};

/** Group structure matching prisma/seed.ts exactly */
const GROUPS: Record<string, string[]> = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Turkiye"],
  E: ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Uzbekistan", "Colombia", "DR Congo"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

/** Reproduce the seed.ts kickoff logic — deterministic UTC placeholders */
function demoKickoff(matchNo: number): Date {
  if (matchNo <= 72) {
    const groupIndex = Math.floor((matchNo - 1) / 6);
    const matchInGroup = (matchNo - 1) % 6;
    const matchday = Math.floor(matchInGroup / 2);
    const pairIndex = matchInGroup % 2;

    if (matchday === 0) {
      const groupPair = Math.floor(groupIndex / 2);
      const base = Date.UTC(2026, 5, 11 + groupPair);
      return new Date(base + (pairIndex === 0 ? 17 : 20) * 3600000);
    } else if (matchday === 1) {
      const groupPair = Math.floor(groupIndex / 2);
      const base = Date.UTC(2026, 5, 17 + groupPair);
      return new Date(base + (pairIndex === 0 ? 17 : 20) * 3600000);
    } else {
      const md3Day = Math.floor(groupIndex / 3);
      const md3Slot = groupIndex % 3;
      const base = Date.UTC(2026, 5, 23 + md3Day);
      return new Date(base + ([16, 19, 22] as const)[md3Slot] * 3600000);
    }
  }

  const k = matchNo - 72;
  if (k <= 16) {
    const day = Math.floor((k - 1) / 3);
    const slot = (k - 1) % 3;
    const base = Date.UTC(2026, 5, 27 + day);
    return new Date(base + ([17, 20, 23] as const)[slot] * 3600000);
  } else if (k <= 24) {
    const r = k - 16;
    const day = Math.floor((r - 1) / 2);
    const base = Date.UTC(2026, 6, 3 + day);
    return new Date(base + ((r - 1) % 2 === 0 ? 18 : 22) * 3600000);
  } else if (k <= 28) {
    const qf = k - 24;
    const offsets = [0, 0, 2, 2] as const;
    const hours = [18, 22, 18, 22] as const;
    return new Date(Date.UTC(2026, 6, 9) + offsets[qf - 1] * 86400000 + hours[qf - 1] * 3600000);
  } else if (k <= 30) {
    return new Date(Date.UTC(2026, 6, 13 + (k - 28), 22, 0, 0));
  } else if (k === 31) {
    return new Date(Date.UTC(2026, 6, 18, 18, 0, 0));
  } else {
    return new Date(Date.UTC(2026, 6, 19, 18, 0, 0));
  }
}

type DemoTeam = {
  id: string; name: string; fifaCode: string | null;
  flagUrl: string | null; groupName: string | null;
};

function makeTeam(name: string, groupName?: string): DemoTeam {
  const code = FIFA_CODES[name] ?? null;
  return {
    id: `team-${name.toLowerCase().replace(/[^a-z]/g, "-")}`,
    name,
    fifaCode: code,
    flagUrl: code ? `flag:${code}` : null,
    groupName: groupName ?? null,
  };
}

function makeTbd(slot: number): DemoTeam {
  return { id: `tbd-slot-${slot}`, name: "TBD", fifaCode: null, flagUrl: null, groupName: null };
}

type DemoMatch = {
  id: string; fifaMatchNo: number | null; stage: string;
  venue: string; kickoffAt: Date; status: MatchStatus;
  homeTeamId: string; awayTeamId: string;
  homeScore: number | null; awayScore: number | null;
  finalizedAt: Date | null; createdAt: Date; updatedAt: Date;
  homeTeam: DemoTeam; awayTeam: DemoTeam;
  predictions: Array<{ id: string; homeScore: number; awayScore: number; pointsAwarded: number }>;
};

function buildDemoMatches(): DemoMatch[] {
  const matches: DemoMatch[] = [];
  const now = new Date();
  let matchNo = 1;

  const PAIR_INDEXES = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]] as const;

  // Group stage (matches 1–72)
  for (const [groupName, names] of Object.entries(GROUPS)) {
    for (const [hi, ai] of PAIR_INDEXES) {
      const kickoffAt = demoKickoff(matchNo);
      const locked = now >= new Date(kickoffAt.getTime() + 5 * 60 * 1000);
      matches.push({
        id: `demo-match-${matchNo}`,
        fifaMatchNo: matchNo,
        stage: Stage.GROUP,
        venue: `Venue #${matchNo} (TBD)`,
        kickoffAt,
        status: MatchStatus.SCHEDULED,
        homeTeamId: `team-${names[hi]}`,
        awayTeamId: `team-${names[ai]}`,
        homeScore: null,
        awayScore: null,
        finalizedAt: null,
        createdAt: now,
        updatedAt: now,
        homeTeam: makeTeam(names[hi], groupName),
        awayTeam: makeTeam(names[ai], groupName),
        predictions: [],
      });
      matchNo++;
    }
  }

  // Knockout stage (matches 73–104)
  const KNOCKOUT: Array<{ stage: Stage; count: number }> = [
    { stage: Stage.ROUND_OF_32, count: 16 },
    { stage: Stage.ROUND_OF_16, count: 8 },
    { stage: Stage.QUARTER_FINAL, count: 4 },
    { stage: Stage.SEMI_FINAL, count: 2 },
    { stage: Stage.THIRD_PLACE, count: 1 },
    { stage: Stage.FINAL, count: 1 },
  ];

  let slot = 1;
  for (const { stage, count } of KNOCKOUT) {
    for (let i = 0; i < count; i++) {
      const kickoffAt = demoKickoff(matchNo);
      matches.push({
        id: `demo-match-${matchNo}`,
        fifaMatchNo: matchNo,
        stage,
        venue: `Venue #${matchNo} (TBD)`,
        kickoffAt,
        status: MatchStatus.SCHEDULED,
        homeTeamId: `tbd-slot-${slot}`,
        awayTeamId: `tbd-slot-${slot + 1}`,
        homeScore: null,
        awayScore: null,
        finalizedAt: null,
        createdAt: now,
        updatedAt: now,
        homeTeam: makeTbd(slot),
        awayTeam: makeTbd(slot + 1),
        predictions: [],
      });
      slot += 2;
      matchNo++;
    }
  }

  return matches;
}

/** All 104 World Cup 2026 match slots for demo/preview mode. */
export const demoAllMatches: DemoMatch[] = buildDemoMatches();

// ─────────────────────────────────────────────────────────────────────────────
// Legacy demoMatches — 3 sample matches for the dashboard prediction demo
// (preserved for the /dashboard page when no DB is connected)
// ─────────────────────────────────────────────────────────────────────────────

const demoTeams = {
  Brazil:  { id: "bra", name: "Brazil",  fifaCode: "BRA", flagUrl: "flag:BR", groupName: "C", createdAt: new Date(), updatedAt: new Date() },
  Belgium: { id: "bel", name: "Belgium", fifaCode: "BEL", flagUrl: "flag:BE", groupName: "G", createdAt: new Date(), updatedAt: new Date() },
  France:  { id: "fra", name: "France",  fifaCode: "FRA", flagUrl: "flag:FR", groupName: "I", createdAt: new Date(), updatedAt: new Date() },
  Morocco: { id: "mar", name: "Morocco", fifaCode: "MAR", flagUrl: "flag:MA", groupName: "C", createdAt: new Date(), updatedAt: new Date() },
};

export const demoMatches = [
  {
    id: "demo-match-1", fifaMatchNo: 12, stage: Stage.GROUP,
    venue: "Estadio Azteca",
    kickoffAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    status: MatchStatus.SCHEDULED, homeTeamId: "bra", awayTeamId: "bel",
    homeScore: null, awayScore: null, finalizedAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    homeTeam: demoTeams.Brazil, awayTeam: demoTeams.Belgium,
    predictions: [{ id: "demo-prediction-1", homeScore: 2, awayScore: 1, pointsAwarded: 0 }],
  },
  {
    id: "demo-match-2", fifaMatchNo: 18, stage: Stage.GROUP,
    venue: "MetLife Stadium",
    kickoffAt: new Date(Date.now() - 1000 * 60 * 60),
    status: MatchStatus.SCHEDULED, homeTeamId: "fra", awayTeamId: "mar",
    homeScore: null, awayScore: null, finalizedAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    homeTeam: demoTeams.France, awayTeam: demoTeams.Morocco,
    predictions: [{ id: "demo-prediction-2", homeScore: 1, awayScore: 1, pointsAwarded: 0 }],
  },
  {
    id: "demo-match-3", fifaMatchNo: 22, stage: Stage.GROUP,
    venue: "BMO Field",
    kickoffAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: MatchStatus.FINAL, homeTeamId: "bel", awayTeamId: "mar",
    homeScore: 2, awayScore: 2, finalizedAt: new Date(),
    createdAt: new Date(), updatedAt: new Date(),
    homeTeam: demoTeams.Belgium, awayTeam: demoTeams.Morocco,
    predictions: [{ id: "demo-prediction-3", homeScore: 2, awayScore: 2, pointsAwarded: 5 }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// User / leaderboard / bonus demo data
// ─────────────────────────────────────────────────────────────────────────────

export const demoLeaderboard = [
  { id: "demo-user-1", name: "Ana Martins",   nationality: "Belgium", center: "GARRINCHA Gent Arsenaal",    points: 28, predictionCount: 3 },
  { id: "demo-user-2", name: "Bilal Haddad",  nationality: "Morocco", center: "GARRINCHA Antwerpen Noord",  points: 24, predictionCount: 2 },
  { id: "demo-user-3", name: "Clara Janssens",nationality: "Belgium", center: "GARRINCHA Kortrijk",         points: 19, predictionCount: 2 },
];

export const demoUser = {
  id: "demo-user-1",
  email: "player@garrincha.local",
  displayName: "Ana Martins",
  fullName: "Ana Martins",
  nickname: "Ana",
  nationality: "Belgium",
  role: "USER" as const,
  competitionCenterId: "demo-gent-arsenaal",
  competitionCenterLockedAt: null,
  competitionCenter: { id: "demo-gent-arsenaal", name: "GARRINCHA Gent Arsenaal", country: "Belgium", city: "Gent" },
  center: { id: "demo-gent-arsenaal", name: "GARRINCHA Gent Arsenaal", country: "Belgium", city: "Gent", bannerUrl: "/branding/garrincha-banner.svg" },
};

export const demoBonusUsers = [
  { id: "demo-user-1", email: "ana@garrincha.local",   displayName: "Ana Martins" },
  { id: "demo-user-2", email: "bilal@garrincha.local", displayName: "Bilal Haddad" },
];

export const demoBonusEvents = [
  { id: "demo-bonus-1", reason: "Community challenge winner", points: 3, user: { email: "ana@garrincha.local", displayName: "Ana Martins" } },
];
