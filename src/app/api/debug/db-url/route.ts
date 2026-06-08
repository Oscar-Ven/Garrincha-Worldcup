import { NextResponse } from "next/server";
import { hasDatabaseConfig, hasUsableDatabaseUrl, isPreviewMode } from "@/lib/app-mode";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.DEBUG_DB_DIAGNOSTIC !== "true") {
    return NextResponse.json({ error: "Disabled." }, { status: 404 });
  }

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const raw = process.env.DATABASE_URL ?? "";
  let parsed = false;
  let protocol: string = "missing";
  let hostType: string = "missing";
  let port: string | null = null;
  let hasDatabaseName = false;
  let hasUsername = false;
  let hasPassword = false;
  let hasPgBouncer = false;
  let hasSslMode = false;
  let unusableReason: string | null = null;

  if (!raw) {
    unusableReason = "DATABASE_URL is empty or missing";
  } else {
    try {
      const u = new URL(raw);
      parsed = true;
      protocol = u.protocol.replace(":", "");
      port = u.port || null;
      hasDatabaseName = u.pathname !== "/" && u.pathname.length > 1;
      hasUsername = Boolean(u.username);
      hasPassword = Boolean(u.password);
      hasPgBouncer = u.searchParams.has("pgbouncer");
      hasSslMode = u.searchParams.has("sslmode");

      const host = u.hostname;
      if (host.includes("pooler.supabase.com")) {
        hostType = "supabase-pooler";
      } else if (host.includes("supabase.co")) {
        hostType = "supabase-direct";
      } else {
        hostType = "unknown";
      }

      // Replicate hasUsableDatabaseUrl() logic step by step
      if (!["postgresql", "postgres"].includes(protocol)) {
        unusableReason = `Protocol "${protocol}" is not postgresql or postgres`;
      } else if (!host) {
        unusableReason = "Hostname is empty";
      } else if (!hasUsername) {
        unusableReason = "Username is missing";
      } else if (!hasDatabaseName) {
        unusableReason = 'Database name is missing (pathname is "/")';
      }
    } catch (e) {
      protocol = "invalid";
      unusableReason = `URL parse error: ${(e as Error).message}`;
    }
  }

  // Check placeholder detection
  if (!unusableReason && raw) {
    const PLACEHOLDER_PATTERNS = [
      "replace-with", "[YOUR-APP-DOMAIN]", "[PROJECT-REF]", "[PASSWORD]",
      "your-password", "your-domain", "your-project",
    ];
    const lower = raw.toLowerCase();
    const hit = PLACEHOLDER_PATTERNS.find((p) => lower.includes(p.toLowerCase()));
    if (hit) {
      unusableReason = `Value contains placeholder pattern: "${hit}"`;
    }
  }

  let prismaConnectResult: string = "not_tested";
  if (process.env.DEBUG_DB_DIAGNOSTIC === "true" && !unusableReason) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      prismaConnectResult = "success";
    } catch (e) {
      const err = e as { constructor: { name: string }; code?: string; message?: string };
      prismaConnectResult = [
        `type=${err.constructor.name}`,
        err.code ? `code=${err.code}` : null,
        err.message ? `msg=${err.message.slice(0, 150).replace(/password=[^&\s]*/gi, "***")}` : null,
      ].filter(Boolean).join(" | ");
    }
  }

  return NextResponse.json({
    databaseUrlPresent: Boolean(raw),
    parsed,
    protocol,
    hostType,
    port,
    hasDatabaseName,
    hasUsername,
    hasPassword,
    hasPgBouncer,
    hasSslMode,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? "unknown",
    usableByApp: hasUsableDatabaseUrl(),
    unusableReason,
    demoFallbackEnabled: !hasDatabaseConfig(),
    previewMode: isPreviewMode(),
    prismaConnectResult,
    runtimeSource: "vercel-production",
  });
}
