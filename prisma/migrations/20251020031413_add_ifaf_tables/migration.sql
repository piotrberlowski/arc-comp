-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "IFAFBowStyleMapping" (
    "id" TEXT NOT NULL,
    "equipmentCategoryId" TEXT NOT NULL,
    "ifafBowStyleCode" TEXT NOT NULL,
    "ifafBowStyleName" TEXT NOT NULL,
    "ifafBowStyleNumber" TEXT NOT NULL,

    CONSTRAINT "IFAFBowStyleMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFAFAgeGenderMapping" (
    "id" TEXT NOT NULL,
    "ageGroupId" TEXT NOT NULL,
    "genderGroup" TEXT NOT NULL,
    "ifafCategoryCode" TEXT NOT NULL,
    "ifafCategoryName" TEXT NOT NULL,

    CONSTRAINT "IFAFAgeGenderMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IFAFBowStyleMapping_equipmentCategoryId_key" ON "IFAFBowStyleMapping"("equipmentCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "IFAFAgeGenderMapping_ageGroupId_genderGroup_key" ON "IFAFAgeGenderMapping"("ageGroupId", "genderGroup");

-- AddForeignKey
ALTER TABLE "IFAFBowStyleMapping" ADD CONSTRAINT "IFAFBowStyleMapping_equipmentCategoryId_fkey" FOREIGN KEY ("equipmentCategoryId") REFERENCES "EquipmentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFAFAgeGenderMapping" ADD CONSTRAINT "IFAFAgeGenderMapping_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
