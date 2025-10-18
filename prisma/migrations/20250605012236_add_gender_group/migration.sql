/*
  Warnings:

  - Added the required column `genderGroup` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GenderGroup" AS ENUM ('M', 'F');

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "genderGroup" "GenderGroup" NOT NULL;
