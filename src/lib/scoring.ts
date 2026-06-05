export type Score = {
  homeScore: number;
  awayScore: number;
};

export type MatchOutcome = "HOME" | "DRAW" | "AWAY";

export function outcome(score: Score): MatchOutcome {
  if (score.homeScore > score.awayScore) return "HOME";
  if (score.homeScore < score.awayScore) return "AWAY";
  return "DRAW";
}

export function calculatePredictionPoints(prediction: Score, finalScore: Score): number {
  if (prediction.homeScore === finalScore.homeScore && prediction.awayScore === finalScore.awayScore) {
    return 5;
  }
  if (outcome(prediction) === outcome(finalScore)) {
    const predDiff = prediction.homeScore - prediction.awayScore;
    const finalDiff = finalScore.homeScore - finalScore.awayScore;
    if (predDiff === finalDiff) {
      return 3;
    }
    return 2;
  }
  return 0;
}

export function getPredictionLockAt(kickoffAt: Date): Date {
  return new Date(kickoffAt.getTime() - 5 * 60 * 1000);
}

export function isPredictionLocked(kickoffAt: Date, now = new Date()) {
  return now >= new Date(kickoffAt.getTime() - 5 * 60 * 1000);
}
