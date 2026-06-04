import { describe, expect, it } from "vitest";
import {
  bonusSchema,
  checkInSchema,
  finalScoreSchema,
  isAtLeastAge,
  loginSchema,
  predictionSchema,
  registerSchema,
  requestLinkSchema,
  userRoleSchema,
} from "@/lib/validators";

const validRegistration = {
  email: "player@example.com",
  fullName: "Alice Example",
  nickname: "alice99",
  activationCode: "ABC123",
  phoneNumber: "+32123456789",
  termsAccepted: "true",
};

describe("registration validation", () => {
  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects missing fullName", () => {
    expect(registerSchema.safeParse({ ...validRegistration, fullName: undefined }).success).toBe(false);
  });

  it("rejects missing nickname", () => {
    expect(registerSchema.safeParse({ ...validRegistration, nickname: undefined }).success).toBe(false);
  });

  it("allows missing activationCode (direct registration — centerId used instead)", () => {
    // activationCode is now optional to support direct registration without QR code
    expect(registerSchema.safeParse({ ...validRegistration, activationCode: undefined }).success).toBe(true);
  });

  it("rejects fullName shorter than 2 characters", () => {
    expect(registerSchema.safeParse({ ...validRegistration, fullName: "A" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, fullName: "" }).success).toBe(false);
  });

  it("requires terms and privacy consent", () => {
    expect(registerSchema.safeParse({ ...validRegistration, termsAccepted: undefined }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, termsAccepted: "false" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, termsAccepted: false }).success).toBe(false);
  });

  it("accepts boolean true or string 'true' for consent", () => {
    expect(registerSchema.safeParse({ ...validRegistration, termsAccepted: true }).success).toBe(true);
    expect(registerSchema.safeParse({ ...validRegistration, termsAccepted: "true" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(registerSchema.safeParse({ ...validRegistration, email: "not-an-email" }).success).toBe(false);
  });

  it("normalizes email to lowercase", () => {
    const result = registerSchema.safeParse({ ...validRegistration, email: "Player@Example.COM" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("player@example.com");
  });
});

describe("age validation (isAtLeastAge)", () => {
  it("accepts a person exactly 16 years old today", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const dob = new Date("2010-06-01T00:00:00.000Z");
    expect(isAtLeastAge(dob, 16, now)).toBe(true);
  });

  it("rejects a person one day short of 16", () => {
    const now = new Date("2026-05-31T00:00:00.000Z");
    const dob = new Date("2010-06-01T00:00:00.000Z");
    expect(isAtLeastAge(dob, 16, now)).toBe(false);
  });

  it("accepts adults well over the minimum age", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const dob = new Date("1990-01-01T00:00:00.000Z");
    expect(isAtLeastAge(dob, 16, now)).toBe(true);
  });

  it("handles birthday not yet reached this year", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const dob = new Date("2010-12-31T00:00:00.000Z");
    expect(isAtLeastAge(dob, 16, now)).toBe(false);
  });
});

describe("login validation", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "anypassword" }).success).toBe(true);
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });

  it("rejects invalid email format", () => {
    expect(loginSchema.safeParse({ email: "not-email", password: "pass" }).success).toBe(false);
  });

  it("normalizes email to lowercase", () => {
    const result = loginSchema.safeParse({ email: "USER@EXAMPLE.COM", password: "pass" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });
});

describe("prediction validation", () => {
  it("accepts valid homeScore/awayScore", () => {
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 2, awayScore: 1 }).success).toBe(true);
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 0, awayScore: 0 }).success).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: -1, awayScore: 0 }).success).toBe(false);
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 0, awayScore: -1 }).success).toBe(false);
  });

  it("rejects scores above 30", () => {
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 31, awayScore: 0 }).success).toBe(false);
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 0, awayScore: 31 }).success).toBe(false);
  });

  it("rejects non-integer scores", () => {
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 1.5, awayScore: 0 }).success).toBe(false);
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 0, awayScore: 2.7 }).success).toBe(false);
  });

  it("coerces string scores", () => {
    const result = predictionSchema.safeParse({ matchId: "m1", homeScore: "2", awayScore: "1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.homeScore).toBe(2);
      expect(result.data.awayScore).toBe(1);
    }
  });

  it("rejects missing matchId", () => {
    expect(predictionSchema.safeParse({ matchId: "", homeScore: 1, awayScore: 0 }).success).toBe(false);
  });
});

describe("final score validation", () => {
  it("accepts valid scores", () => {
    expect(finalScoreSchema.safeParse({ homeScore: 2, awayScore: 1 }).success).toBe(true);
    expect(finalScoreSchema.safeParse({ homeScore: 0, awayScore: 0 }).success).toBe(true);
  });

  it("rejects scores outside 0–30", () => {
    expect(finalScoreSchema.safeParse({ homeScore: -1, awayScore: 0 }).success).toBe(false);
    expect(finalScoreSchema.safeParse({ homeScore: 0, awayScore: 31 }).success).toBe(false);
  });
});

describe("bonus validation", () => {
  it("accepts a valid positive bonus", () => {
    expect(bonusSchema.safeParse({ userId: "u1", points: 5, reason: "Fair play" }).success).toBe(true);
  });

  it("accepts negative correction points", () => {
    expect(bonusSchema.safeParse({ userId: "u1", points: -3, reason: "Rule violation" }).success).toBe(true);
  });

  it("rejects points beyond the ±100 limit", () => {
    expect(bonusSchema.safeParse({ userId: "u1", points: 101, reason: "Fair play" }).success).toBe(false);
    expect(bonusSchema.safeParse({ userId: "u1", points: -101, reason: "Fair play" }).success).toBe(false);
  });

  it("accepts the boundary values ±100", () => {
    expect(bonusSchema.safeParse({ userId: "u1", points: 100, reason: "Fair play" }).success).toBe(true);
    expect(bonusSchema.safeParse({ userId: "u1", points: -100, reason: "Correction" }).success).toBe(true);
  });

  it("rejects a reason shorter than 3 characters", () => {
    expect(bonusSchema.safeParse({ userId: "u1", points: 5, reason: "ok" }).success).toBe(false);
    expect(bonusSchema.safeParse({ userId: "u1", points: 5, reason: "" }).success).toBe(false);
  });

  it("rejects a reason longer than 240 characters", () => {
    const longReason = "a".repeat(241);
    expect(bonusSchema.safeParse({ userId: "u1", points: 5, reason: longReason }).success).toBe(false);
  });

  it("accepts a reason of exactly 240 characters", () => {
    const maxReason = "a".repeat(240);
    expect(bonusSchema.safeParse({ userId: "u1", points: 5, reason: maxReason }).success).toBe(true);
  });

  it("requires a userId", () => {
    expect(bonusSchema.safeParse({ userId: "", points: 5, reason: "Fair play" }).success).toBe(false);
  });
});

describe("user role validation", () => {
  it("accepts all valid roles including CENTER_ADMIN", () => {
    expect(userRoleSchema.safeParse({ role: "USER" }).success).toBe(true);
    expect(userRoleSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
    expect(userRoleSchema.safeParse({ role: "CENTER_ADMIN" }).success).toBe(true);
    expect(userRoleSchema.safeParse({ role: "SUPER_ADMIN" }).success).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(userRoleSchema.safeParse({ role: "MODERATOR" }).success).toBe(false);
    expect(userRoleSchema.safeParse({ role: "" }).success).toBe(false);
    expect(userRoleSchema.safeParse({ role: "user" }).success).toBe(false);
  });
});

describe("checkIn validation", () => {
  it("accepts a valid check-in code", () => {
    expect(checkInSchema.safeParse({ code: "ABCD1234" }).success).toBe(true);
  });

  it("rejects an empty code", () => {
    expect(checkInSchema.safeParse({ code: "" }).success).toBe(false);
  });

  it("rejects a code longer than 16 characters", () => {
    expect(checkInSchema.safeParse({ code: "A".repeat(17) }).success).toBe(false);
  });
});

describe("requestLink validation", () => {
  it("accepts a valid email", () => {
    expect(requestLinkSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(requestLinkSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(requestLinkSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("normalizes email to lowercase", () => {
    const result = requestLinkSchema.safeParse({ email: "USER@EXAMPLE.COM" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });
});
