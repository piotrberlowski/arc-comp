-- AlterTable
ALTER TABLE "Participant" ADD COLUMN "competitorNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tournamentId_competitorNumber_key" ON "Participant"("tournamentId", "competitorNumber");
