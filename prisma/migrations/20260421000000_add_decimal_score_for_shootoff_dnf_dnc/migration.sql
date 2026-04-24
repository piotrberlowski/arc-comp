-- AlterTable: Change score from INT to DECIMAL(10,3) to support:
-- - Shootoff scores as decimal (e.g., 150.028 = score 150, shootoff 28)
-- - DNF encoded as -1
-- - DNC encoded as -2
ALTER TABLE "ParticipantScore" ALTER COLUMN "score" TYPE DECIMAL(10,3);
