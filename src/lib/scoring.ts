export type Score = {
  homeScore: number;
  awayScore: number;
};

export type PenaltyResult = {
  wentToPenalties: boolean;
  penaltyWinner: string | null; // "home" | "away"
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

export type MatchOutcome = "HOME" | "DRAW" | "AWAY";

export function outcome(score: Score): MatchOutcome {
  if (score.homeScore > score.awayScore) return "HOME";
  if (score.homeScore < score.awayScore) return "AWAY";
  return "DRAW";
}

export function calculatePredictionPoints(
  prediction: Score & {
    penaltyWinner?: string | null;
    homePenaltyScore?: number | null;
    awayPenaltyScore?: number | null;
  },
  finalScore: Score,
  penalty?: PenaltyResult | null,
): number {
  // Base score (0 / 2 / 3 / 5) — same for all stages.
  let points = 0;
  if (prediction.homeScore === finalScore.homeScore && prediction.awayScore === finalScore.awayScore) {
    points = 5;
  } else if (outcome(prediction) === outcome(finalScore)) {
    const predDiff = prediction.homeScore - prediction.awayScore;
    const finalDiff = finalScore.homeScore - finalScore.awayScore;
    points = predDiff === finalDiff ? 3 : 2;
  }

  // Penalty bonus — knockout only, awarded only when the match went to penalties
  // and the player predicted the draw (and provided a penalty winner).
  if (
    penalty?.wentToPenalties &&
    penalty.penaltyWinner &&
    prediction.penaltyWinner
  ) {
    if (prediction.penaltyWinner === penalty.penaltyWinner) {
      points += 2; // +2 correct penalty winner
      if (
        prediction.homePenaltyScore != null &&
        prediction.awayPenaltyScore != null &&
        prediction.homePenaltyScore === penalty.homePenaltyScore &&
        prediction.awayPenaltyScore === penalty.awayPenaltyScore
      ) {
        points += 1; // +1 exact penalty score
      }
    }
  }

  return points;
}

const PREDICTION_LOCK_WINDOW_MS = 5 * 60 * 1000;

export function getPredictionLockAt(kickoffAt: Date): Date {
  return new Date(kickoffAt.getTime() - PREDICTION_LOCK_WINDOW_MS);
}

export function isPredictionLocked(kickoffAt: Date, now = new Date()) {
  return now >= new Date(kickoffAt.getTime() - PREDICTION_LOCK_WINDOW_MS);
}
