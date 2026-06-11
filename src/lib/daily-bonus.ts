import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function getBrusselsDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
  }).format(now);
}

function getBrusselsOffset(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use noon UTC on the given date as a stable reference to detect the Brussels UTC offset.
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    hour: "numeric",
    hour12: false,
  }).formatToParts(noon);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  return hour - 12; // +1 in CET (winter), +2 in CEST (summer)
}

export function getBrusselsEndOfDayUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const offset = getBrusselsOffset(dateStr);
  return new Date(Date.UTC(y, m - 1, d, 23 - offset, 59, 59, 999));
}

export function getBrusselsStartOfDayUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const offset = getBrusselsOffset(dateStr);
  return new Date(Date.UTC(y, m - 1, d, -offset, 0, 0, 0));
}

export type ClaimResult =
  | { ok: true; pointsAwarded: 3 }
  | { ok: true; pointsAwarded: 0; message: string }
  | { ok: false; status: number; error: string };

export async function claimDailyBonus(userId: string, code: string): Promise<ClaimResult> {
  const now = new Date();
  const today = getBrusselsDate(now);

  const bonusCode = await prisma.dailyBonusCode.findFirst({
    where: { code: code.trim().toUpperCase(), isActive: true },
  });

  if (!bonusCode) {
    return { ok: false, status: 422, error: "Invalid code." };
  }

  if (bonusCode.bonusDate < today) {
    return { ok: false, status: 422, error: "This code has expired." };
  }

  if (bonusCode.bonusDate > today) {
    return { ok: false, status: 422, error: "This code is not active yet." };
  }

  if (now > bonusCode.expiresAt) {
    return { ok: false, status: 422, error: "This code has expired." };
  }

  try {
    await prisma.$transaction([
      prisma.dailyBonusClaim.create({
        data: {
          userId,
          dailyBonusCodeId: bonusCode.id,
          bonusDate: today,
          pointsAwarded: bonusCode.points,
        },
      }),
      prisma.pointEvent.create({
        data: {
          userId,
          points: bonusCode.points,
          reason: "Daily attendance bonus",
          awardedBy: "system",
        },
      }),
    ]);
    return { ok: true, pointsAwarded: 3 };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: true, pointsAwarded: 0, message: "You already claimed today's attendance bonus." };
    }
    throw err;
  }
}
