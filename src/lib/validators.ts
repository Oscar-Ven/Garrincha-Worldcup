import { z } from "zod";

const score = z.coerce.number().int().min(0).max(30);
const penaltyScore = z.coerce.number().int().min(0).max(20);
const penaltyWinner = z.enum(["home", "away"]);

const acceptedConsent = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.literal(true, {
    error: "You must accept the terms and privacy policy.",
  }),
);

export const registerSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  fullName: z.string().trim().min(2).max(120),
  nickname: z.string().trim().min(2).max(50),
  activationCode: z.string().trim().max(16).toUpperCase().optional(),
  centerId: z.string().trim().min(1).optional(), // for direct registration
  phoneNumber: z.string().trim().min(6).max(32),
  nationality: z.string().trim().max(80).optional(),
  termsAccepted: acceptedConsent,
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: score,
  awayScore: score,
  // Knockout penalty fields — required when predicting a draw in knockout stage.
  penaltyWinner: penaltyWinner.nullable().optional(),
  homePenaltyScore: penaltyScore.nullable().optional(),
  awayPenaltyScore: penaltyScore.nullable().optional(),
});

export const finalScoreSchema = z.object({
  homeScore: score,
  awayScore: score,
  // Penalty fields — only for knockout matches that went to a shootout.
  wentToPenalties: z.boolean().optional(),
  penaltyWinner: penaltyWinner.nullable().optional(),
  homePenaltyScore: penaltyScore.nullable().optional(),
  awayPenaltyScore: penaltyScore.nullable().optional(),
});

export const bonusSchema = z.object({
  userId: z.string().min(1),
  points: z.coerce.number().int().min(-100).max(100),
  reason: z.string().trim().min(3).max(240),
});

export const userRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN", "CENTER_ADMIN", "SUPER_ADMIN"]),
});

export const checkInSchema = z.object({
  code: z.string().trim().min(1).max(16).toUpperCase(),
});

export const generateCodeSchema = z.object({
  centerId: z.string().min(1),
});

export const requestLinkSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});
