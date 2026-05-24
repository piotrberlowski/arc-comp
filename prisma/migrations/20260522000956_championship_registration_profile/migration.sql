/*
  Warnings:

  - Added the required column `ageGroupId` to the `ChampionshipRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `ChampionshipRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genderGroup` to the `ChampionshipRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ChampionshipRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChampionshipRegistration" ADD COLUMN     "ageGroupId" TEXT NOT NULL,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "club" TEXT,
ADD COLUMN     "genderGroup" "GenderGroup" NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ChampionshipRegistration" ADD CONSTRAINT "ChampionshipRegistration_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRegistration" ADD CONSTRAINT "ChampionshipRegistration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EquipmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
