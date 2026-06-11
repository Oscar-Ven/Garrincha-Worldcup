-- CreateTable
CREATE TABLE "DailyBonusCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bonusDate" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 3,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DailyBonusCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBonusClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyBonusCodeId" TEXT NOT NULL,
    "bonusDate" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 3,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBonusClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyBonusCode_bonusDate_isActive_idx" ON "DailyBonusCode"("bonusDate", "isActive");

-- CreateIndex
CREATE INDEX "DailyBonusCode_code_idx" ON "DailyBonusCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBonusClaim_userId_bonusDate_key" ON "DailyBonusClaim"("userId", "bonusDate");

-- CreateIndex
CREATE INDEX "DailyBonusClaim_userId_idx" ON "DailyBonusClaim"("userId");

-- CreateIndex
CREATE INDEX "DailyBonusClaim_bonusDate_idx" ON "DailyBonusClaim"("bonusDate");

-- AddForeignKey
ALTER TABLE "DailyBonusClaim" ADD CONSTRAINT "DailyBonusClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBonusClaim" ADD CONSTRAINT "DailyBonusClaim_dailyBonusCodeId_fkey" FOREIGN KEY ("dailyBonusCodeId") REFERENCES "DailyBonusCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
