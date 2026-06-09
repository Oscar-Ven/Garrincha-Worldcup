import { describe, expect, it } from "vitest";
import {
  formatBelgiumTime,
  formatBelgiumDateShort,
  formatBelgiumDateLong,
  formatBelgiumDateTime,
  getBelgiumDateKey,
} from "@/lib/date";

// All World Cup 2026 matches fall in June–July when Belgium is on CEST (UTC+2).
// No DST transitions occur during the tournament period.

describe("formatBelgiumTime", () => {
  it("converts 19:00 UTC to 21:00 CEST (Belgium vs Egypt)", () => {
    expect(formatBelgiumTime("2026-06-15T19:00:00.000Z")).toBe("21:00");
  });

  it("converts 03:00 UTC to 05:00 CEST (Belgium vs New Zealand)", () => {
    expect(formatBelgiumTime("2026-06-27T03:00:00.000Z")).toBe("05:00");
  });

  it("converts 22:00 UTC to 00:00 CEST next day (midnight crossover)", () => {
    // Brazil vs Morocco kicks off at 22:00 UTC June 13 = 00:00 CEST June 14
    expect(formatBelgiumTime("2026-06-13T22:00:00.000Z")).toBe("00:00");
  });

  it("converts 17:00 UTC to 19:00 CEST", () => {
    expect(formatBelgiumTime("2026-06-14T17:00:00.000Z")).toBe("19:00");
  });

  it("accepts Date objects as input", () => {
    expect(formatBelgiumTime(new Date("2026-06-15T19:00:00.000Z"))).toBe("21:00");
  });
});

describe("getBelgiumDateKey", () => {
  it("returns the same date for 19:00 UTC matches", () => {
    // Belgium vs Egypt: 15 Jun both in UTC and Brussels (19:00 UTC = 21:00 CEST, same day)
    expect(getBelgiumDateKey("2026-06-15T19:00:00.000Z")).toBe("2026-06-15");
  });

  it("advances to the next day for 22:00 UTC matches", () => {
    // Brazil vs Morocco: 22:00 UTC Sat 13 Jun = 00:00 CEST Sun 14 Jun
    expect(getBelgiumDateKey("2026-06-13T22:00:00.000Z")).toBe("2026-06-14");
  });

  it("advances to the next day for 23:00 UTC matches", () => {
    // Ivory Coast vs Ecuador: 23:00 UTC Sun 14 Jun = 01:00 CEST Mon 15 Jun
    expect(getBelgiumDateKey("2026-06-14T23:00:00.000Z")).toBe("2026-06-15");
  });

  it("stays on the same day for early-morning UTC matches (02:00 UTC)", () => {
    // South Korea vs Czechia: 02:00 UTC Fri 12 Jun = 04:00 CEST Fri 12 Jun
    expect(getBelgiumDateKey("2026-06-12T02:00:00.000Z")).toBe("2026-06-12");
  });

  it("stays on the same day for early-morning UTC matches (03:00 UTC)", () => {
    // Belgium vs New Zealand: 03:00 UTC Sat 27 Jun = 05:00 CEST Sat 27 Jun
    expect(getBelgiumDateKey("2026-06-27T03:00:00.000Z")).toBe("2026-06-27");
  });

  it("accepts Date objects as input", () => {
    expect(getBelgiumDateKey(new Date("2026-06-15T19:00:00.000Z"))).toBe("2026-06-15");
  });
});

describe("formatBelgiumDateLong", () => {
  it("formats a standard match date correctly (Belgium vs Egypt)", () => {
    // 19:00 UTC Mon 15 Jun = Mon 15 Jun 2026 in Brussels
    expect(formatBelgiumDateLong("2026-06-15T19:00:00.000Z")).toBe("Monday, 15 June 2026");
  });

  it("uses the Belgium date for midnight-crossover matches", () => {
    // 22:00 UTC Sat 13 Jun = 00:00 CEST Sun 14 Jun
    expect(formatBelgiumDateLong("2026-06-13T22:00:00.000Z")).toBe("Sunday, 14 June 2026");
  });

  it("formats the World Cup opening match date", () => {
    // Match #1: Mexico vs South Africa, 19:00 UTC Thu 11 Jun = 21:00 CEST Thu 11 Jun
    expect(formatBelgiumDateLong("2026-06-11T19:00:00.000Z")).toBe("Thursday, 11 June 2026");
  });
});

describe("formatBelgiumDateShort", () => {
  it("formats a match date in short form", () => {
    // Belgium vs Egypt: Mon 15 Jun in Brussels
    expect(formatBelgiumDateShort("2026-06-15T19:00:00.000Z")).toBe("Mon 15 Jun");
  });

  it("uses the Belgium date for midnight-crossover matches", () => {
    // 22:00 UTC Sat 13 Jun = 00:00 CEST Sun 14 Jun
    expect(formatBelgiumDateShort("2026-06-13T22:00:00.000Z")).toBe("Sun 14 Jun");
  });
});

describe("formatBelgiumDateTime", () => {
  it("formats date and time in Brussels timezone", () => {
    // Belgium vs Egypt: Mon 15 Jun 2026 21:00 CEST
    expect(formatBelgiumDateTime("2026-06-15T19:00:00.000Z")).toBe("15 Jun 2026, 21:00");
  });

  it("accepts Date objects as input", () => {
    expect(formatBelgiumDateTime(new Date("2026-06-15T19:00:00.000Z"))).toBe("15 Jun 2026, 21:00");
  });
});
