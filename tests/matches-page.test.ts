import { describe, expect, it } from "vitest";
import { groupStageFixtures } from "@/lib/world-cup-2026-fixtures";

describe("matches page fixture correctness", () => {
  it("Match 1 is Mexico vs South Africa", () => {
    const match1 = groupStageFixtures.find((f) => f.fifaMatchNo === 1);
    expect(match1).toBeDefined();
    expect(match1?.homeTeam).toBe("Mexico");
    expect(match1?.awayTeam).toBe("South Africa");
  });

  it("Belgium vs Morocco does not appear as any group stage fixture", () => {
    const found = groupStageFixtures.find(
      (f) =>
        (f.homeTeam === "Belgium" && f.awayTeam === "Morocco") ||
        (f.homeTeam === "Morocco" && f.awayTeam === "Belgium")
    );
    expect(found).toBeUndefined();
  });

  it("Belgium's first fixture is Belgium vs Egypt on 15 June 2026", () => {
    const belgiumMatches = groupStageFixtures
      .filter((f) => f.homeTeam === "Belgium" || f.awayTeam === "Belgium")
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt) || a.fifaMatchNo - b.fifaMatchNo);

    expect(belgiumMatches[0]).toMatchObject({
      fifaMatchNo: 16,
      homeTeam: "Belgium",
      awayTeam: "Egypt",
    });
    expect(belgiumMatches[0].kickoffAt.slice(0, 10)).toBe("2026-06-15");
  });

  it("fixture data does not embed pre-seeded scores (future matches show VS)", () => {
    // Fixture objects carry no homeScore / awayScore fields — scores come from admin input
    const keys = Object.keys(groupStageFixtures[0]);
    expect(keys).not.toContain("homeScore");
    expect(keys).not.toContain("awayScore");
  });

  it("no fixture uses stale demo team name 'USA' (correct name is 'United States')", () => {
    const hasStaleUsa = groupStageFixtures.some(
      (f) => f.homeTeam === "USA" || f.awayTeam === "USA"
    );
    expect(hasStaleUsa).toBe(false);

    const hasUnitedStates = groupStageFixtures.some(
      (f) => f.homeTeam === "United States" || f.awayTeam === "United States"
    );
    expect(hasUnitedStates).toBe(true);
  });
});

describe("MatchSchedule filter logic", () => {
  type MatchLike = {
    stage: string;
    status: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
  };

  function applyFilter(matches: MatchLike[], filter: string): MatchLike[] {
    switch (filter) {
      case "group":
        return matches.filter((m) => m.stage === "GROUP");
      case "knockout":
        return matches.filter((m) => m.stage !== "GROUP");
      case "belgium":
        return matches.filter(
          (m) => m.homeTeam.name === "Belgium" || m.awayTeam.name === "Belgium"
        );
      case "upcoming":
        return matches.filter((m) => m.status === "SCHEDULED");
      default:
        return matches;
    }
  }

  function applySearch(matches: MatchLike[], query: string): MatchLike[] {
    const q = query.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q)
    );
  }

  const SAMPLE: MatchLike[] = [
    { stage: "GROUP", status: "SCHEDULED", homeTeam: { name: "Belgium" }, awayTeam: { name: "Egypt" } },
    { stage: "GROUP", status: "SCHEDULED", homeTeam: { name: "Mexico" }, awayTeam: { name: "South Africa" } },
    { stage: "ROUND_OF_32", status: "SCHEDULED", homeTeam: { name: "TBD" }, awayTeam: { name: "TBD" } },
    { stage: "GROUP", status: "FINAL", homeTeam: { name: "France" }, awayTeam: { name: "Senegal" } },
  ];

  it("'all' returns every match", () => {
    expect(applyFilter(SAMPLE, "all")).toHaveLength(4);
  });

  it("'group' returns only group stage matches", () => {
    const result = applyFilter(SAMPLE, "group");
    expect(result).toHaveLength(3);
    expect(result.every((m) => m.stage === "GROUP")).toBe(true);
  });

  it("'knockout' returns only non-group matches", () => {
    const result = applyFilter(SAMPLE, "knockout");
    expect(result).toHaveLength(1);
    expect(result[0].stage).toBe("ROUND_OF_32");
  });

  it("'belgium' returns only Belgium matches — shows Belgium vs Egypt", () => {
    const result = applyFilter(SAMPLE, "belgium");
    expect(result).toHaveLength(1);
    expect(result[0].homeTeam.name).toBe("Belgium");
    expect(result[0].awayTeam.name).toBe("Egypt");
  });

  it("'upcoming' returns only SCHEDULED matches", () => {
    const result = applyFilter(SAMPLE, "upcoming");
    expect(result).toHaveLength(3);
    expect(result.every((m) => m.status === "SCHEDULED")).toBe(true);
  });

  it("search by team name filters correctly", () => {
    const result = applySearch(SAMPLE, "Belgium");
    expect(result).toHaveLength(1);
    expect(result[0].homeTeam.name).toBe("Belgium");
  });

  it("empty search returns all", () => {
    expect(applySearch(SAMPLE, "")).toHaveLength(4);
  });
});
