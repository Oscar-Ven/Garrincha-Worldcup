-- CreateTable: CheckInCode
CREATE TABLE "CheckInCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckInCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CheckInClaim
CREATE TABLE "CheckInClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInCodeId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 3,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckInClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckInCode_code_isActive_idx" ON "CheckInCode"("code", "isActive");
CREATE INDEX "CheckInCode_centerId_date_idx" ON "CheckInCode"("centerId", "date");
CREATE UNIQUE INDEX "CheckInClaim_userId_date_key" ON "CheckInClaim"("userId", "date");
CREATE INDEX "CheckInClaim_userId_idx" ON "CheckInClaim"("userId");
CREATE INDEX "CheckInClaim_date_idx" ON "CheckInClaim"("date");

-- AddForeignKey
ALTER TABLE "CheckInCode" ADD CONSTRAINT "CheckInCode_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "GarrinchaCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CheckInClaim" ADD CONSTRAINT "CheckInClaim_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckInClaim" ADD CONSTRAINT "CheckInClaim_checkInCodeId_fkey"
    FOREIGN KEY ("checkInCodeId") REFERENCES "CheckInCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Register migration
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT
    gen_random_uuid()::text,
    'check_in_code_system_v1',
    NOW(),
    '20260611130000_check_in_code_system',
    NULL,
    NULL,
    NOW(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE "migration_name" = '20260611130000_check_in_code_system'
);
