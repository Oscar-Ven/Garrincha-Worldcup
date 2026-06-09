-- AlterTable: enforce unique nicknames
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
