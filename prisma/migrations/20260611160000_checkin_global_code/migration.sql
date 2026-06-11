-- Simplify CheckInCode to a global daily code (no per-center codes)

-- 1. Drop FK and centerId from CheckInCode
ALTER TABLE "CheckInCode" DROP CONSTRAINT IF EXISTS "CheckInCode_centerId_fkey";
DROP INDEX IF EXISTS "CheckInCode_centerId_date_idx";
ALTER TABLE "CheckInCode" DROP COLUMN IF EXISTS "centerId";

-- 2. Add date-only index for global lookup
CREATE INDEX IF NOT EXISTS "CheckInCode_date_idx" ON "CheckInCode"("date");

-- 3. Drop centerId from CheckInClaim (plain column, no FK)
ALTER TABLE "CheckInClaim" DROP COLUMN IF EXISTS "centerId";

-- Register migration
INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
SELECT gen_random_uuid()::text,'checkin_global_code_v1',NOW(),'20260611160000_checkin_global_code',NULL,NULL,NOW(),1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name"='20260611160000_checkin_global_code');
