-- CreateTable
CREATE TABLE "GroupAssignment" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL,

    CONSTRAINT "GroupAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupAssignment_participantId_key" ON "GroupAssignment"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupAssignment_participantId_tournamentId_key" ON "GroupAssignment"("participantId", "tournamentId");

-- AddForeignKey
ALTER TABLE "GroupAssignment" ADD CONSTRAINT "GroupAssignment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAssignment" ADD CONSTRAINT "GroupAssignment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
