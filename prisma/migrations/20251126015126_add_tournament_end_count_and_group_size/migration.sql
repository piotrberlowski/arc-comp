-- AlterTable: Add endCount and groupSize columns to Tournament (nullable initially)
ALTER TABLE "Tournament" ADD COLUMN "endCount" INTEGER,
ADD COLUMN "groupSize" INTEGER;

-- Update existing tournaments by copying values from their RoundFormat
UPDATE "Tournament" t
SET "endCount" = rf."endCount",
    "groupSize" = rf."groupSize"
FROM "RoundFormat" rf
WHERE t."formatId" = rf.id;

-- AlterTable: Make columns non-nullable now that data is populated
ALTER TABLE "Tournament" ALTER COLUMN "endCount" SET NOT NULL,
ALTER COLUMN "groupSize" SET NOT NULL;

