-- AlterTable
ALTER TABLE "GroupAssignment" ADD COLUMN     "isCaptain" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false;
