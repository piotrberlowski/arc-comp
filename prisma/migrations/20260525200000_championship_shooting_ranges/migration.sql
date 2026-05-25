-- AlterTable
ALTER TABLE "Championship" ADD COLUMN "rangeCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ChampionshipRound" ADD COLUMN "rangeNumber" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX "ChampionshipRound_championshipId_dayOrder_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRound_championshipId_dayOrder_rangeNumber_key" ON "ChampionshipRound"("championshipId", "dayOrder", "rangeNumber");

-- CreateTable
CREATE TABLE "ChampionshipDivisionRange" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "dayOrder" INTEGER NOT NULL,
    "ageGroupId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "genderGroup" "GenderGroup" NOT NULL,
    "rangeNumber" INTEGER NOT NULL,

    CONSTRAINT "ChampionshipDivisionRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChampionshipDivisionRange_championshipId_dayOrder_idx" ON "ChampionshipDivisionRange"("championshipId", "dayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipDivisionRange_championshipId_dayOrder_ageGroupId_categoryId_genderGroup_key" ON "ChampionshipDivisionRange"("championshipId", "dayOrder", "ageGroupId", "categoryId", "genderGroup");

-- AddForeignKey
ALTER TABLE "ChampionshipDivisionRange" ADD CONSTRAINT "ChampionshipDivisionRange_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipDivisionRange" ADD CONSTRAINT "ChampionshipDivisionRange_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipDivisionRange" ADD CONSTRAINT "ChampionshipDivisionRange_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EquipmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
