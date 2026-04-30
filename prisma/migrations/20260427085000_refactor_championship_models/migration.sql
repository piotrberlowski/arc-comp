-- Convert existing Championships foundation model to final shape without dropping data.

-- Drop backward-reference FK and index artifacts from Tournament.
ALTER TABLE "Tournament" DROP CONSTRAINT IF EXISTS "Tournament_championshipDayId_fkey";
DROP INDEX IF EXISTS "Tournament_championshipDayId_key";
DROP INDEX IF EXISTS "Tournament_organizerClub_championshipDayId_idx";
ALTER TABLE "Tournament" DROP COLUMN IF EXISTS "championshipDayId";

-- Rename ChampionshipDay to ChampionshipRound and refresh relation/index names.
ALTER TABLE "ChampionshipDay" DROP CONSTRAINT IF EXISTS "ChampionshipDay_championshipId_fkey";
ALTER TABLE "ChampionshipDay" DROP CONSTRAINT IF EXISTS "ChampionshipDay_tournamentId_fkey";
ALTER TABLE "ChampionshipDay" RENAME TO "ChampionshipRound";

DROP INDEX IF EXISTS "ChampionshipDay_tournamentId_key";
DROP INDEX IF EXISTS "ChampionshipDay_championshipId_idx";
DROP INDEX IF EXISTS "ChampionshipDay_championshipId_dayOrder_key";

CREATE UNIQUE INDEX "ChampionshipRound_tournamentId_key" ON "ChampionshipRound"("tournamentId");
CREATE INDEX "ChampionshipRound_championshipId_idx" ON "ChampionshipRound"("championshipId");
CREATE UNIQUE INDEX "ChampionshipRound_championshipId_dayOrder_key" ON "ChampionshipRound"("championshipId", "dayOrder");

-- Convert ChampionshipRegistration key fields in-place.
DROP INDEX IF EXISTS "ChampionshipRegistration_championshipId_registrationKey_key";

ALTER TABLE "ChampionshipRegistration" RENAME COLUMN "registrationKey" TO "membershipNo";
ALTER TABLE "ChampionshipRegistration" DROP COLUMN "displayNameSnapshot";
ALTER TABLE "ChampionshipRegistration" ADD COLUMN "competitorNumber" INTEGER;

WITH numbered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "championshipId" ORDER BY "createdAt", "id") AS rn
    FROM "ChampionshipRegistration"
)
UPDATE "ChampionshipRegistration" cr
SET "competitorNumber" = numbered.rn
FROM numbered
WHERE cr."id" = numbered."id";

ALTER TABLE "ChampionshipRegistration" ALTER COLUMN "competitorNumber" SET NOT NULL;

CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_membershipNo_key"
    ON "ChampionshipRegistration"("championshipId", "membershipNo");
CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_competitorNumber_key"
    ON "ChampionshipRegistration"("championshipId", "competitorNumber");

-- Recreate FKs with final names.
ALTER TABLE "ChampionshipRound" ADD CONSTRAINT "ChampionshipRound_championshipId_fkey"
    FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChampionshipRound" ADD CONSTRAINT "ChampionshipRound_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
