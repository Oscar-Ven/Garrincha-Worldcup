-- AlterTable: replace homeScore + awayScore on Prediction with outcome
ALTER TABLE "Prediction"
  ADD COLUMN "outcome" TEXT NOT NULL DEFAULT 'HOME';

ALTER TABLE "Prediction"
  ALTER COLUMN "outcome" DROP DEFAULT;

ALTER TABLE "Prediction"
  ADD CONSTRAINT "Prediction_outcome_check" CHECK ("outcome" IN ('HOME', 'DRAW', 'AWAY'));

ALTER TABLE "Prediction"
  DROP COLUMN "homeScore",
  DROP COLUMN "awayScore";
