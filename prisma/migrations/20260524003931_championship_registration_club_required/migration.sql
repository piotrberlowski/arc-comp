/*
  Warnings:

  - Made the column `club` on table `ChampionshipRegistration` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ChampionshipRegistration" ALTER COLUMN "club" SET NOT NULL;
