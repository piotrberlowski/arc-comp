-- CreateTable
CREATE TABLE "ParticipantScore" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "score" INTEGER,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ParticipantScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantScore_participantId_key" ON "ParticipantScore"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantScore_participantId_tournamentId_key" ON "ParticipantScore"("participantId", "tournamentId");

-- AddForeignKey
ALTER TABLE "ParticipantScore" ADD CONSTRAINT "ParticipantScore_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantScore" ADD CONSTRAINT "ParticipantScore_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
