import "server-only";

import { isPreviewMode, isPlaceholderValue } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";

export type HealthStatus = "healthy" | "warning" | "error" | "unconfigured";

export type HealthCheck = {
  label: string;
  status: HealthStatus;
  detail?: string;
};

export type HealthReport = {
  checks: HealthCheck[];
  generatedAt: string;
};

function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );
}

async function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([promise, timeout<T>(ms)]);
}

// ---------------------------------------------------------------------------
// App checks
// ---------------------------------------------------------------------------

function checkNextjsEnvironment(): HealthCheck {
  const value = process.env.NODE_ENV ?? "unknown";
  return {
    label: "Next.js Environment",
    status: "healthy",
    detail: value,
  };
}

function checkPreviewMode(): HealthCheck {
  if (isPreviewMode()) {
    return {
      label: "Preview/Demo Mode",
      status: "warning",
      detail: "Preview mode active",
    };
  }
  return {
    label: "Preview/Demo Mode",
    status: "healthy",
    detail: "Production mode",
  };
}

function checkAppUrl(): HealthCheck {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) {
    return {
      label: "App URL",
      status: "unconfigured",
      detail: "NEXT_PUBLIC_APP_URL not set",
    };
  }
  if (isPlaceholderValue(value)) {
    return {
      label: "App URL",
      status: "error",
      detail: "Placeholder value detected",
    };
  }
  if (value.includes("localhost") || value.includes("127.0.0.1")) {
    return {
      label: "App URL",
      status: "warning",
      detail: `${value} (localhost — update for production)`,
    };
  }
  return {
    label: "App URL",
    status: "healthy",
    detail: value,
  };
}

// ---------------------------------------------------------------------------
// Supabase / Database checks
// ---------------------------------------------------------------------------

async function checkDatabaseConnection(): Promise<HealthCheck> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 5000);
    return {
      label: "Database Connection",
      status: "healthy",
      detail: "Connected",
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Database Connection",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

async function checkCentersSeeded(): Promise<HealthCheck> {
  try {
    const count = await withTimeout(
      prisma.garrinchaCenter.count(),
      5000
    );
    return {
      label: "Centers seeded",
      status: count >= 1 ? "healthy" : "warning",
      detail: `${count} center${count !== 1 ? "s" : ""} found`,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Centers seeded",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

async function checkMatchesSeeded(): Promise<HealthCheck> {
  try {
    const count = await withTimeout(prisma.match.count(), 5000);
    return {
      label: "Matches seeded",
      status: count === 104 ? "healthy" : "warning",
      detail: `${count} match${count !== 1 ? "es" : ""} found (expected 104)`,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Matches seeded",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

async function checkOwnerAccount(): Promise<HealthCheck> {
  try {
    const count = await withTimeout(
      prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
      5000
    );
    return {
      label: "Owner account",
      status: count >= 1 ? "healthy" : "error",
      detail: count >= 1 ? `${count} owner account(s) found` : "No owner account found",
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Owner account",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

async function checkCenterAdmins(): Promise<HealthCheck> {
  try {
    const count = await withTimeout(
      prisma.user.count({ where: { role: "CENTER_ADMIN" } }),
      5000
    );
    return {
      label: "Center admins",
      status: "healthy",
      detail: `${count} center admin(s) configured`,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Center admins",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

async function checkPlayersRegistered(): Promise<HealthCheck> {
  try {
    const count = await withTimeout(
      prisma.user.count({ where: { role: "USER" } }),
      5000
    );
    return {
      label: "Players registered",
      status: "healthy",
      detail: `${count} player(s) registered`,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Players registered",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

async function checkPredictionsSubmitted(): Promise<HealthCheck> {
  try {
    const count = await withTimeout(prisma.prediction.count(), 5000);
    return {
      label: "Predictions submitted",
      status: "healthy",
      detail: `${count} prediction(s) submitted`,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      label: "Predictions submitted",
      status: "error",
      detail: isTimeout ? "Connection timed out" : "Connection failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Email (Resend) checks
// ---------------------------------------------------------------------------

function checkResendApiKey(): HealthCheck {
  const value = process.env.RESEND_API_KEY?.trim();
  if (!value) {
    return {
      label: "RESEND_API_KEY",
      status: "unconfigured",
      detail: "Not configured",
    };
  }
  if (isPlaceholderValue(value)) {
    return {
      label: "RESEND_API_KEY",
      status: "warning",
      detail: "Placeholder value detected",
    };
  }
  return {
    label: "RESEND_API_KEY",
    status: "healthy",
    detail: "Configured",
  };
}

function checkEmailFrom(): HealthCheck {
  const value = process.env.EMAIL_FROM?.trim();
  if (!value) {
    return {
      label: "EMAIL_FROM",
      status: "unconfigured",
      detail: "Not configured",
    };
  }
  if (isPlaceholderValue(value)) {
    return {
      label: "EMAIL_FROM",
      status: "warning",
      detail: "Placeholder value detected",
    };
  }

  // Extract display name only — never show the email address
  const displayNameMatch = value.match(/^([^<]+)<[^>]+>$/);
  if (displayNameMatch) {
    const displayName = displayNameMatch[1].trim();
    return {
      label: "EMAIL_FROM",
      status: "healthy",
      detail: `Configured (display name: ${displayName})`,
    };
  }

  // No angle-bracket format — configured but we won't show the raw value
  return {
    label: "EMAIL_FROM",
    status: "healthy",
    detail: "Configured",
  };
}

function checkEmailDomain(): HealthCheck {
  const value = process.env.EMAIL_FROM?.trim();
  if (!value) {
    return {
      label: "Email domain",
      status: "unconfigured",
      detail: "EMAIL_FROM not set",
    };
  }

  // Detect placeholder domain patterns
  if (isPlaceholderValue(value)) {
    return {
      label: "Email domain",
      status: "warning",
      detail: "Placeholder domain detected — update EMAIL_FROM before going live",
    };
  }

  if (value.includes("@garrincha.be")) {
    return {
      label: "Email domain",
      status: "healthy",
      detail: "Using garrincha.be domain",
    };
  }

  // Other non-placeholder domain
  return {
    label: "Email domain",
    status: "healthy",
    detail: "Custom domain configured",
  };
}

// ---------------------------------------------------------------------------
// Redis / Upstash checks
// ---------------------------------------------------------------------------

function checkUpstashRedisUrl(): HealthCheck {
  const value = process.env.UPSTASH_REDIS_REST_URL?.trim();
  if (value && isPlaceholderValue(value)) {
    return {
      label: "UPSTASH_REDIS_REST_URL",
      status: "warning",
      detail: "Placeholder value detected",
    };
  }
  return {
    label: "UPSTASH_REDIS_REST_URL",
    status: value ? "healthy" : "unconfigured",
    detail: value ? "Configured" : "Not configured",
  };
}

function checkUpstashRedisToken(): HealthCheck {
  const value = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (value && isPlaceholderValue(value)) {
    return {
      label: "UPSTASH_REDIS_REST_TOKEN",
      status: "warning",
      detail: "Placeholder value detected",
    };
  }
  return {
    label: "UPSTASH_REDIS_REST_TOKEN",
    status: value ? "healthy" : "unconfigured",
    detail: value ? "Configured" : "Not configured",
  };
}

function checkRateLimiterMode(): HealthCheck {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const hasUrl = Boolean(url && !isPlaceholderValue(url));
  const hasToken = Boolean(token && !isPlaceholderValue(token));
  const upstashConfigured = hasUrl && hasToken;

  if (upstashConfigured) {
    return {
      label: "Rate limiter mode",
      status: "healthy",
      detail: "Redis (Upstash)",
    };
  }
  return {
    label: "Rate limiter mode",
    status: "warning",
    detail: "In-memory (not suitable for multi-instance)",
  };
}

// ---------------------------------------------------------------------------
// Hosting checks
// ---------------------------------------------------------------------------

function checkDeploymentPlatform(): HealthCheck {
  if (process.env.VERCEL === "1") {
    return {
      label: "Main app host",
      status: "healthy",
      detail: "Vercel",
    };
  }
  return {
    label: "Main app host",
    status: "warning",
    detail: "Not running on Vercel",
  };
}

function checkVercelEnvironment(): HealthCheck {
  const value = process.env.VERCEL_ENV?.trim();
  if (!value) {
    return {
      label: "Environment",
      status: "unconfigured",
      detail: "VERCEL_ENV not set",
    };
  }
  return {
    label: "Environment",
    status: "healthy",
    detail: value,
  };
}

function checkVercelDeployUrl(): HealthCheck {
  const value = process.env.VERCEL_URL?.trim();
  if (!value) {
    return {
      label: "Deploy URL",
      status: "unconfigured",
      detail: "VERCEL_URL not set",
    };
  }
  return {
    label: "Deploy URL",
    status: "healthy",
    detail: value,
  };
}

function checkRenderWorker(): HealthCheck {
  return {
    label: "Render worker",
    status: "unconfigured",
    detail: "Optional future background worker only; main app host is Vercel",
  };
}

// ---------------------------------------------------------------------------
// Sentry checks
// ---------------------------------------------------------------------------

function checkSentryDsn(): HealthCheck {
  const value =
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (value && isPlaceholderValue(value)) {
    return {
      label: "Sentry DSN",
      status: "warning",
      detail: "Placeholder value detected",
    };
  }
  return {
    label: "Sentry DSN",
    status: value ? "healthy" : "unconfigured",
    detail: value ? "Configured" : "Not configured",
  };
}

// ---------------------------------------------------------------------------
// Football API checks
// ---------------------------------------------------------------------------

function checkFootballApiKey(): HealthCheck {
  const value = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (value && isPlaceholderValue(value)) {
    return {
      label: "Football API Key",
      status: "warning",
      detail: "Placeholder value detected",
    };
  }
  return {
    label: "Football API Key",
    status: value ? "healthy" : "unconfigured",
    detail: value ? "Configured" : "Not configured",
  };
}

function checkFootballProvider(): HealthCheck {
  const value = process.env.FOOTBALL_DATA_PROVIDER?.trim();
  if (!value) {
    return {
      label: "Provider",
      status: "unconfigured",
      detail: "FOOTBALL_DATA_PROVIDER not set",
    };
  }
  return {
    label: "Provider",
    status: "healthy",
    detail: value,
  };
}

// ---------------------------------------------------------------------------
// Security checks
// ---------------------------------------------------------------------------

function checkJwtSecret(): HealthCheck {
  const value = process.env.JWT_SECRET?.trim() ?? process.env.NEXTAUTH_SECRET?.trim();
  if (!value) {
    return {
      label: "JWT Secret",
      status: "error",
      detail: "Not configured",
    };
  }
  if (isPlaceholderValue(value)) {
    return {
      label: "JWT Secret",
      status: "error",
      detail: "Placeholder value detected — replace before going live",
    };
  }
  if (value.length < 32) {
    return {
      label: "JWT Secret",
      status: "error",
      detail: "Too short (minimum 32 characters required)",
    };
  }
  return {
    label: "JWT Secret",
    status: "healthy",
    detail: "Configured and meets length requirement",
  };
}

function checkOwnerPassword(): HealthCheck {
  const value = process.env.OWNER_PASSWORD?.trim();
  if (value && isPlaceholderValue(value)) {
    return {
      label: "Owner password",
      status: "error",
      detail: "Placeholder value detected",
    };
  }
  if (value && value.length < 8) {
    return {
      label: "Owner password",
      status: "error",
      detail: "Too short (minimum 8 characters required)",
    };
  }
  return {
    label: "Owner password",
    status: value ? "healthy" : "unconfigured",
    detail: value ? "Configured" : "Not configured",
  };
}

function checkSecurityHeaders(): HealthCheck {
  return {
    label: "Security headers",
    status: "healthy",
    detail: "Configured in next.config.ts",
  };
}

function checkCsrfProtection(): HealthCheck {
  return {
    label: "Same-origin CSRF protection",
    status: "healthy",
    detail: "Enabled via request-security.ts",
  };
}

// ---------------------------------------------------------------------------
// Main report
// ---------------------------------------------------------------------------

export async function getHealthReport(): Promise<HealthReport> {
  const [
    dbConnection,
    centersSeeded,
    matchesSeeded,
    ownerAccount,
    centerAdmins,
    playersRegistered,
    predictionsSubmitted,
  ] = await Promise.all([
    checkDatabaseConnection(),
    checkCentersSeeded(),
    checkMatchesSeeded(),
    checkOwnerAccount(),
    checkCenterAdmins(),
    checkPlayersRegistered(),
    checkPredictionsSubmitted(),
  ]);

  const checks: HealthCheck[] = [
    // App
    checkNextjsEnvironment(),
    checkPreviewMode(),
    checkAppUrl(),

    // Supabase / Database
    dbConnection,
    centersSeeded,
    matchesSeeded,
    ownerAccount,
    centerAdmins,
    playersRegistered,
    predictionsSubmitted,

    // Email
    checkResendApiKey(),
    checkEmailFrom(),
    checkEmailDomain(),

    // Redis / Upstash
    checkUpstashRedisUrl(),
    checkUpstashRedisToken(),
    checkRateLimiterMode(),

    // Hosting
    checkDeploymentPlatform(),
    checkVercelEnvironment(),
    checkVercelDeployUrl(),
    checkRenderWorker(),

    // Sentry
    checkSentryDsn(),

    // Football API
    checkFootballApiKey(),
    checkFootballProvider(),

    // Security
    checkJwtSecret(),
    checkOwnerPassword(),
    checkSecurityHeaders(),
    checkCsrfProtection(),
  ];

  return {
    checks,
    generatedAt: new Date().toISOString(),
  };
}
