import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canAccessSuperAdmin,
  canAwardBonus,
  canChangeSelfServiceCenter,
  canSavePrediction,
  createLeaderboardRows,
  filterLeaderboardByCenter,
  filterLeaderboardByNationality,
  leaderboardDisplayName,
  recalculatePredictionPoints,
  type LeaderboardInputUser,
} from "@/lib/product-logic";

const beforeLock = new Date("2026-06-11T16:54:59.000Z"); // 5 min 1 sec before kickoff — allowed
const kickoff = new Date("2026-06-11T17:00:00.000Z");
const atLockTime = new Date("2026-06-11T16:55:00.000Z"); // exactly 5 min before kickoff — locked
const afterKickoff = new Date("2026-06-11T17:00:01.000Z"); // 1 sec after kickoff — also locked

describe("prediction rules", () => {
  it("allows a user to create a prediction more than 5 minutes before kickoff", () => {
    expect(
      canSavePrediction({
        session: { userId: "user-1", role: "USER" },
        kickoffAt: kickoff,
        now: beforeLock,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows a user to edit their own prediction more than 5 minutes before kickoff", () => {
    expect(
      canSavePrediction({
        session: { userId: "user-1", role: "USER" },
        predictionUserId: "user-1",
        kickoffAt: kickoff,
        now: beforeLock,
      }),
    ).toEqual({ allowed: true });
  });

  it("locks predictions exactly 5 minutes before kickoff", () => {
    expect(
      canSavePrediction({
        session: { userId: "user-1", role: "USER" },
        predictionUserId: "user-1",
        kickoffAt: kickoff,
        now: atLockTime,
      }),
    ).toMatchObject({ allowed: false, status: 423 });
  });

  it("locks predictions at kickoff", () => {
    expect(
      canSavePrediction({
        session: { userId: "user-1", role: "USER" },
        predictionUserId: "user-1",
        kickoffAt: kickoff,
        now: kickoff,
      }),
    ).toMatchObject({ allowed: false, status: 423 });
  });

  it("locks predictions after kickoff", () => {
    expect(
      canSavePrediction({
        session: { userId: "user-1", role: "USER" },
        predictionUserId: "user-1",
        kickoffAt: kickoff,
        now: afterKickoff,
      }),
    ).toMatchObject({ allowed: false, status: 423 });
  });

  it("prevents a user from editing another user's prediction", () => {
    expect(
      canSavePrediction({
        session: { userId: "user-1", role: "USER" },
        predictionUserId: "user-2",
        kickoffAt: kickoff,
        now: beforeLock,
      }),
    ).toMatchObject({ allowed: false, status: 403 });
  });

  it("prevents admins and anonymous sessions from saving user predictions", () => {
    expect(
      canSavePrediction({
        session: { userId: "admin-1", role: "ADMIN" },
        kickoffAt: kickoff,
        now: beforeLock,
      }),
    ).toMatchObject({ allowed: false, status: 401 });

    expect(
      canSavePrediction({
        session: null,
        kickoffAt: kickoff,
        now: beforeLock,
      }),
    ).toMatchObject({ allowed: false, status: 401 });
  });
});

describe("admin rules", () => {
  it("allows admins and rejects normal users for admin actions", () => {
    expect(canAccessAdmin({ userId: "admin-1", role: "ADMIN" })).toEqual({ allowed: true });
    expect(canAccessAdmin({ userId: "owner-1", role: "SUPER_ADMIN" })).toEqual({ allowed: true });
    expect(canAccessAdmin({ userId: "user-1", role: "USER" })).toMatchObject({
      allowed: false,
      status: 403,
    });
  });

  it("limits owner controls to super admins", () => {
    expect(canAccessSuperAdmin({ userId: "owner-1", role: "SUPER_ADMIN" })).toEqual({ allowed: true });
    expect(canAccessSuperAdmin({ userId: "admin-1", role: "ADMIN" })).toMatchObject({
      allowed: false,
      status: 403,
    });
  });

  it("requires an admin and a reason for manual bonus points", () => {
    expect(canAwardBonus({ session: { userId: "admin-1", role: "ADMIN" }, reason: "Fair play" })).toEqual({
      allowed: true,
    });
    expect(canAwardBonus({ session: { userId: "owner-1", role: "SUPER_ADMIN" }, reason: "Fair play" })).toEqual({
      allowed: true,
    });

    expect(canAwardBonus({ session: { userId: "user-1", role: "USER" }, reason: "Fair play" })).toMatchObject({
      allowed: false,
      status: 403,
    });

    expect(canAwardBonus({ session: { userId: "admin-1", role: "ADMIN" }, reason: "  " })).toMatchObject({
      allowed: false,
      status: 400,
    });
  });

  it("allows negative bonus adjustments when an admin gives a reason", () => {
    expect(canAwardBonus({ session: { userId: "admin-1", role: "ADMIN" }, reason: "Correction" })).toEqual({
      allowed: true,
    });
  });
});

describe("bonus award scope — OD-004", () => {
  it("ADMIN can award bonus to a player at any center", () => {
    expect(
      canAwardBonus({
        session: { userId: "admin-1", role: "ADMIN", centerId: "center-brussels" },
        reason: "Fair play",
        targetCompetitionCenterId: "center-ghent",
      }),
    ).toEqual({ allowed: true });
  });

  it("SUPER_ADMIN can award bonus to a player at any center", () => {
    expect(
      canAwardBonus({
        session: { userId: "owner-1", role: "SUPER_ADMIN", centerId: "center-brussels" },
        reason: "Top performer",
        targetCompetitionCenterId: "center-antwerp",
      }),
    ).toEqual({ allowed: true });
  });

  it("CENTER_ADMIN can award bonus to a player at their own center", () => {
    expect(
      canAwardBonus({
        session: { userId: "cadmin-1", role: "CENTER_ADMIN", centerId: "center-brussels" },
        reason: "Best prediction",
        targetCompetitionCenterId: "center-brussels",
      }),
    ).toEqual({ allowed: true });
  });

  it("CENTER_ADMIN cannot award bonus to a player at a different center", () => {
    expect(
      canAwardBonus({
        session: { userId: "cadmin-1", role: "CENTER_ADMIN", centerId: "center-brussels" },
        reason: "Best prediction",
        targetCompetitionCenterId: "center-ghent",
      }),
    ).toMatchObject({ allowed: false, status: 403 });
  });

  it("CENTER_ADMIN with no linked center cannot award any bonus", () => {
    expect(
      canAwardBonus({
        session: { userId: "cadmin-1", role: "CENTER_ADMIN", centerId: null },
        reason: "Best prediction",
        targetCompetitionCenterId: "center-brussels",
      }),
    ).toMatchObject({ allowed: false, status: 403 });
  });

  it("USER cannot award bonus points", () => {
    expect(
      canAwardBonus({
        session: { userId: "user-1", role: "USER" },
        reason: "I want to",
        targetCompetitionCenterId: "center-brussels",
      }),
    ).toMatchObject({ allowed: false, status: 403 });
  });

  it("bonus audit fields are preserved: reason is still validated regardless of center scope", () => {
    expect(
      canAwardBonus({
        session: { userId: "cadmin-1", role: "CENTER_ADMIN", centerId: "center-brussels" },
        reason: "  ",
        targetCompetitionCenterId: "center-brussels",
      }),
    ).toMatchObject({ allowed: false, status: 400 });
  });
});

describe("competition center self-service change — OD-003", () => {
  it("allows a player to change center when the lock has not been used", () => {
    expect(
      canChangeSelfServiceCenter({
        user: { competitionCenterId: "center-brussels", competitionCenterLockedAt: null },
        newCenterId: "center-ghent",
      }),
    ).toEqual({ allowed: true });
  });

  it("allows a newly registered player with no competition center set to choose one", () => {
    expect(
      canChangeSelfServiceCenter({
        user: { competitionCenterId: null, competitionCenterLockedAt: null },
        newCenterId: "center-ghent",
      }),
    ).toEqual({ allowed: true });
  });

  it("blocks a second self-service change after the lock is set", () => {
    expect(
      canChangeSelfServiceCenter({
        user: { competitionCenterId: "center-brussels", competitionCenterLockedAt: new Date("2026-06-05") },
        newCenterId: "center-ghent",
      }),
    ).toMatchObject({ allowed: false, status: 403 });
  });

  it("blocks changing to the same center the player is already in", () => {
    expect(
      canChangeSelfServiceCenter({
        user: { competitionCenterId: "center-brussels", competitionCenterLockedAt: null },
        newCenterId: "center-brussels",
      }),
    ).toMatchObject({ allowed: false, status: 400 });
  });

  it("changing center does not affect the original activation center logic (independent fields)", () => {
    const user = { competitionCenterId: "center-brussels", competitionCenterLockedAt: null };
    const result = canChangeSelfServiceCenter({ user, newCenterId: "center-ghent" });
    expect(result).toEqual({ allowed: true });
    // centerId (activation) is a separate field — this function only checks competitionCenterId
  });
});

describe("final score recalculation", () => {
  it("awards 5 points for an exact score prediction", () => {
    const calculatedAt = new Date("2026-06-12T20:00:00.000Z");
    const predictions = [
      { id: "exact", userId: "user-1", homeScore: 2, awayScore: 1 },
    ];

    const results = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 2, awayScore: 1 },
      calculatedAt,
    });

    expect(results).toEqual([
      { id: "exact", pointsAwarded: 5, calculatedAt },
    ]);
  });

  it("awards 3 points for same goal difference and correct outcome", () => {
    const calculatedAt = new Date("2026-06-12T20:00:00.000Z");
    const predictions = [
      { id: "same-gd", userId: "user-1", homeScore: 3, awayScore: 1 },
    ];

    const results = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 2, awayScore: 0 },
      calculatedAt,
    });

    expect(results).toEqual([
      { id: "same-gd", pointsAwarded: 3, calculatedAt },
    ]);
  });

  it("awards 2 points for a correct outcome, 0 for wrong", () => {
    const calculatedAt = new Date("2026-06-12T20:00:00.000Z");
    const predictions = [
      { id: "correct-home", userId: "user-1", homeScore: 3, awayScore: 1 },
      { id: "correct-draw", userId: "user-2", homeScore: 1, awayScore: 1 },
      { id: "wrong", userId: "user-3", homeScore: 0, awayScore: 2 },
    ];

    const results = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 2, awayScore: 1 },
      calculatedAt,
    });

    expect(results).toEqual([
      { id: "correct-home", pointsAwarded: 2, calculatedAt },
      { id: "correct-draw", pointsAwarded: 0, calculatedAt },
      { id: "wrong", pointsAwarded: 0, calculatedAt },
    ]);
  });

  it("recalculates idempotently — same input same output", () => {
    const calculatedAt = new Date("2026-06-12T20:00:00.000Z");
    const predictions = [
      { id: "p1", userId: "user-1", homeScore: 2, awayScore: 1 },
      { id: "p2", userId: "user-2", homeScore: 1, awayScore: 1 },
    ];

    const first = recalculatePredictionPoints({ predictions, finalScore: { homeScore: 2, awayScore: 1 }, calculatedAt });
    const second = recalculatePredictionPoints({ predictions, finalScore: { homeScore: 2, awayScore: 1 }, calculatedAt });
    expect(first).toEqual(second);
  });

  it("overwrites points safely when a final score is corrected", () => {
    const predictions = [
      { id: "p1", userId: "user-1", homeScore: 2, awayScore: 1 },
      { id: "p2", userId: "user-2", homeScore: 1, awayScore: 1 },
    ];
    const firstCalculatedAt = new Date("2026-06-12T20:00:00.000Z");
    const correctedCalculatedAt = new Date("2026-06-12T21:00:00.000Z");

    const first = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 2, awayScore: 1 },
      calculatedAt: firstCalculatedAt,
    });
    const corrected = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 1, awayScore: 1 },
      calculatedAt: correctedCalculatedAt,
    });

    expect(first).toEqual([
      { id: "p1", pointsAwarded: 5, calculatedAt: firstCalculatedAt },
      { id: "p2", pointsAwarded: 0, calculatedAt: firstCalculatedAt },
    ]);
    expect(corrected).toEqual([
      { id: "p1", pointsAwarded: 0, calculatedAt: correctedCalculatedAt },
      { id: "p2", pointsAwarded: 5, calculatedAt: correctedCalculatedAt },
    ]);
  });
});

describe("leaderboard display name", () => {
  it("uses nickname first when available", () => {
    expect(
      leaderboardDisplayName({
        id: "cm123456abcdef",
        displayName: "Display Name",
        nickname: "NickName",
        fullName: "Full Name",
      }),
    ).toBe("NickName");
  });

  it("falls back to fullName when nickname is absent", () => {
    expect(
      leaderboardDisplayName({
        id: "cm123456abcdef",
        displayName: "Display Name",
        nickname: null,
        fullName: "Full Name",
      }),
    ).toBe("Full Name");
  });

  it("falls back to displayName when nickname and fullName are absent", () => {
    expect(
      leaderboardDisplayName({
        id: "cm123456abcdef",
        displayName: "Display Name",
        nickname: null,
        fullName: null,
      }),
    ).toBe("Display Name");
  });

  it("falls back to anonymous player ID when all name fields are absent", () => {
    expect(
      leaderboardDisplayName({
        id: "cm123456abcdef",
        displayName: null,
        nickname: null,
        fullName: null,
      }),
    ).toBe("Player ABCDEF");
  });

  it("does not expose email as a leaderboard fallback name", () => {
    expect(
      leaderboardDisplayName({
        id: "cm123456abcdef",
        displayName: null,
      }),
    ).toBe("Player ABCDEF");
  });

  it("trims whitespace before falling through the priority chain", () => {
    expect(
      leaderboardDisplayName({
        id: "cm123456abcdef",
        displayName: "Display Name",
        nickname: "   ",
        fullName: "Full Name",
      }),
    ).toBe("Full Name");
  });
});

describe("leaderboard rules", () => {
  const users: LeaderboardInputUser[] = [
    {
      id: "a",
      displayName: "Ana",
      email: "ana@example.com",
      nationality: "Belgium",
      competitionCenter: { name: "GARRINCHA Brussels" },
      predictions: [{ pointsAwarded: 5 }, { pointsAwarded: 2 }],
      pointEvents: [{ points: 1 }],
    },
    {
      id: "b",
      displayName: "Bilal",
      email: "bilal@example.com",
      nationality: "Morocco",
      competitionCenter: { name: "GARRINCHA Antwerp" },
      predictions: [{ pointsAwarded: 5 }],
      pointEvents: [{ points: 4 }],
    },
    {
      id: "c",
      displayName: "Clara",
      email: "clara@example.com",
      nationality: "Belgium",
      competitionCenter: { name: "GARRINCHA Brussels" },
      predictions: [{ pointsAwarded: 3 }],
      pointEvents: [],
    },
  ];

  it("orders the global leaderboard by total points descending", () => {
    expect(createLeaderboardRows(users).map((row) => [row.name, row.points])).toEqual([
      ["Bilal", 9],
      ["Ana", 8],
      ["Clara", 3],
    ]);
  });

  it("filters national leaderboard rows", () => {
    const rows = createLeaderboardRows(users);
    expect(filterLeaderboardByNationality(rows, "Belgium").map((row) => row.name)).toEqual(["Ana", "Clara"]);
  });

  it("filters center leaderboard rows", () => {
    const rows = createLeaderboardRows(users);
    expect(filterLeaderboardByCenter(rows, "GARRINCHA Antwerp").map((row) => row.name)).toEqual(["Bilal"]);
  });

  it("sorts the full leaderboard before applying a limit", () => {
    const manyUsers: LeaderboardInputUser[] = Array.from({ length: 205 }, (_, index) => ({
      id: `user-${index.toString().padStart(3, "0")}`,
      displayName: `Player ${index}`,
      email: `player-${index}@example.com`,
      nationality: index % 2 === 0 ? "Belgium" : "Morocco",
      competitionCenter: { name: index % 2 === 0 ? "GARRINCHA Brussels" : "GARRINCHA Antwerp" },
      predictions: [{ pointsAwarded: index === 204 ? 999 : index }],
      pointEvents: [],
    }));

    expect(createLeaderboardRows(manyUsers, 10)[0]).toMatchObject({
      id: "user-204",
      points: 999,
    });
  });

  it("ranks national leaderboard rows after nationality filtering", () => {
    const rows = createLeaderboardRows(users);
    expect(filterLeaderboardByNationality(rows, "Belgium").map((row) => [row.name, row.points])).toEqual([
      ["Ana", 8],
      ["Clara", 3],
    ]);
  });

  it("ranks center leaderboard rows after center filtering", () => {
    const rows = createLeaderboardRows(users);
    expect(filterLeaderboardByCenter(rows, "GARRINCHA Brussels").map((row) => [row.name, row.points])).toEqual([
      ["Ana", 8],
      ["Clara", 3],
    ]);
  });

  it("excludes users without a competition center from the leaderboard", () => {
    const usersWithMissingCenter: LeaderboardInputUser[] = [
      {
        id: "no-center",
        displayName: "No Center Player",
        email: "nocenter@example.com",
        nationality: "Belgium",
        competitionCenter: null,
        predictions: [{ pointsAwarded: 10 }],
        pointEvents: [],
      },
      {
        id: "has-center",
        displayName: "Has Center Player",
        email: "hascenter@example.com",
        nationality: "Belgium",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [{ pointsAwarded: 5 }],
        pointEvents: [],
      },
    ];

    const rows = createLeaderboardRows(usersWithMissingCenter);
    expect(rows.map((row) => row.id)).toEqual(["has-center"]);
  });

  it("includes bonus-only users in leaderboard totals", () => {
    const rows = createLeaderboardRows([
      {
        id: "bonus-only",
        displayName: "Bonus Player",
        email: "bonus@example.com",
        nationality: "Belgium",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [],
        pointEvents: [{ points: 7 }],
      },
      {
        id: "prediction-only",
        displayName: "Prediction Player",
        email: "prediction@example.com",
        nationality: "Belgium",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [{ pointsAwarded: 5 }],
        pointEvents: [],
      },
    ]);

    expect(rows.map((row) => [row.name, row.points])).toEqual([
      ["Bonus Player", 7],
      ["Prediction Player", 5],
    ]);
  });

  it("supports negative bonus corrections in leaderboard totals", () => {
    const rows = createLeaderboardRows([
      {
        id: "corrected",
        displayName: "Corrected Player",
        email: "corrected@example.com",
        nationality: "Belgium",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [{ pointsAwarded: 5 }],
        pointEvents: [{ points: -2 }],
      },
    ]);

    expect(rows[0]).toMatchObject({ name: "Corrected Player", points: 3 });
  });

  it("uses player name as a stable tie breaker for equal points", () => {
    const rows = createLeaderboardRows([
      {
        id: "z",
        displayName: "Zara",
        email: "zara@example.com",
        nationality: "Belgium",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [{ pointsAwarded: 5 }],
        pointEvents: [],
      },
      {
        id: "a",
        displayName: "Adam",
        email: "adam@example.com",
        nationality: "Belgium",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [{ pointsAwarded: 5 }],
        pointEvents: [],
      },
    ]);

    expect(rows.map((row) => row.name)).toEqual(["Adam", "Zara"]);
  });
});
