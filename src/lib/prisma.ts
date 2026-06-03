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

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
  ssl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
