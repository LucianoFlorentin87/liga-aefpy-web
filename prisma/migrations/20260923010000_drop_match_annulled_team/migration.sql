-- El enfoque de "anular partido + bonificación de puntos aparte" se
-- descartó: ahora todos los partidos del equipo retirado (jugados o no) se
-- resuelven como un 3-0 walkover normal vía forfeitedTeamId, que ya cuenta
-- como PJ/PG en las columnas de siempre — annulledTeamId queda sin uso.
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_annulledTeamId_fkey";
DROP INDEX IF EXISTS "matches_annulledTeamId_idx";
ALTER TABLE "matches" DROP COLUMN IF EXISTS "annulledTeamId";
