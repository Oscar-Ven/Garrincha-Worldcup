-- CreateTable: CenterSession — admin-generated daily codes per center
CREATE TABLE "CenterSession" (
    "id"        TEXT NOT NULL,
    "centerId"  TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CenterCheckIn — one active check-in per user
CREATE TABLE "CenterCheckIn" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "centerId"  TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CenterSession_code_key"      ON "CenterSession"("code");
CREATE INDEX "CenterSession_centerId_idx"          ON "CenterSession"("centerId");
CREATE INDEX "CenterSession_expiresAt_idx"         ON "CenterSession"("expiresAt");

CREATE UNIQUE INDEX "CenterCheckIn_userId_key"     ON "CenterCheckIn"("userId");
CREATE INDEX "CenterCheckIn_expiresAt_idx"         ON "CenterCheckIn"("expiresAt");

-- AddForeignKey
ALTER TABLE "CenterSession" ADD CONSTRAINT "CenterSession_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "GarrinchaCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CenterCheckIn" ADD CONSTRAINT "CenterCheckIn_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
