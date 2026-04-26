-- CreateTable
CREATE TABLE "Championship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizerClub" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Championship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionshipRound" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "dayOrder" INTEGER NOT NULL,
    "label" TEXT,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "ChampionshipRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionshipRegistration" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "membershipNo" TEXT NOT NULL,
    "competitorNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionshipRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Championship_organizerClub_idx" ON "Championship"("organizerClub");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRound_tournamentId_key" ON "ChampionshipRound"("tournamentId");

-- CreateIndex
CREATE INDEX "ChampionshipRound_championshipId_idx" ON "ChampionshipRound"("championshipId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRound_championshipId_dayOrder_key" ON "ChampionshipRound"("championshipId", "dayOrder");

-- CreateIndex
CREATE INDEX "ChampionshipRegistration_championshipId_idx" ON "ChampionshipRegistration"("championshipId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_membershipNo_key" ON "ChampionshipRegistration"("championshipId", "membershipNo");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_competitorNumber_key" ON "ChampionshipRegistration"("championshipId", "competitorNumber");

-- CreateIndex
ALTER TABLE "ChampionshipRound" ADD CONSTRAINT "ChampionshipRound_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRound" ADD CONSTRAINT "ChampionshipRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRegistration" ADD CONSTRAINT "ChampionshipRegistration_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
