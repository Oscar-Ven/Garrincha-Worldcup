import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlaceholderValue } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

type ServiceStatus = "ok" | "degraded" | "error" | "unconfigured";

async function checkDb(): Promise<ServiceStatus> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    return "ok";
  } catch {
    return "error";
  }
}

async function checkCache(): Promise<ServiceStatus> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || isPlaceholderValue(url) || isPlaceholderValue(token)) {
    return "unconfigured";
  }
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    return res.ok ? "ok" : "degraded";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [db, cache] = await Promise.all([checkDb(), checkCache()]);

  const overall: ServiceStatus =
    db === "ok" ? "ok" :
    db === "error" ? "error" :
    "degraded";

  return NextResponse.json(
    {
      status: overall,
      services: { db, cache },
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    },
    {
      status: overall === "error" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
