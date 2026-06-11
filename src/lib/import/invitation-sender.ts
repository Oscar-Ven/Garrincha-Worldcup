/**
 * Sends a single invitation email for an InvitationJob record.
 * Handles access token generation, unsubscribe check, and email dispatch.
 * Excluded from test coverage — integration-only (DB + email).
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/auth";
import { buildAccessLinkEmail, sendEmail } from "@/lib/email";

export interface InvitationSendResult {
  jobId: string;
  status: "sent" | "failed" | "skipped_unsubscribed";
  error?: string;
}

export async function sendJobInvitation(job: {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  centerName: string;
  emailUnsubscribedAt?: Date | null;
}): Promise<InvitationSendResult> {
  if (job.emailUnsubscribedAt) {
    return { jobId: job.id, status: "skipped_unsubscribed" };
  }

  const { raw: token, hash: accessTokenHash } = generateAccessToken();
  const now = new Date();

  await prisma.user.update({
    where: { id: job.userId },
    data: {
      accessTokenHash,
      accessTokenCreatedAt: now,
      accessTokenRevokedAt: null,
      lastAccessLinkSentAt: now,
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://worldcup.garrincha.be";
  const accessUrl = `${appUrl}/auth/access?token=${token}`;

  try {
    await sendEmail(
      buildAccessLinkEmail({
        email: job.email,
        accessUrl,
        displayName: job.displayName,
        centerName: job.centerName,
        userId: job.userId,
      }),
    );
    return { jobId: job.id, status: "sent" };
  } catch (err) {
    return {
      jobId: job.id,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
