import { describe, expect, it } from "vitest";
import { groupStageFixtures, matchVenueLabel } from "@/lib/world-cup-2026-fixtures";
import { playerPredictionMatchOrderBy } from "@/lib/player-data";

describe("World Cup 2026 explicit fixture data", () => {
  it("contains all 72 group-stage fixtures", () => {
    expect(groupStageFixtures).toHaveLength(72);
  });

  it("sets Belgium's first fixture to Belgium vs Egypt on 15 June 2026", () => {
    const belgiumFixtures = groupStageFixtures
      .filter((fixture) => fixture.homeTeam === "Belgium" || fixture.awayTeam === "Belgium")
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt) || a.fifaMatchNo - b.fifaMatchNo);

    expect(belgiumFixtures[0]).toMatchObject({
      fifaMatchNo: 16,
      group: "G",
      homeTeam: "Belgium",
      awayTeam: "Egypt",
      kickoffAt: "2026-06-15T19:00:00.000Z",
      venue: "Lumen Field",
      city: "Seattle",
    });
    expect(belgiumFixtures[0].kickoffAt.slice(0, 10)).toBe("2026-06-15");
  });

  it("does not give Match 1 and Match 7 the same kickoff timestamp", () => {
    const match1 = groupStageFixtures.find((fixture) => fixture.fifaMatchNo === 1);
    const match7 = groupStageFixtures.find((fixture) => fixture.fifaMatchNo === 7);

    expect(match1?.kickoffAt).toBe("2026-06-11T19:00:00.000Z");
    expect(match7?.kickoffAt).toBe("2026-06-13T22:00:00.000Z");
    expect(match1?.kickoffAt).not.toBe(match7?.kickoffAt);
  });

  it("does not contain placeholder venue text in group-stage fixtures", () => {
    expect(groupStageFixtures.map(matchVenueLabel).join("\n")).not.toMatch(/TBD official venue/i);
  });
});

describe("prediction card ordering", () => {
  it("keeps match cards ordered by kickoffAt ASC, then fifaMatchNo ASC", () => {
    expect(playerPredictionMatchOrderBy).toEqual([{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }]);
  });
});
