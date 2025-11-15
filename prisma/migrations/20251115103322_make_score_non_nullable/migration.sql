-- Delete any ParticipantScore records with null scores (shouldn't exist based on current logic, but safe to clean up)
DELETE FROM "ParticipantScore" WHERE "score" IS NULL;

-- AlterTable
ALTER TABLE "ParticipantScore" ALTER COLUMN "score" SET NOT NULL;

