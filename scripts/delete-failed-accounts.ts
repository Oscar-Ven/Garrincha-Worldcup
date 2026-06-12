import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const failedJobs = await prisma.invitationJob.findMany({
  where: { status: "failed" },
  select: { userId: true, email: true, lastError: true },
});

console.log(`Found ${failedJobs.length} failed jobs to delete.`);
if (failedJobs.length === 0) { await prisma.$disconnect(); await pool.end(); process.exit(0); }

const userIds = failedJobs.map((j) => j.userId);

// Deleting users cascades to InvitationJob (onDelete: Cascade in schema)
const deleted = await prisma.user.deleteMany({ where: { id: { in: userIds } } });

console.log(`Deleted ${deleted.count} player accounts (+ their invitation jobs via cascade).`);
for (const j of failedJobs) console.log(`  - ${j.email}`);

await prisma.$disconnect();
await pool.end();
