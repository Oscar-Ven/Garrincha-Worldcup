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
const CHUNK_SIZE = 4;        // concurrent Resend API calls per chunk — stay under 5 req/sec limit
const CHUNK_DELAY_MS = 1200; // pause between chunks: 4 emails / 1.2 s ≈ 3.3 req/s

// Derived throughput info — used by the status API so the UI can show accurate estimates.
// With maxDuration=300s the full BATCH_SIZE fits comfortably (500 emails ≈ 152 s at 3.3/s).
export const CRON_BATCH_SIZE = BATCH_SIZE;
export const CRON_INTERVAL_MINUTES = 5;
// emails/s × available seconds, capped at BATCH_SIZE
const EMAIL_RATE_PER_SEC = CHUNK_SIZE / (CHUNK_DELAY_MS / 1000);
export const EXPECTED_EMAILS_PER_RUN = Math.min(
  BATCH_SIZE,
  Math.floor(EMAIL_RATE_PER_SEC * 285), // 285 s = 300 s maxDuration minus 15 s safety buffer
);

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
    if (i > 0) await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
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
