import { z } from "zod";

const score = z.coerce.number().int().min(0).max(30);
const minimumAge = 16;

export function isAtLeastAge(dateOfBirth: Date, age = minimumAge, now = new Date()) {
  const birthdayThisYear = new Date(Date.UTC(now.getUTCFullYear(), dateOfBirth.getUTCMonth(), dateOfBirth.getUTCDate()));
  const ageYears = now.getUTCFullYear() - dateOfBirth.getUTCFullYear() - (now < birthdayThisYear ? 1 : 0);
  return ageYears >= age;
}

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
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().trim().max(80).optional(),
  termsAccepted: acceptedConsent,
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: score,
  awayScore: score,
});

export const finalScoreSchema = z.object({
  homeScore: score,
  awayScore: score,
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
