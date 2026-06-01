-- Backfill shortName for formats created before seed used "Flint Round" / "Indoor Round" names.
UPDATE "RoundFormat" SET "shortName" = 'UAR' WHERE "name" = 'Unmarked Animal Round' AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = '3D-Std' WHERE "name" = '3D-Standard Round' AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = '3D Hunting' WHERE "name" = '3D Hunting Round (1 Arrow)' AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = 'Field' WHERE "name" = 'Field Round' AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = 'Hunter' WHERE "name" = 'Hunter Round (Field)' AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = 'MAR' WHERE "name" = 'Marked Animal Round' AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = 'Flint' WHERE "name" IN ('Flint', 'Flint Round') AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = 'Indoor' WHERE "name" IN ('Indoor', 'Indoor Round') AND "shortName" IS NULL;
UPDATE "RoundFormat" SET "shortName" = 'Custom' WHERE "name" = 'Custom' AND "shortName" IS NULL;
