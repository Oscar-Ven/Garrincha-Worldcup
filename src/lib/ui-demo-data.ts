import { MatchStatus, Stage } from "@prisma/client";
export { hasDatabaseConfig, isPreviewMode } from "@/lib/app-mode";

export const demoCenters = [
  { id: "demo-gent-arsenaal", name: "GARRINCHA Gent Arsenaal", city: "Gent", country: "Belgium" },
  { id: "demo-antwerpen-noord", name: "GARRINCHA Antwerpen Noord", city: "Antwerpen", country: "Belgium" },
  { id: "demo-kortrijk", name: "GARRINCHA Kortrijk", city: "Kortrijk", country: "Belgium" },
  { id: "demo-diegem", name: "GARRINCHA Diegem", city: "Diegem", country: "Belgium" },
];

export const demoLeaderboard = [
  {
    id: "demo-user-1",
    name: "Ana Martins",
    nationality: "Belgium",
    center: "GARRINCHA Gent Arsenaal",
    points: 28,
  },
  {
    id: "demo-user-2",
    name: "Bilal Haddad",
    nationality: "Morocco",
    center: "GARRINCHA Antwerpen Noord",
    points: 24,
  },
  {
    id: "demo-user-3",
    name: "Clara Janssens",
    nationality: "Belgium",
    center: "GARRINCHA Kortrijk",
    points: 19,
  },
];

const demoTeams = {
  Brazil: { id: "bra", name: "Brazil", fifaCode: "BRA", flagUrl: "flag:BR", groupName: "C", createdAt: new Date(), updatedAt: new Date() },
  Belgium: { id: "bel", name: "Belgium", fifaCode: "BEL", flagUrl: "flag:BE", groupName: "G", createdAt: new Date(), updatedAt: new Date() },
  France: { id: "fra", name: "France", fifaCode: "FRA", flagUrl: "flag:FR", groupName: "I", createdAt: new Date(), updatedAt: new Date() },
  Morocco: { id: "mar", name: "Morocco", fifaCode: "MAR", flagUrl: "flag:MA", groupName: "C", createdAt: new Date(), updatedAt: new Date() },
};

export const demoMatches = [
  {
    id: "demo-match-1",
    fifaMatchNo: 12,
    stage: Stage.GROUP,
    venue: "Estadio Azteca",
    kickoffAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    status: MatchStatus.SCHEDULED,
    homeTeamId: "bra",
    awayTeamId: "bel",
    homeScore: null,
    awayScore: null,
    finalizedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    homeTeam: demoTeams.Brazil,
    awayTeam: demoTeams.Belgium,
    predictions: [{ id: "demo-prediction-1", homeScore: 2, awayScore: 1, pointsAwarded: 0 }],
  },
  {
    id: "demo-match-2",
    fifaMatchNo: 18,
    stage: Stage.GROUP,
    venue: "MetLife Stadium",
    kickoffAt: new Date(Date.now() - 1000 * 60 * 60),
    status: MatchStatus.SCHEDULED,
    homeTeamId: "fra",
    awayTeamId: "mar",
    homeScore: null,
    awayScore: null,
    finalizedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    homeTeam: demoTeams.France,
    awayTeam: demoTeams.Morocco,
    predictions: [{ id: "demo-prediction-2", homeScore: 1, awayScore: 1, pointsAwarded: 0 }],
  },
  {
    id: "demo-match-3",
    fifaMatchNo: 22,
    stage: Stage.GROUP,
    venue: "BMO Field",
    kickoffAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: MatchStatus.FINAL,
    homeTeamId: "bel",
    awayTeamId: "mar",
    homeScore: 2,
    awayScore: 2,
    finalizedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    homeTeam: demoTeams.Belgium,
    awayTeam: demoTeams.Morocco,
    predictions: [{ id: "demo-prediction-3", homeScore: 2, awayScore: 2, pointsAwarded: 5 }],
  },
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
  competitionCenter: {
    id: "demo-gent-arsenaal",
    name: "GARRINCHA Gent Arsenaal",
    country: "Belgium",
    city: "Gent",
  },
  center: {
    id: "demo-gent-arsenaal",
    name: "GARRINCHA Gent Arsenaal",
    country: "Belgium",
    city: "Gent",
    bannerUrl: "/branding/garrincha-banner.svg",
  },
};

export const demoBonusUsers = [
  { id: "demo-user-1", email: "ana@garrincha.local", displayName: "Ana Martins" },
  { id: "demo-user-2", email: "bilal@garrincha.local", displayName: "Bilal Haddad" },
];

export const demoBonusEvents = [
  {
    id: "demo-bonus-1",
    reason: "Community challenge winner",
    points: 3,
    user: { email: "ana@garrincha.local", displayName: "Ana Martins" },
  },
];
