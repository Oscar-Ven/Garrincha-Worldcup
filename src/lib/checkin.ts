import "server-only";
import { prisma } from "@/lib/prisma";

const SAFE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ23456789";

export function generateSessionCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
  }
  return code;
}

export function sessionExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}

export async function getActiveSession(centerId: string) {
  return prisma.centerSession.findFirst({
    where: { centerId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserCheckIn(userId: string) {
  return prisma.centerCheckIn.findUnique({ where: { userId } });
}

export function isCheckInValid(
  checkIn: { centerId: string; expiresAt: Date } | null,
  centerId: string,
): boolean {
  if (!checkIn) return false;
  if (checkIn.centerId !== centerId) return false;
  return checkIn.expiresAt > new Date();
}
