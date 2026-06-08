import { describe, expect, it } from "vitest";
import {
  createMatchDataWorkflowPlan,
  footballDataEnvStatus,
  isUnknownTeamName,
  type StoredMatchSnapshot,
} from "@/lib/match-data-workflow";

const current: StoredMatchSnapshot = {
  id: "match-1",
  fifaMatchNo: 1,
  kickoffAt: new Date("2026-06-11T19:00:00.000Z"),
  status: "SCHEDULED",
  homeTeamName: "TBD Slot 1",
  awayTeamName: "TBD Slot 2",
  venue: "TBD official venue #1",
  homeScore: null,
  awayScore: null,
  predictionCount: 25,
};

describe("match data workflow", () => {
  it("treats placeholder team names as unknown", () => {
    expect(isUnknownTeamName("TBD Slot 1")).toBe(true);
    expect(isUnknownTeamName("Belgium")).toBe(false);
  });

  it("preserves match identity and predictions when provider fills TBD teams", () => {
    const plan = createMatchDataWorkflowPlan({
      current,
      incoming: {
        fifaMatchNo: 1,
        homeTeamName: "Belgium",
        awayTeamName: "Brazil",
        status: "SCHEDULED",
        provider: "football-data.org",
      },
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(plan).toMatchObject({
      preserveMatchId: true,
      preservePredictions: true,
      canUpdateTeams: true,
      shouldRecalculatePoints: false,
    });
  });

  it("auto-applies a clean final score without requiring admin confirmation", () => {
    const plan = createMatchDataWorkflowPlan({
      current,
      incoming: {
        fifaMatchNo: 1,
        status: "FINISHED",
        finalScore: { homeScore: 2, awayScore: 1 },
        provider: "api-football",
      },
      now: new Date("2026-06-11T22:00:00.000Z"),
    });

    expect(plan.canStoreFinalScoreDraft).toBe(true);
    expect(plan.requiresAdminConfirmation).toBe(false);
    expect(plan.shouldRecalculatePoints).toBe(false);
  });

  it("requires admin confirmation when the stored match is already FINAL with a different score", () => {
    const alreadyFinal: StoredMatchSnapshot = {
      ...current,
      status: "FINAL",
      homeScore: 1,
      awayScore: 0,
    };
    const plan = createMatchDataWorkflowPlan({
      current: alreadyFinal,
      incoming: {
        fifaMatchNo: 1,
        status: "FINISHED",
        finalScore: { homeScore: 2, awayScore: 1 },
        provider: "api-football",
      },
      now: new Date("2026-06-11T22:00:00.000Z"),
    });

    expect(plan.requiresAdminConfirmation).toBe(true);
    expect(plan.warnings).toContain(
      "Stored match is already final; provider score changes need admin review before recalculation.",
    );
  });

  it("flags kickoff changes after predictions are locked", () => {
    const plan = createMatchDataWorkflowPlan({
      current,
      incoming: {
        fifaMatchNo: 1,
        kickoffAt: new Date("2026-06-11T20:00:00.000Z"),
        status: "SCHEDULED",
        provider: "football-data.org",
      },
      now: new Date("2026-06-11T19:05:00.000Z"),
    });

    expect(plan.requiresAdminConfirmation).toBe(true);
    expect(plan.canUpdateFixtureFields).toBe(false);
    expect(plan.warnings).toContain("Kickoff changed after predictions locked; admin review is required.");
  });

  it("allows kickoff metadata changes before predictions are locked", () => {
    const plan = createMatchDataWorkflowPlan({
      current,
      incoming: {
        fifaMatchNo: 1,
        kickoffAt: new Date("2026-06-11T20:00:00.000Z"),
        status: "SCHEDULED",
        provider: "football-data.org",
      },
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(plan.canUpdateFixtureFields).toBe(true);
    expect(plan.requiresAdminConfirmation).toBe(false);
  });

  it("requires campaign review for postponed and cancelled matches", () => {
    const postponed = createMatchDataWorkflowPlan({
      current,
      incoming: { fifaMatchNo: 1, status: "POSTPONED", provider: "football-data.org" },
    });
    const cancelled = createMatchDataWorkflowPlan({
      current,
      incoming: { fifaMatchNo: 1, status: "CANCELLED", provider: "football-data.org" },
    });

    expect(postponed.requiresAdminConfirmation).toBe(true);
    expect(cancelled.requiresAdminConfirmation).toBe(true);
    expect(cancelled.canUpdateFixtureFields).toBe(false);
  });

  it("keeps API integration disabled until an API key is configured", () => {
    expect(footballDataEnvStatus({}).ready).toBe(false);
    expect(footballDataEnvStatus({ FOOTBALL_DATA_API_KEY: "secret" })).toMatchObject({
      provider: "football-data.org",
      competitionCode: "WC",
      season: "2026",
      apiKey: "set",
      ready: true,
    });
  });
});
