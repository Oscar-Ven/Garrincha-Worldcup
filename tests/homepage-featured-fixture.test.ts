import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  match: {
    findFirst: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("homepage featured fixture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not keep the old Belgium vs Morocco homepage fixture in source", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/[locale]/page.tsx"), "utf8");

    expect(source).not.toContain("Belgium vs Morocco");
    expect(source).not.toContain("Jun 11");
  });

  it("queries Belgium's next scheduled match from the database", async () => {
    const fixture = {
      fifaMatchNo: 16,
      stage: "GROUP",
      venue: "Lumen Field, Seattle",
      kickoffAt: new Date("2026-06-15T19:00:00.000Z"),
      homeTeam: { name: "Belgium", fifaCode: "BEL", flagUrl: "flag:BEL" },
      awayTeam: { name: "Egypt", fifaCode: "EGY", flagUrl: "flag:EGY" },
    };
    prismaMock.match.findFirst.mockResolvedValueOnce(fixture);

    const { getFeaturedFixture } = await import("@/app/[locale]/page");
    const result = await getFeaturedFixture(new Date("2026-06-08T00:00:00.000Z"));

    expect(result).toBe(fixture);
    expect(prismaMock.match.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.match.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        stage: "GROUP",
        status: "SCHEDULED",
        kickoffAt: { gte: new Date("2026-06-08T00:00:00.000Z") },
        OR: [
          { homeTeam: { name: "Belgium" } },
          { awayTeam: { name: "Belgium" } },
        ],
      }),
      orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
    }));
  });

  it("falls back to Belgium's first fixture when no upcoming match exists", async () => {
    const firstBelgiumFixture = {
      fifaMatchNo: 16,
      stage: "GROUP",
      venue: "Lumen Field, Seattle",
      kickoffAt: new Date("2026-06-15T19:00:00.000Z"),
      homeTeam: { name: "Belgium", fifaCode: "BEL", flagUrl: "flag:BEL" },
      awayTeam: { name: "Egypt", fifaCode: "EGY", flagUrl: "flag:EGY" },
    };
    prismaMock.match.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(firstBelgiumFixture);

    const { getFeaturedFixture } = await import("@/app/[locale]/page");
    const result = await getFeaturedFixture(new Date("2026-08-01T00:00:00.000Z"));

    expect(result).toBe(firstBelgiumFixture);
    expect(prismaMock.match.findFirst).toHaveBeenCalledTimes(2);
    expect(prismaMock.match.findFirst.mock.calls[1][0]).toMatchObject({
      where: {
        stage: "GROUP",
        OR: [
          { homeTeam: { name: "Belgium" } },
          { awayTeam: { name: "Belgium" } },
        ],
      },
      orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
    });
  });
});
