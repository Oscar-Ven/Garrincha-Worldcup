/**
 * Core batch email dispatch logic for InvitationJob queue.
 * Called by both the admin send-batch route and the Vercel Cron handler.
 * Excluded from test coverage — integration-only (DB + email).
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { sendJobInvitation } from "./invitation-sender";

export interface BatchReport {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

const BATCH_SIZE = 500;
const CHUNK_SIZE = 10; // concurrent Resend API calls per chunk

export async function processSendBatch(): Promise<BatchReport> {
  // Reset jobs stuck in "processing" for more than 15 minutes (crash recovery)
  const stuckCutoff = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.invitationJob.updateMany({
    where: { status: "processing", updatedAt: { lt: stuckCutoff } },
    data: { status: "pending" },
  });

  // Select next batch of pending jobs
  const pending = await prisma.invitationJob.findMany({
    where: { status: "pending" },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      email: true,
      displayName: true,
      centerName: true,
    },
  });

  if (pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0, errors: [] };
  }

  // Atomically mark the selected jobs as processing
  await prisma.invitationJob.updateMany({
    where: { id: { in: pending.map((j) => j.id) } },
    data: { status: "processing" },
  });

  // Bulk-fetch unsubscribe status for all users in this batch
  const userStatuses = new Map(
    (
      await prisma.user.findMany({
        where: { id: { in: pending.map((j) => j.userId) } },
        select: { id: true, emailUnsubscribedAt: true },
      })
    ).map((u) => [u.id, u.emailUnsubscribedAt]),
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process in chunks of CHUNK_SIZE for controlled concurrency
  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE);

    const results = await Promise.all(
      chunk.map((job) =>
        sendJobInvitation({
          ...job,
          emailUnsubscribedAt: userStatuses.get(job.userId) ?? null,
        }),
      ),
    );

    // Update each job's final status
    await Promise.all(
      results.map((r) =>
        prisma.invitationJob.update({
          where: { id: r.jobId },
          data: {
            status:
              r.status === "sent"
                ? "sent"
                : r.status === "skipped_unsubscribed"
                  ? "skipped_unsubscribed"
                  : "failed",
            sentAt: r.status === "sent" ? new Date() : undefined,
            lastError: r.error ?? null,
            attempts: { increment: 1 },
          },
        }),
      ),
    );

    for (const r of results) {
      if (r.status === "sent") {
        sent++;
      } else if (r.status === "skipped_unsubscribed") {
        skipped++;
      } else {
        failed++;
        if (r.error) errors.push(`${r.jobId}: ${r.error}`);
      }
    }
  }

  return { processed: pending.length, sent, failed, skipped, errors };
}
