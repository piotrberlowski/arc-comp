-- CreateTable
CREATE TABLE "EquipmentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EquipmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgeGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageGroupId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "club" TEXT,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentCategory_name_key" ON "EquipmentCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgeGroup_name_key" ON "AgeGroup"("name");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EquipmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
