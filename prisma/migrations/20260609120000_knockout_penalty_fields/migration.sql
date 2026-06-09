-- Add knockout penalty fields to Match
ALTER TABLE "Match" ADD COLUMN "wentToPenalties" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Match" ADD COLUMN "penaltyWinner" TEXT;
ALTER TABLE "Match" ADD COLUMN "homePenaltyScore" INTEGER;
ALTER TABLE "Match" ADD COLUMN "awayPenaltyScore" INTEGER;

-- Add penalty prediction fields to Prediction
ALTER TABLE "Prediction" ADD COLUMN "penaltyWinner" TEXT;
ALTER TABLE "Prediction" ADD COLUMN "homePenaltyScore" INTEGER;
ALTER TABLE "Prediction" ADD COLUMN "awayPenaltyScore" INTEGER;
