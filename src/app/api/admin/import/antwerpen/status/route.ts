import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { prisma } from "@/lib/prisma";
import {
  CRON_BATCH_SIZE,
  CRON_INTERVAL_MINUTES,
  EXPECTED_EMAILS_PER_RUN,
} from "@/lib/import/invitation-batch";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const [statusCounts, lastSent] = await Promise.all([
    prisma.invitationJob.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.invitationJob.findFirst({
      where: { status: "sent" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of statusCounts) {
    counts[row.status] = row._count.id;
    total += row._count.id;
  }

  const pending = counts["pending"] ?? 0;
  const estimatedMinutesRemaining =
    pending > 0
      ? Math.ceil((pending / EXPECTED_EMAILS_PER_RUN) * CRON_INTERVAL_MINUTES)
      : 0;

  return NextResponse.json({
    pending,
    processing: counts["processing"] ?? 0,
    sent: counts["sent"] ?? 0,
    failed: counts["failed"] ?? 0,
    skipped_unsubscribed: counts["skipped_unsubscribed"] ?? 0,
    total,
    lastSentAt: lastSent?.sentAt ?? null,
    throughput: {
      emailsPerRun: EXPECTED_EMAILS_PER_RUN,
      batchSize: CRON_BATCH_SIZE,
      cronIntervalMinutes: CRON_INTERVAL_MINUTES,
      estimatedMinutesRemaining,
    },
  });
}
