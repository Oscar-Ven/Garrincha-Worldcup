-- Add pending score fields to store API-suggested scores awaiting admin approval
ALTER TABLE "Match" ADD COLUMN "pendingHomeScore" INTEGER;
ALTER TABLE "Match" ADD COLUMN "pendingAwayScore" INTEGER;
