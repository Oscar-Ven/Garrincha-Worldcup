import { describe, expect, it } from "vitest";
import { calculatePredictionPoints, isPredictionLocked, outcome, getPredictionLockAt } from "@/lib/scoring";

describe("outcome detection", () => {
  it("returns HOME when home score is greater", () => {
    expect(outcome({ homeScore: 2, awayScore: 1 })).toBe("HOME");
    expect(outcome({ homeScore: 1, awayScore: 0 })).toBe("HOME");
  });

  it("returns AWAY when away score is greater", () => {
    expect(outcome({ homeScore: 0, awayScore: 1 })).toBe("AWAY");
    expect(outcome({ homeScore: 1, awayScore: 3 })).toBe("AWAY");
  });

  it("returns DRAW when scores are equal", () => {
    expect(outcome({ homeScore: 1, awayScore: 1 })).toBe("DRAW");
    expect(outcome({ homeScore: 0, awayScore: 0 })).toBe("DRAW");
  });
});

describe("calculatePredictionPoints", () => {
  it("awards 5 points for exact score", () => {
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 0, awayScore: 0 }, { homeScore: 0, awayScore: 0 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 3, awayScore: 2 }, { homeScore: 3, awayScore: 2 })).toBe(5);
  });

  it("awards 3 points for correct outcome and same goal difference", () => {
    expect(calculatePredictionPoints({ homeScore: 3, awayScore: 1 }, { homeScore: 2, awayScore: 0 })).toBe(3);
    expect(calculatePredictionPoints({ homeScore: 1, awayScore: 3 }, { homeScore: 0, awayScore: 2 })).toBe(3);
  });

  it("awards 2 points for correct outcome only (different goal difference)", () => {
    // HOME win, pred GD=1, final GD=2 — different GD → 2 pts
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 1 })).toBe(2);
    // AWAY win, pred GD=-1, final GD=-2 — different GD → 2 pts
    expect(calculatePredictionPoints({ homeScore: 0, awayScore: 1 }, { homeScore: 0, awayScore: 2 })).toBe(2);
  });

  it("awards 3 points for correct draw prediction with different scores (e.g. 2-2 vs 1-1)", () => {
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 2 }, { homeScore: 1, awayScore: 1 })).toBe(3);
    expect(calculatePredictionPoints({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 2 })).toBe(3);
    expect(calculatePredictionPoints({ homeScore: 0, awayScore: 0 }, { homeScore: 1, awayScore: 1 })).toBe(3);
  });

  it("awards 0 points for wrong outcome", () => {
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 3 })).toBe(0);
    expect(calculatePredictionPoints({ homeScore: 0, awayScore: 0 }, { homeScore: 2, awayScore: 0 })).toBe(0);
    expect(calculatePredictionPoints({ homeScore: 1, awayScore: 0 }, { homeScore: 1, awayScore: 1 })).toBe(0);
  });
});

describe("isPredictionLocked", () => {
  const kickoff = new Date("2026-06-11T17:00:00.000Z");

  it("is NOT locked 6 minutes before kickoff", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-11T16:54:00.000Z"))).toBe(false);
  });

  it("is NOT locked 5 minutes and 1 second before kickoff", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-11T16:54:59.000Z"))).toBe(false);
  });

  it("is locked exactly 5 minutes before kickoff (now === kickoffAt - 5min)", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-11T16:55:00.000Z"))).toBe(true);
  });

  it("is locked 4 minutes before kickoff", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-11T16:56:00.000Z"))).toBe(true);
  });

  it("is locked at kickoff", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-11T17:00:00.000Z"))).toBe(true);
  });

  it("is locked after kickoff", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-11T17:06:00.000Z"))).toBe(true);
  });
});

describe("getPredictionLockAt", () => {
  it("returns a Date that is kickoffAt - 5 minutes", () => {
    const kickoff = new Date("2026-06-11T17:00:00.000Z");
    const lockAt = getPredictionLockAt(kickoff);
    expect(lockAt).toBeInstanceOf(Date);
    expect(lockAt.getTime()).toBe(new Date("2026-06-11T16:55:00.000Z").getTime());
  });

  it("works for any kickoff time", () => {
    const kickoff = new Date("2026-07-04T20:00:00.000Z");
    const lockAt = getPredictionLockAt(kickoff);
    expect(lockAt.getTime()).toBe(new Date("2026-07-04T19:55:00.000Z").getTime());
  });
});
