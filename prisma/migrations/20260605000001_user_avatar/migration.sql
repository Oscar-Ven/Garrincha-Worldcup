-- Add avatar URL field to User (nullable, stores image URL or base64 data URL)
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
