-- CreateTable: audit log for competition center changes
CREATE TABLE "CenterChangeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromCenterId" TEXT,
    "toCenterId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CenterChangeLog_userId_idx" ON "CenterChangeLog"("userId");

-- AddForeignKey
ALTER TABLE "CenterChangeLog" ADD CONSTRAINT "CenterChangeLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
