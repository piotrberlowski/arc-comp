-- DropForeignKey
ALTER TABLE "ChampionshipDay" DROP CONSTRAINT "ChampionshipDay_championshipId_fkey";

-- DropForeignKey
ALTER TABLE "ChampionshipDay" DROP CONSTRAINT "ChampionshipDay_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_championshipDayId_fkey";

-- DropIndex
DROP INDEX "ChampionshipRegistration_championshipId_registrationKey_key";

-- DropIndex
DROP INDEX "Tournament_championshipDayId_key";

-- DropIndex
DROP INDEX "Tournament_organizerClub_championshipDayId_idx";

-- AlterTable
ALTER TABLE "ChampionshipRegistration" DROP COLUMN "displayNameSnapshot",
DROP COLUMN "registrationKey",
ADD COLUMN     "competitorNumber" INTEGER NOT NULL,
ADD COLUMN     "membershipNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "championshipDayId";

-- DropTable
DROP TABLE "ChampionshipDay";

-- CreateTable
CREATE TABLE "ChampionshipRound" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "dayOrder" INTEGER NOT NULL,
    "label" TEXT,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "ChampionshipRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRound_tournamentId_key" ON "ChampionshipRound"("tournamentId");

-- CreateIndex
CREATE INDEX "ChampionshipRound_championshipId_idx" ON "ChampionshipRound"("championshipId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRound_championshipId_dayOrder_key" ON "ChampionshipRound"("championshipId", "dayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_membershipNo_key" ON "ChampionshipRegistration"("championshipId", "membershipNo");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_competitorNumber_key" ON "ChampionshipRegistration"("championshipId", "competitorNumber");

-- AddForeignKey
ALTER TABLE "ChampionshipRound" ADD CONSTRAINT "ChampionshipRound_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRound" ADD CONSTRAINT "ChampionshipRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
