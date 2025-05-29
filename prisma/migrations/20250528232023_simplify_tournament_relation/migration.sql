/*
  Warnings:

  - You are about to drop the column `organizerUserId` on the `Tournament` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_organizerUserId_organizerClub_fkey";

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "organizerUserId";
