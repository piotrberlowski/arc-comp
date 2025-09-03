/*
  Warnings:

  - Added the required column `membershipNo` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "membershipNo" TEXT NOT NULL;
