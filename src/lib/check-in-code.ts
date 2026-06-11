import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SAFE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ23456789";

export function generateCheckInCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
  }
  return code;
}

export function getBrusselsDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Brussels" }).format(now);
}

function getBrusselsOffset(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    hour: "numeric",
    hour12: false,
  }).formatToParts(noon);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  return hour - 12;
}

export function getBrusselsEndOfDayUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const offset = getBrusselsOffset(dateStr);
  return new Date(Date.UTC(y, m - 1, d, 23 - offset, 59, 59, 999));
}

export type ClaimResult =
  | { ok: true; pointsAwarded: 3 }
  | { ok: true; pointsAwarded: 0; message: string }
  | { ok: false; status: number; error: string };

export async function claimCheckIn(userId: string, code: string): Promise<ClaimResult> {
  const now = new Date();
  const today = getBrusselsDate(now);

  const checkInCode = await prisma.checkInCode.findFirst({
    where: { code: code.trim().toUpperCase(), isActive: true },
  });

  if (!checkInCode) return { ok: false, status: 422, error: "Invalid code." };
  if (checkInCode.date < today) return { ok: false, status: 422, error: "This code has expired." };
  if (checkInCode.date > today) return { ok: false, status: 422, error: "This code is not active yet." };
  if (now > checkInCode.expiresAt) return { ok: false, status: 422, error: "This code has expired." };

  try {
    await prisma.$transaction([
      prisma.checkInClaim.create({
        data: {
          userId,
          checkInCodeId: checkInCode.id,
          centerId: checkInCode.centerId,
          date: today,
          pointsAwarded: 3,
        },
      }),
      prisma.pointEvent.create({
        data: {
          userId,
          points: 3,
          reason: "Attendance check-in bonus",
          awardedBy: "system",
        },
      }),
    ]);
    return { ok: true, pointsAwarded: 3 };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        ok: true,
        pointsAwarded: 0,
        message: "You already claimed today's check-in bonus.",
      };
    }
    throw err;
  }
}
