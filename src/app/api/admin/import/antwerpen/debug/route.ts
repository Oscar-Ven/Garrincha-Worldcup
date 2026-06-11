import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ANTWERPEN_NOORD, ANTWERPEN_ZUID } from "@/lib/import/player-import";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  void request;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const [
    totalUsers,
    usersWithPredictions,
    centerCounts,
    jobsByStatus,
    jobsByCenterName,
    recentImportRuns,
    zuidCenter,
    noordCenter,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),

    prisma.user.count({
      where: { role: "USER", predictions: { some: {} } },
    }),

    prisma.garrinchaCenter.findMany({
      select: {
        name: true,
        _count: {
          select: {
            activatedUsers: { where: { role: "USER" } },
            competingUsers: { where: { role: "USER" } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),

    prisma.invitationJob.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.invitationJob.groupBy({
      by: ["centerName"],
      _count: { id: true },
    }),

    prisma.invitationJob.groupBy({
      by: ["importRunId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    prisma.garrinchaCenter.findFirst({
      where: { name: ANTWERPEN_ZUID },
      select: { id: true, name: true },
    }),

    prisma.garrinchaCenter.findFirst({
      where: { name: ANTWERPEN_NOORD },
      select: { id: true, name: true },
    }),
  ]);

  const totalJobs = jobsByStatus.reduce((sum, g) => sum + g._count.id, 0);

  return NextResponse.json({
    database: {
      totalUsersRoleUser: totalUsers,
      usersWithAtLeastOnePrediction: usersWithPredictions,
    },
    centerBreakdown: centerCounts.map((c) => ({
      center: c.name,
      activatedUsers: c._count.activatedUsers,
      competingUsers: c._count.competingUsers,
    })),
    antwerpenCenterIds: {
      [ANTWERPEN_ZUID]: zuidCenter?.id ?? "(not found in DB)",
      [ANTWERPEN_NOORD]: noordCenter?.id ?? "(not found in DB)",
    },
    invitationJobs: {
      total: totalJobs,
      byStatus: Object.fromEntries(
        jobsByStatus.map((g) => [g.status, g._count.id]),
      ),
      byCenterName: Object.fromEntries(
        jobsByCenterName.map((g) => [g.centerName, g._count.id]),
      ),
    },
    recentImportRuns: recentImportRuns.map((r) => ({
      importRunId: r.importRunId ?? "(none)",
      jobsCreated: r._count.id,
    })),
  });
}
