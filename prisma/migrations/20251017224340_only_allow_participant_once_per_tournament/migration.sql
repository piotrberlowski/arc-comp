/*
  Warnings:

  - A unique constraint covering the columns `[tournamentId,membershipNo]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Participant_tournamentId_membershipNo_key" ON "Participant"("tournamentId", "membershipNo");
