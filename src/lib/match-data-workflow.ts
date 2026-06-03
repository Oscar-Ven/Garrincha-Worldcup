import { isPredictionLocked, type Score } from "@/lib/scoring";

export type MatchDataProvider = "manual" | "football-data.org" | "sportmonks" | "api-football";

export type ExternalMatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type StoredMatchSnapshot = {
  id: string;
  fifaMatchNo: number | null;
  kickoffAt: Date;
  status: "SCHEDULED" | "LIVE" | "FINAL";
  homeTeamName: string;
  awayTeamName: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  predictionCount: number;
};

export type IncomingMatchData = {
  fifaMatchNo: number | null;
  kickoffAt?: Date;
  homeTeamName?: string;
  awayTeamName?: string;
  venue?: string;
  status: ExternalMatchStatus;
  finalScore?: Score;
  provider: MatchDataProvider;
};

export type MatchDataWorkflowPlan = {
  preserveMatchId: true;
  preservePredictions: true;
  canUpdateFixtureFields: boolean;
  canUpdateTeams: boolean;
  canMarkLive: boolean;
  canStoreFinalScoreDraft: boolean;
  requiresAdminConfirmation: boolean;
  shouldRecalculatePoints: false;
  warnings: string[];
};

export type FootballDataEnvStatus = {
  provider: string;
  competitionCode: string;
  season: string;
  apiKey: "missing" | "set";
  ready: boolean;
};

const TBD_PATTERNS = ["TBD", "TBC", "UNKNOWN", "PLACEHOLDER", "SLOT"];

export function isUnknownTeamName(name: string) {
  const normalized = name.trim().toUpperCase();
  return !normalized || TBD_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function footballDataEnvStatus(env: Partial<NodeJS.ProcessEnv> = process.env): FootballDataEnvStatus {
  const provider = env.FOOTBALL_DATA_PROVIDER?.trim() || "football-data.org";
  const competitionCode = env.FOOTBALL_DATA_COMPETITION_CODE?.trim() || "WC";
  const season = env.FOOTBALL_DATA_SEASON?.trim() || "2026";
  const apiKey = env.FOOTBALL_DATA_API_KEY?.trim() ? "set" : "missing";

  return {
    provider,
    competitionCode,
    season,
    apiKey,
    ready: apiKey === "set" && Boolean(provider && competitionCode && season),
  };
}

export function createMatchDataWorkflowPlan({
  current,
  incoming,
  now = new Date(),
}: {
  current: StoredMatchSnapshot;
  incoming: IncomingMatchData;
  now?: Date;
}): MatchDataWorkflowPlan {
  const warnings: string[] = [];
  const hasPredictions = current.predictionCount > 0;
  const locked = isPredictionLocked(current.kickoffAt, now);
  const finalized = current.status === "FINAL";
  const incomingHasFinalScore = incoming.status === "FINISHED" && Boolean(incoming.finalScore);
  const hasLockedKickoffChange =
    hasPredictions &&
    Boolean(incoming.kickoffAt) &&
    locked &&
    incoming.kickoffAt?.getTime() !== current.kickoffAt.getTime();

  if (incoming.fifaMatchNo !== null && current.fifaMatchNo !== null && incoming.fifaMatchNo !== current.fifaMatchNo) {
    warnings.push("Incoming match number does not match the stored match slot.");
  }

  if (incoming.status === "POSTPONED" || incoming.status === "CANCELLED") {
    warnings.push("Match postponement/cancellation requires campaign-rule and admin review.");
  }

  if (finalized && incomingHasFinalScore) {
    warnings.push("Stored match is already final; provider score changes need admin review before recalculation.");
  }

  if (hasLockedKickoffChange) {
    warnings.push("Kickoff changed after predictions locked; admin review is required.");
  }

  const canUpdateTeams =
    !finalized &&
    (isUnknownTeamName(current.homeTeamName) ||
      isUnknownTeamName(current.awayTeamName) ||
      current.predictionCount === 0 ||
      !locked);

  return {
    preserveMatchId: true,
    preservePredictions: true,
    canUpdateFixtureFields: !finalized && incoming.status !== "CANCELLED" && !hasLockedKickoffChange,
    canUpdateTeams,
    canMarkLive: incoming.status === "LIVE" && !finalized,
    canStoreFinalScoreDraft: incomingHasFinalScore,
    requiresAdminConfirmation:
      incomingHasFinalScore ||
      incoming.status === "POSTPONED" ||
      incoming.status === "CANCELLED" ||
      warnings.length > 0,
    shouldRecalculatePoints: false,
    warnings,
  };
}
