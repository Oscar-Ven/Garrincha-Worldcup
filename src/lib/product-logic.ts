import { calculatePredictionPoints, isPredictionLocked, type Score } from "@/lib/scoring";

export type AppRole = "USER" | "ADMIN" | "CENTER_ADMIN" | "SUPER_ADMIN";

export type SessionLike = {
  userId: string;
  role: AppRole;
} | null;

export type RuleResult =
  | { allowed: true }
  | { allowed: false; status: number; reason: string };

export type PredictionRecord = {
  id: string;
  userId: string;
  homeScore: number;
  awayScore: number;
};

export type PredictionPointUpdate = {
  id: string;
  pointsAwarded: number;
  calculatedAt: Date;
};

export type LeaderboardInputUser = {
  id: string;
  displayName: string | null;
  nickname?: string | null;
  fullName?: string | null;
  email: string;
  nationality: string | null;
  competitionCenter: { name: string } | null;
  predictions: Array<{ pointsAwarded: number }>;
  pointEvents: Array<{ points: number }>;
};

export type LeaderboardRow = {
  id: string;
  name: string;
  nationality: string;
  center: string;
  points: number;
  predictionCount: number;
};

export function leaderboardDisplayName(user: Pick<LeaderboardInputUser, "id" | "displayName" | "nickname" | "fullName">) {
  const nickname = user.nickname?.trim();
  if (nickname) return nickname;
  const fullName = user.fullName?.trim();
  if (fullName) return fullName;
  const displayName = user.displayName?.trim();
  if (displayName) return displayName;
  return `Player ${user.id.slice(-6).toUpperCase()}`;
}

export function canAccessAdmin(session: SessionLike): RuleResult {
  if (!session || (session.role !== "ADMIN" && session.role !== "CENTER_ADMIN" && session.role !== "SUPER_ADMIN")) {
    return { allowed: false, status: 403, reason: "Admin access required." };
  }

  return { allowed: true };
}

export function canAccessSuperAdmin(session: SessionLike): RuleResult {
  if (!session || session.role !== "SUPER_ADMIN") {
    return { allowed: false, status: 403, reason: "Super admin access required." };
  }

  return { allowed: true };
}

export function canSavePrediction({
  session,
  kickoffAt,
  predictionUserId,
  now = new Date(),
}: {
  session: SessionLike;
  kickoffAt: Date;
  predictionUserId?: string | null;
  now?: Date;
}): RuleResult {
  if (!session || session.role !== "USER") {
    return { allowed: false, status: 401, reason: "Please log in to save predictions." };
  }

  if (predictionUserId && predictionUserId !== session.userId) {
    return { allowed: false, status: 403, reason: "You can only edit your own predictions." };
  }

  if (isPredictionLocked(kickoffAt, now)) {
    return { allowed: false, status: 423, reason: "Predictions close 5 minutes before kickoff." };
  }

  return { allowed: true };
}

export function recalculatePredictionPoints({
  predictions,
  finalScore,
  calculatedAt = new Date(),
}: {
  predictions: PredictionRecord[];
  finalScore: Score;
  calculatedAt?: Date;
}): PredictionPointUpdate[] {
  return predictions.map((prediction) => ({
    id: prediction.id,
    pointsAwarded: calculatePredictionPoints({ homeScore: prediction.homeScore, awayScore: prediction.awayScore }, finalScore),
    calculatedAt,
  }));
}

export function canAwardBonus({
  session,
  reason,
}: {
  session: SessionLike;
  reason: string;
}): RuleResult {
  const admin = canAccessAdmin(session);
  if (!admin.allowed) return admin;

  if (reason.trim().length < 3) {
    return { allowed: false, status: 400, reason: "Bonus points require a reason." };
  }

  return { allowed: true };
}

export function createLeaderboardRows(users: LeaderboardInputUser[], limit?: number): LeaderboardRow[] {
  const rows = users
    .filter((user) => user.id && user.competitionCenter !== null)
    .map((user) => ({
      id: user.id,
      name: leaderboardDisplayName(user),
      nationality: user.nationality || "Unspecified",
      center: user.competitionCenter?.name ?? "Unspecified",
      points:
        user.predictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0) +
        user.pointEvents.reduce((sum, event) => sum + event.points, 0),
      predictionCount: user.predictions.length,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export function filterLeaderboardByNationality(rows: LeaderboardRow[], nationality: string) {
  return rows.filter((row) => row.nationality === nationality);
}

export function filterLeaderboardByCenter(rows: LeaderboardRow[], center: string) {
  return rows.filter((row) => row.center === center);
}
