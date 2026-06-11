-- Add ActivationCodeClaim table.
-- Tracks which users have claimed a bonus for a given CenterSession code.
-- @@unique([userId, sessionId]) prevents the same player from claiming twice.

CREATE TABLE "ActivationCodeClaim" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "sessionId" TEXT         NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivationCodeClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActivationCodeClaim_userId_sessionId_key"
    ON "ActivationCodeClaim"("userId", "sessionId");

CREATE INDEX "ActivationCodeClaim_userId_idx"
    ON "ActivationCodeClaim"("userId");

ALTER TABLE "ActivationCodeClaim"
    ADD CONSTRAINT "ActivationCodeClaim_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivationCodeClaim"
    ADD CONSTRAINT "ActivationCodeClaim_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "CenterSession"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
