import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Supabase (and most cloud Postgres) requires SSL in production.
// rejectUnauthorized: false is necessary for Supabase's certificate chain.
const ssl =
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined;

// Strip Prisma-native-engine parameters that node-postgres (pg) doesn't
// understand. pgbouncer=true is for Prisma's built-in query engine; passing
// it to PrismaPg causes PrismaClientInitializationError on Supabase Pooler.
function sanitizeConnectionString(raw: string): string {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connect_timeout");
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

const connectionString = sanitizeConnectionString(process.env.DATABASE_URL ?? "");

if (process.env.NODE_ENV === "production" && connectionString) {
  try {
    const u = new URL(connectionString);
    console.log("[prisma] init:", {
      protocol: u.protocol,
      host: u.hostname.replace(/^[^.]+/, "***"),
      port: u.port || "default",
      db: u.pathname,
      isPooler: u.hostname.includes("pooler"),
    });
  } catch {
    console.log("[prisma] init: URL parse failed");
  }
}

const adapter = new PrismaPg({ connectionString, ssl });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
