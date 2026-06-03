-- A. Revert Prediction: replace outcome with homeScore + awayScore
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_outcome_check";
ALTER TABLE "Prediction" DROP COLUMN "outcome";
ALTER TABLE "Prediction" ADD COLUMN "homeScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Prediction" ADD COLUMN "awayScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Prediction" ALTER COLUMN "homeScore" DROP DEFAULT;
ALTER TABLE "Prediction" ALTER COLUMN "awayScore" DROP DEFAULT;

-- B. User: add new columns
ALTER TABLE "User" ADD COLUMN "fullName" TEXT NOT NULL DEFAULT 'Player';
ALTER TABLE "User" ADD COLUMN "nickname" TEXT NOT NULL DEFAULT 'Player';
ALTER TABLE "User" ADD COLUMN "firstActivatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "competitionCenterId" TEXT;
ALTER TABLE "User" ADD COLUMN "competitionCenterLockedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "accessTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "accessTokenCreatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "accessTokenRevokedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastAccessLinkSentAt" TIMESTAMP(3);

-- C. User: relax constraints
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- D. User: add competition center FK
ALTER TABLE "User" ADD CONSTRAINT "User_competitionCenterId_fkey" FOREIGN KEY ("competitionCenterId") REFERENCES "GarrinchaCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- E. User: add unique index for accessTokenHash
CREATE INDEX "User_accessTokenHash_idx" ON "User"("accessTokenHash") WHERE "accessTokenHash" IS NOT NULL;

-- F. Match: add score-source audit columns
ALTER TABLE "Match" ADD COLUMN "scoreSource" TEXT;
ALTER TABLE "Match" ADD COLUMN "externalMatchId" TEXT;
ALTER TABLE "Match" ADD COLUMN "externalUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN "scoreSyncStatus" TEXT;
ALTER TABLE "Match" ADD COLUMN "lastScoreSyncAt" TIMESTAMP(3);
