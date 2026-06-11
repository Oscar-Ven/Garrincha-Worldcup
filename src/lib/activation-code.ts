import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function claimActivationBonus(
  userId: string,
  sessionId: string,
): Promise<{ pointsAwarded: number; alreadyClaimed: boolean }> {
  try {
    await prisma.$transaction([
      prisma.activationCodeClaim.create({ data: { userId, sessionId } }),
      prisma.pointEvent.create({
        data: { userId, points: 3, reason: "Activation code bonus", awardedBy: "system" },
      }),
    ]);
    return { pointsAwarded: 3, alreadyClaimed: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { pointsAwarded: 0, alreadyClaimed: true };
    }
    throw err;
  }
}
