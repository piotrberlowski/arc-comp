-- This migration was superseded by 20260427001000_championships_foundation.
-- The foundation migration already creates the final Championship* schema
-- (ChampionshipRound + ChampionshipRegistration shape), so applying the old
-- refactor SQL would fail on fresh/prod databases.
SELECT 1;
