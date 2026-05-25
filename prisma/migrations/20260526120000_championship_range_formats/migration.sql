-- CreateTable
CREATE TABLE "ChampionshipRange" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "rangeNumber" INTEGER NOT NULL,
    "formatId" TEXT NOT NULL,

    CONSTRAINT "ChampionshipRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChampionshipRange_championshipId_idx" ON "ChampionshipRange"("championshipId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRange_championshipId_rangeNumber_key" ON "ChampionshipRange"("championshipId", "rangeNumber");

-- AddForeignKey
ALTER TABLE "ChampionshipRange" ADD CONSTRAINT "ChampionshipRange_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRange" ADD CONSTRAINT "ChampionshipRange_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "RoundFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
