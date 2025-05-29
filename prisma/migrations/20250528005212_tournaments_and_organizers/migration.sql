/*
  Warnings:

  - You are about to drop the `Club` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "RoundFormat" ADD COLUMN     "endCount" INTEGER NOT NULL DEFAULT 28,
ADD COLUMN     "groupSize" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Club";

-- CreateTable
CREATE TABLE "Organizer" (
    "userId" TEXT NOT NULL,
    "club" TEXT NOT NULL,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("userId","club")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "formatId" TEXT NOT NULL,
    "organizerUserId" TEXT NOT NULL,
    "organizerClub" TEXT NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "RoundFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_organizerUserId_organizerClub_fkey" FOREIGN KEY ("organizerUserId", "organizerClub") REFERENCES "Organizer"("userId", "club") ON DELETE RESTRICT ON UPDATE CASCADE;
